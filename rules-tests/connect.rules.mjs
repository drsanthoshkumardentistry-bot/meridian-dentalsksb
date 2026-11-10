import { describe, it, beforeAll, afterAll, beforeEach } from "vitest";
import { assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import {
  doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, addDoc, collection, query, where, orderBy, limit,
  writeBatch, increment, serverTimestamp,
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
