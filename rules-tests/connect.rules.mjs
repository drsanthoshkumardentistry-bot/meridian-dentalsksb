import { describe, it, beforeAll, afterAll, beforeEach } from "vitest";
import { assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import {
  doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, addDoc, collection, query, where, orderBy, limit,
  writeBatch, increment, serverTimestamp, deleteField, getCountFromServer,
} from "firebase/firestore";
import { setup, as, anon, seed } from "./helpers.mjs";

let env;
beforeAll(async () => { env = await setup(); });
afterAll(async () => { await env.cleanup(); });

const dentist = (fullName, status = "verified") => ({
  fullName, qualification: "MDS", specialty: "endodontics", status, listed: false,
  councilState: "TN", registrationNo: "TN-1", geohash: "tdr1", geo: { lat: 11, lng: 76 },
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env, async (db) => {
    await setDoc(doc(db, "connectDentists", "alice"), dentist("Dr Alice"));
    await setDoc(doc(db, "connectDentists", "bob"), dentist("Dr Bob"));
    await setDoc(doc(db, "connectDentists", "pat"), dentist("Dr Pending", "pending"));
    await setDoc(doc(db, "connectDentists", "admin"), dentist("Dr Admin"));
    await setDoc(doc(db, "connectAdmins", "admin"), { ok: true });
  });
});

const newPost = (over = {}) => ({
  authorId: "alice", authorName: "Dr Alice", authorQualification: "MDS", authorSpecialty: "endodontics",
  type: "case", title: "Abscess after RCT", body: "Recurrent swelling in 46 after obturation.",
  likeCount: 0, commentCount: 0, createdAt: serverTimestamp(), ...over,
});
const seedPost = (id = "p1", over = {}) =>
  seed(env, (db) => setDoc(doc(db, "connectPosts", id), { ...newPost(over), createdAt: new Date() }));

describe("posts: create and read", () => {
  it("a verified dentist can post under their own verified identity", async () => {
    await assertSucceeds(setDoc(doc(as(env, "alice"), "connectPosts", "n1"), newPost()));
  });
  it("an event post carries a date and place", async () => {
    await assertSucceeds(setDoc(doc(as(env, "alice"), "connectPosts", "n2"), newPost({ type: "event", eventDate: "2026-12-01", venue: "Coimbatore" })));
  });
  it("pending dentists, other accounts and signed-out users cannot post", async () => {
    await assertFails(setDoc(doc(as(env, "pat"), "connectPosts", "n1"), newPost({ authorId: "pat", authorName: "Dr Pending" })));
    await assertFails(setDoc(doc(as(env, "stranger"), "connectPosts", "n1"), newPost({ authorId: "stranger" })));
    await assertFails(setDoc(doc(anon(env), "connectPosts", "n1"), newPost()));
  });
  it("an unverified email cannot post even with a verified profile", async () => {
    await assertFails(setDoc(doc(as(env, "alice", { email_verified: false }), "connectPosts", "n1"), newPost()));
  });
  it("the author name, specialty and qualification must match the verified profile", async () => {
    const db = as(env, "alice");
    await assertFails(setDoc(doc(db, "connectPosts", "a"), newPost({ authorName: "Dr Somebody Else" })));
    await assertFails(setDoc(doc(db, "connectPosts", "b"), newPost({ authorSpecialty: "orthodontics" })));
    await assertFails(setDoc(doc(db, "connectPosts", "c"), newPost({ authorQualification: "Professor" })));
  });
  it("cannot post as someone else, start with counts, use another type, or add unknown fields", async () => {
    const db = as(env, "alice");
    await assertFails(setDoc(doc(db, "connectPosts", "a"), newPost({ authorId: "bob", authorName: "Dr Bob" })));
    await assertFails(setDoc(doc(db, "connectPosts", "b"), newPost({ likeCount: 5 })));
    await assertFails(setDoc(doc(db, "connectPosts", "c"), newPost({ commentCount: 1 })));
    await assertFails(setDoc(doc(db, "connectPosts", "d"), newPost({ type: "advert" })));
    await assertFails(setDoc(doc(db, "connectPosts", "e"), newPost({ isPinned: true })));
    await assertFails(setDoc(doc(db, "connectPosts", "f"), newPost({ createdAt: new Date("2020-01-01") })));
  });
  it("title and body limits are enforced", async () => {
    const db = as(env, "alice");
    await assertFails(setDoc(doc(db, "connectPosts", "a"), newPost({ title: "ab" })));
    await assertFails(setDoc(doc(db, "connectPosts", "b"), newPost({ title: "x".repeat(121) })));
    await assertFails(setDoc(doc(db, "connectPosts", "c"), newPost({ body: "short" })));
    await assertFails(setDoc(doc(db, "connectPosts", "d"), newPost({ body: "x".repeat(2001) })));
  });
  it("only verified dentists can read the feed", async () => {
    await seedPost();
    const feed = (db) => getDocs(query(collection(db, "connectPosts"), orderBy("createdAt", "desc"), limit(20)));
    await assertSucceeds(feed(as(env, "bob")));
    await assertFails(feed(as(env, "pat")));
    await assertFails(feed(anon(env)));
    await assertSucceeds(getDoc(doc(as(env, "bob"), "connectPosts", "p1")));
    await assertFails(getDoc(doc(as(env, "pat"), "connectPosts", "p1")));
  });
  it("can list one author's posts and the upcoming events", async () => {
    await seedPost("p1");
    await seedPost("e1", { type: "event", eventDate: "2026-12-01", venue: "Zoom" });
    const db = as(env, "bob");
    await assertSucceeds(getDocs(query(collection(db, "connectPosts"), where("authorId", "==", "alice"), limit(60))));
    await assertSucceeds(getDocs(query(collection(db, "connectPosts"), where("eventDate", ">=", "2026-11-11"), orderBy("eventDate", "asc"), limit(6))));
  });
});

describe("posts: delete", () => {
  it("authors and staff can delete; other dentists cannot", async () => {
    await seedPost("p1"); await seedPost("p2"); await seedPost("p3");
    await assertFails(deleteDoc(doc(as(env, "bob"), "connectPosts", "p1")));
    await assertSucceeds(deleteDoc(doc(as(env, "alice"), "connectPosts", "p2")));
    await assertSucceeds(deleteDoc(doc(as(env, "admin"), "connectPosts", "p3")));
  });
});

describe("likes", () => {
  const like = (db, uid, postId, delta) => {
    const b = writeBatch(db);
    b.set(doc(db, "connectPosts", postId, "likes", uid), { createdAt: serverTimestamp() });
    b.update(doc(db, "connectPosts", postId), { likeCount: increment(delta) });
    return b.commit();
  };
  const unlike = (db, uid, postId) => {
    const b = writeBatch(db);
    b.delete(doc(db, "connectPosts", postId, "likes", uid));
    b.update(doc(db, "connectPosts", postId), { likeCount: increment(-1) });
    return b.commit();
  };

  it("a like adds its own record and exactly one to the counter", async () => {
    await seedPost();
    await assertSucceeds(like(as(env, "bob"), "bob", "p1", 1));
  });
  it("the counter cannot move without the like record, or by more than one", async () => {
    await seedPost();
    await assertFails(updateDoc(doc(as(env, "bob"), "connectPosts", "p1"), { likeCount: increment(1) }));
    await assertFails(like(as(env, "bob"), "bob", "p1", 2));
  });
  it("cannot like twice", async () => {
    await seedPost();
    await assertSucceeds(like(as(env, "bob"), "bob", "p1", 1));
    await assertFails(like(as(env, "bob"), "bob", "p1", 1));
  });
  it("cannot like on someone else's behalf", async () => {
    await seedPost();
    await assertFails(like(as(env, "bob"), "alice", "p1", 1));
  });
  it("an unlike removes the record and one from the counter", async () => {
    await seedPost("p1", { likeCount: 1 });
    await seed(env, (db) => setDoc(doc(db, "connectPosts", "p1", "likes", "bob"), { createdAt: new Date() }));
    await assertSucceeds(unlike(as(env, "bob"), "bob", "p1"));
  });
  it("a dentist can see whether they liked, but cannot list who liked", async () => {
    await seedPost();
    await assertSucceeds(getDoc(doc(as(env, "bob"), "connectPosts", "p1", "likes", "bob")));
    await assertFails(getDoc(doc(as(env, "bob"), "connectPosts", "p1", "likes", "alice")));
    await assertFails(getDocs(collection(as(env, "bob"), "connectPosts", "p1", "likes")));
  });
});

describe("comments", () => {
  const comment = (over = {}) => ({ authorId: "bob", authorName: "Dr Bob", authorSpecialty: "endodontics", text: "Check for a missed canal.", createdAt: serverTimestamp(), ...over });
  const add = (db, data, delta = 1) => {
    const b = writeBatch(db);
    b.set(doc(db, "connectPosts", "p1", "comments", "c1"), data);
    b.update(doc(db, "connectPosts", "p1"), { commentCount: increment(delta) });
    return b.commit();
  };

  it("a verified dentist can comment under their own identity", async () => {
    await seedPost();
    await assertSucceeds(add(as(env, "bob"), comment()));
  });
  it("cannot comment as someone else, as a pending dentist, with a wrong name, or too long", async () => {
    await seedPost();
    await assertFails(add(as(env, "bob"), comment({ authorId: "alice", authorName: "Dr Alice" })));
    await assertFails(add(as(env, "pat"), comment({ authorId: "pat", authorName: "Dr Pending" })));
    await assertFails(add(as(env, "bob"), comment({ authorName: "Dr Fake" })));
    await assertFails(add(as(env, "bob"), comment({ text: "x".repeat(801) })));
    await assertFails(add(as(env, "bob"), comment({ text: "" })));
  });
  it("comments are readable by verified dentists only", async () => {
    await seedPost();
    await seed(env, (db) => setDoc(doc(db, "connectPosts", "p1", "comments", "c1"), comment({ createdAt: new Date() })));
    const list = (db) => getDocs(query(collection(db, "connectPosts", "p1", "comments"), orderBy("createdAt", "asc"), limit(100)));
    await assertSucceeds(list(as(env, "alice")));
    await assertFails(list(as(env, "pat")));
  });
  it("authors and staff can delete a comment, others cannot", async () => {
    await seedPost("p1", { commentCount: 1 });
    await seed(env, (db) => setDoc(doc(db, "connectPosts", "p1", "comments", "c1"), comment({ createdAt: new Date() })));
    await assertFails(deleteDoc(doc(as(env, "alice"), "connectPosts", "p1", "comments", "c1")));
    await assertSucceeds(deleteDoc(doc(as(env, "bob"), "connectPosts", "p1", "comments", "c1")));
  });
});

describe("posts: nothing else can be changed by other dentists", () => {
  it("title, body and author cannot be edited by someone else", async () => {
    await seedPost();
    const ref = doc(as(env, "bob"), "connectPosts", "p1");
    await assertFails(updateDoc(ref, { title: "Hijacked" }));
    await assertFails(updateDoc(ref, { authorName: "Dr Bob" }));
    await assertFails(updateDoc(ref, { likeCount: 99 }));
  });
});

describe("follows", () => {
  it("a dentist follows and unfollows as themselves", async () => {
    const db = as(env, "alice");
    await assertSucceeds(setDoc(doc(db, "connectFollows", "alice_bob"), { followerId: "alice", followeeId: "bob", createdAt: serverTimestamp() }));
    await assertSucceeds(getDocs(query(collection(db, "connectFollows"), where("followerId", "==", "alice"))));
    await assertSucceeds(deleteDoc(doc(db, "connectFollows", "alice_bob")));
  });
  it("cannot follow as someone else or with a mismatched id", async () => {
    const db = as(env, "bob");
    await assertFails(setDoc(doc(db, "connectFollows", "alice_bob"), { followerId: "alice", followeeId: "bob", createdAt: serverTimestamp() }));
    await assertFails(setDoc(doc(db, "connectFollows", "bob_zed"), { followerId: "bob", followeeId: "alice", createdAt: serverTimestamp() }));
  });
  it("cannot read another dentist's follow list", async () => {
    await seed(env, (db) => setDoc(doc(db, "connectFollows", "alice_bob"), { followerId: "alice", followeeId: "bob", createdAt: new Date() }));
    await assertFails(getDocs(query(collection(as(env, "bob"), "connectFollows"), where("followerId", "==", "alice"))));
  });
});

describe("reports", () => {
  const report = { postId: "p1", commentId: null, reporterId: "bob", reason: "Spam or advertising", createdAt: serverTimestamp() };
  it("a verified dentist can report; only staff can read or clear reports", async () => {
    const ref = await assertSucceeds(addDoc(collection(as(env, "bob"), "connectReports"), report));
    await assertFails(getDoc(doc(as(env, "bob"), "connectReports", ref.id)));
    await assertSucceeds(getDoc(doc(as(env, "admin"), "connectReports", ref.id)));
    await assertSucceeds(getDocs(query(collection(as(env, "admin"), "connectReports"), orderBy("createdAt", "desc"), limit(50))));
    await assertFails(deleteDoc(doc(as(env, "bob"), "connectReports", ref.id)));
    await assertSucceeds(deleteDoc(doc(as(env, "admin"), "connectReports", ref.id)));
  });
  it("cannot report as someone else or with a long reason", async () => {
    await assertFails(addDoc(collection(as(env, "bob"), "connectReports"), { ...report, reporterId: "alice" }));
    await assertFails(addDoc(collection(as(env, "bob"), "connectReports"), { ...report, reason: "x".repeat(201) }));
    await assertFails(addDoc(collection(as(env, "pat"), "connectReports"), { ...report, reporterId: "pat" }));
  });
});

describe("dentist profiles", () => {
  it("a new dentist can register as pending but cannot verify themselves", async () => {
    const db = as(env, "newbie");
    await assertSucceeds(setDoc(doc(db, "connectDentists", "newbie"), dentist("Dr New", "pending")));
    await assertFails(setDoc(doc(as(env, "newbie2"), "connectDentists", "newbie2"), dentist("Dr New", "verified")));
    await assertFails(updateDoc(doc(db, "connectDentists", "newbie"), { status: "verified" }));
  });
  it("a verified dentist can change contact settings but not their name or status", async () => {
    const ref = doc(as(env, "alice"), "connectDentists", "alice");
    await assertSucceeds(updateDoc(ref, { acceptingReferrals: true }));
    await assertFails(updateDoc(ref, { fullName: "Dr Someone Else" }));
    await assertFails(updateDoc(ref, { status: "suspended" }));
  });
  it("staff can verify, and nobody else can read a private profile", async () => {
    await assertSucceeds(updateDoc(doc(as(env, "admin"), "connectDentists", "pat"), { status: "verified", verifiedBy: "admin" }));
    await assertFails(getDoc(doc(as(env, "bob"), "connectDentists", "alice")));
    await assertSucceeds(getDoc(doc(as(env, "alice"), "connectDentists", "alice")));
  });
});

describe("editing a post", () => {
  const edit = { title: "Corrected title", body: "A corrected and longer body text.", editedAt: serverTimestamp() };
  it("the author can fix the title and text, and the edit time must be stamped", async () => {
    await seedPost();
    const ref = doc(as(env, "alice"), "connectPosts", "p1");
    await assertSucceeds(updateDoc(ref, edit));
    await assertFails(updateDoc(ref, { title: "No stamp", body: "A corrected and longer body text." }));
    await assertFails(updateDoc(ref, { ...edit, editedAt: new Date("2020-01-01") }));
  });
  it("other dentists cannot edit it", async () => {
    await seedPost();
    await assertFails(updateDoc(doc(as(env, "bob"), "connectPosts", "p1"), edit));
  });
  it("type, author, counters and unknown fields stay fixed", async () => {
    await seedPost();
    const ref = doc(as(env, "alice"), "connectPosts", "p1");
    await assertFails(updateDoc(ref, { ...edit, type: "event" }));
    await assertFails(updateDoc(ref, { ...edit, authorName: "Dr Else" }));
    await assertFails(updateDoc(ref, { ...edit, authorId: "bob" }));
    await assertFails(updateDoc(ref, { ...edit, likeCount: 50 }));
    await assertFails(updateDoc(ref, { ...edit, isPinned: true }));
  });
  it("length limits still apply", async () => {
    await seedPost();
    const ref = doc(as(env, "alice"), "connectPosts", "p1");
    await assertFails(updateDoc(ref, { ...edit, title: "ab" }));
    await assertFails(updateDoc(ref, { ...edit, body: "short" }));
    await assertFails(updateDoc(ref, { ...edit, body: "x".repeat(2001) }));
  });
  it("a topic can be set, changed or removed", async () => {
    await seedPost("p1", { tag: "endodontics" });
    const ref = doc(as(env, "alice"), "connectPosts", "p1");
    await assertSucceeds(updateDoc(ref, { ...edit, tag: "implantology" }));
    await assertSucceeds(updateDoc(ref, { ...edit, tag: deleteField() }));
  });
  it("an event keeps a date and place; other posts cannot gain them", async () => {
    await seedPost("e1", { type: "event", eventDate: "2026-12-01", venue: "Zoom" });
    const ev = doc(as(env, "alice"), "connectPosts", "e1");
    await assertSucceeds(updateDoc(ev, { ...edit, eventDate: "2026-12-05", venue: "Chennai" }));
    await assertFails(updateDoc(ev, { ...edit, eventDate: "2026-12-05", venue: "" }));
    await seedPost("p1");
    await assertFails(updateDoc(doc(as(env, "alice"), "connectPosts", "p1"), { ...edit, eventDate: "2026-12-05", venue: "Chennai" }));
  });
});

describe("accepted answer on a question", () => {
  const comment = { authorId: "bob", authorName: "Dr Bob", authorSpecialty: "endodontics", text: "Try a CBCT.", createdAt: new Date() };
  beforeEach(async () => {
    await seedPost("q1", { type: "question", commentCount: 1 });
    await seedPost("p1", { commentCount: 1 });
    await seed(env, async (db) => {
      await setDoc(doc(db, "connectPosts", "q1", "comments", "c1"), comment);
      await setDoc(doc(db, "connectPosts", "p1", "comments", "c1"), comment);
    });
  });
  it("only the asker can mark an existing comment, and can clear it again", async () => {
    await assertSucceeds(updateDoc(doc(as(env, "alice"), "connectPosts", "q1"), { acceptedCommentId: "c1" }));
    await assertFails(updateDoc(doc(as(env, "bob"), "connectPosts", "q1"), { acceptedCommentId: "c1" }));
    await assertSucceeds(updateDoc(doc(as(env, "alice"), "connectPosts", "q1"), { acceptedCommentId: "" }));
  });
  it("needs a real comment, a question, and nothing else changed at the same time", async () => {
    await assertFails(updateDoc(doc(as(env, "alice"), "connectPosts", "q1"), { acceptedCommentId: "ghost" }));
    await assertFails(updateDoc(doc(as(env, "alice"), "connectPosts", "p1"), { acceptedCommentId: "c1" }));
    await assertFails(updateDoc(doc(as(env, "alice"), "connectPosts", "q1"), { acceptedCommentId: "c1", likeCount: 9 }));
  });
});

describe("saved posts", () => {
  const save = (uid, postId) => ({ userId: uid, postId, createdAt: serverTimestamp() });
  it("a dentist saves, lists and removes their own", async () => {
    const db = as(env, "bob");
    await assertSucceeds(setDoc(doc(db, "connectSaves", "bob_p1"), save("bob", "p1")));
    await assertSucceeds(getDocs(query(collection(db, "connectSaves"), where("userId", "==", "bob"), limit(200))));
    await assertSucceeds(deleteDoc(doc(db, "connectSaves", "bob_p1")));
  });
  it("cannot save for someone else, with a wrong id, or as a pending dentist", async () => {
    await assertFails(setDoc(doc(as(env, "alice"), "connectSaves", "bob_p1"), save("bob", "p1")));
    await assertFails(setDoc(doc(as(env, "bob"), "connectSaves", "bob_other"), save("bob", "p1")));
    await assertFails(setDoc(doc(as(env, "pat"), "connectSaves", "pat_p1"), save("pat", "p1")));
  });
  it("nobody can read or remove another dentist's saved posts", async () => {
    await seed(env, (db) => setDoc(doc(db, "connectSaves", "bob_p1"), { userId: "bob", postId: "p1", createdAt: new Date() }));
    await assertFails(getDocs(query(collection(as(env, "alice"), "connectSaves"), where("userId", "==", "bob"))));
    await assertFails(deleteDoc(doc(as(env, "alice"), "connectSaves", "bob_p1")));
    await assertFails(updateDoc(doc(as(env, "bob"), "connectSaves", "bob_p1"), { postId: "p2" }));
  });
});

describe("followers", () => {
  it("a dentist can count and list who follows them, but not who follows others", async () => {
    await seed(env, async (db) => {
      await setDoc(doc(db, "connectFollows", "alice_bob"), { followerId: "alice", followeeId: "bob", createdAt: new Date() });
      await setDoc(doc(db, "connectFollows", "admin_bob"), { followerId: "admin", followeeId: "bob", createdAt: new Date() });
    });
    const mine = (db) => query(collection(db, "connectFollows"), where("followeeId", "==", "bob"));
    await assertSucceeds(getDocs(mine(as(env, "bob"))));
    const count = await assertSucceeds(getCountFromServer(mine(as(env, "bob"))));
    if (count.data().count !== 2) throw new Error(`expected 2 followers, got ${count.data().count}`);
    await assertFails(getDocs(mine(as(env, "alice"))));
  });
});

describe("polls", () => {
  const poll = (over = {}) => newPost({ type: "poll", title: "Which file system?", body: "", pollOptions: ["Rotary", "Reciprocating", "Hand"], v0: 0, v1: 0, v2: 0, ...over });
  const vote = (db, uid, postId, option, field = `v${option}`) => {
    const b = writeBatch(db);
    b.set(doc(db, "connectPosts", postId, "votes", uid), { option, createdAt: serverTimestamp() });
    b.update(doc(db, "connectPosts", postId), { [field]: increment(1) });
    return b.commit();
  };
  const seedPoll = (id = "poll1", over = {}) => seed(env, (db) => setDoc(doc(db, "connectPosts", id), { ...poll(over), createdAt: new Date() }));

  it("a dentist can post a poll with 2 to 5 options and zeroed counters, without a body", async () => {
    await assertSucceeds(setDoc(doc(as(env, "alice"), "connectPosts", "n1"), poll()));
    const two = poll();
    delete two.v2;
    two.pollOptions = ["A", "B"];
    await assertSucceeds(setDoc(doc(as(env, "alice"), "connectPosts", "n2"), two));
  });
  it("rejects bad polls: one option, six options, non-zero votes, mismatched counters", async () => {
    const db = as(env, "alice");
    await assertFails(setDoc(doc(db, "connectPosts", "a"), poll({ pollOptions: ["Only"] })));
    await assertFails(setDoc(doc(db, "connectPosts", "b"), poll({ pollOptions: ["1", "2", "3", "4", "5", "6"] })));
    await assertFails(setDoc(doc(db, "connectPosts", "c"), poll({ v0: 3 })));
    await assertFails(setDoc(doc(db, "connectPosts", "d"), poll({ v3: 0 })));
    const noOptions = poll();
    delete noOptions.pollOptions;
    await assertFails(setDoc(doc(db, "connectPosts", "e"), noOptions));
    await assertFails(setDoc(doc(db, "connectPosts", "f"), newPost({ v0: 0 })));
  });
  it("a vote adds the vote record and exactly one to that option", async () => {
    await seedPoll();
    await assertSucceeds(vote(as(env, "bob"), "bob", "poll1", 1));
  });
  it("cannot vote twice, change a vote, vote for another dentist, or bump a count without a vote", async () => {
    await seedPoll();
    await assertSucceeds(vote(as(env, "bob"), "bob", "poll1", 0));
    await assertFails(vote(as(env, "bob"), "bob", "poll1", 1));
    await assertFails(vote(as(env, "admin"), "bob", "poll1", 2));
    await assertFails(updateDoc(doc(as(env, "admin"), "connectPosts", "poll1"), { v2: increment(1) }));
    await assertFails(deleteDoc(doc(as(env, "bob"), "connectPosts", "poll1", "votes", "bob")));
  });
  it("the vote record and the counter must name the same option, and the option must exist", async () => {
    await seedPoll();
    await assertFails(vote(as(env, "bob"), "bob", "poll1", 0, "v1"));
    await assertFails(vote(as(env, "bob"), "bob", "poll1", 3, "v3"));
    await assertFails(vote(as(env, "bob"), "bob", "poll1", 0, "likeCount"));
  });
  it("votes cannot be added to other kinds of posts", async () => {
    await seedPost("p1");
    await assertFails(vote(as(env, "bob"), "bob", "p1", 0));
  });
  it("a dentist can read only their own vote; the author can fix the title but not the options", async () => {
    await seedPoll();
    await assertSucceeds(getDoc(doc(as(env, "bob"), "connectPosts", "poll1", "votes", "bob")));
    await assertFails(getDoc(doc(as(env, "bob"), "connectPosts", "poll1", "votes", "alice")));
    await assertFails(getDocs(collection(as(env, "bob"), "connectPosts", "poll1", "votes")));
    const edit = { title: "Which file system do you prefer?", body: "", editedAt: serverTimestamp() };
    await assertSucceeds(updateDoc(doc(as(env, "alice"), "connectPosts", "poll1"), edit));
    await assertFails(updateDoc(doc(as(env, "alice"), "connectPosts", "poll1"), { ...edit, pollOptions: ["X", "Y"] }));
    await assertFails(updateDoc(doc(as(env, "alice"), "connectPosts", "poll1"), { ...edit, v0: 99 }));
  });
});
