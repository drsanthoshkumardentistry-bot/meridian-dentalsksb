// Firestore access for MeriDent Connect. Every function takes the db and the signed-in uid explicitly.
import {
  collection, doc, getDoc, getDocs, query, where, orderBy, startAt, endAt,
  setDoc, updateDoc, deleteDoc, addDoc, writeBatch, serverTimestamp, limit, startAfter, increment, deleteField, getCountFromServer,
} from "firebase/firestore";
import { searchBounds, withinRadius } from "./geo.js";
import { CONSENT_TEXT, CONSENT_VERSION } from "./rules.js";

const DENTISTS = "connectDentists";
const DIRECTORY = "connectDirectory";
const CONSULTS = "connectConsults";
const AUDIT = "connectAudit";
const ADMINS = "connectAdmins";
const POSTS = "connectPosts";
const FOLLOWS = "connectFollows";
const REPORTS = "connectReports";
const SAVES = "connectSaves";
export const FEED_PAGE = 20;

export const toMillis = (v) => (v && typeof v.toMillis === "function" ? v.toMillis() : v ? new Date(v).getTime() : 0);
const newestFirst = (a, b) => toMillis(b.createdAt) - toMillis(a.createdAt);
const withId = (snap) => ({ id: snap.id, ...snap.data() });

const auditDoc = (actorId, action, targetId, meta = {}) => ({
  actorId, action, targetId: targetId || null, meta, createdAt: serverTimestamp(),
});

export const getProfile = async (db, uid) => {
  const snap = await getDoc(doc(db, DENTISTS, uid));
  return snap.exists() ? withId(snap) : null;
};

export const isAdmin = async (db, uid) => {
  try {
    return (await getDoc(doc(db, ADMINS, uid))).exists();
  } catch {
    return false;
  }
};

/** First registration, or editing while still pending. Always saved as pending and unlisted. */
export const saveNewProfile = async (db, uid, p) => {
  await setDoc(doc(db, DENTISTS, uid), {
    fullName: p.fullName.trim(), qualification: p.qualification.trim(), specialty: p.specialty,
    councilState: p.councilState.trim(), registrationNo: p.registrationNo.trim(),
    clinicName: p.clinicName.trim(), clinicAddress: p.clinicAddress.trim(),
    geo: p.geo, geohash: p.geohash,
    timings: (p.timings || "").trim(), phone: p.phone.trim(), whatsapp: (p.whatsapp || "").trim(),
    status: "pending", listed: false, acceptingReferrals: true, emergencyAvailable: false,
    createdAt: serverTimestamp(),
  });
};

/** What a verified dentist may change: timings, phones and the three switches. */
export const updateOwnSettings = async (db, uid, changes) => {
  const allowed = ["timings", "phone", "whatsapp", "emergencyAvailable", "acceptingReferrals"];
  const clean = Object.fromEntries(Object.entries(changes).filter(([k]) => allowed.includes(k)));
  await updateDoc(doc(db, DENTISTS, uid), clean);
  const snap = await getDoc(doc(db, DIRECTORY, uid));
  if (snap.exists()) await updateDoc(doc(db, DIRECTORY, uid), clean);
};

const directoryEntry = (p) => ({
  fullName: p.fullName, qualification: p.qualification, specialty: p.specialty,
  clinicName: p.clinicName, clinicAddress: p.clinicAddress, geo: p.geo, geohash: p.geohash,
  timings: p.timings || "", phone: p.phone, whatsapp: p.whatsapp || "",
  acceptingReferrals: p.acceptingReferrals !== false, emergencyAvailable: Boolean(p.emergencyAvailable),
  updatedAt: serverTimestamp(),
});

export const setListed = async (db, uid, profile, listed) => {
  const batch = writeBatch(db);
  batch.update(doc(db, DENTISTS, uid), { listed });
  if (listed) batch.set(doc(db, DIRECTORY, uid), directoryEntry(profile));
  else batch.delete(doc(db, DIRECTORY, uid));
  await batch.commit();
};

/** Specialists near `center`. The geohash ranges overshoot, so results are filtered by true distance. */
export const searchDirectory = async (db, uid, center, radiusKm) => {
  const seen = new Map();
  await Promise.all(
    searchBounds(center.lat, center.lng, radiusKm).map(async ([a, b]) => {
      const snap = await getDocs(query(collection(db, DIRECTORY), orderBy("geohash"), startAt(a), endAt(b)));
      snap.forEach((d) => seen.set(d.id, withId(d)));
    })
  );
  addDoc(collection(db, AUDIT), auditDoc(uid, "search", null, { radiusKm })).catch(() => {});
  return withinRadius([...seen.values()], center, radiusKm);
};

export const createConsult = async (db, uid, from, toId, form) => {
  const ref = doc(collection(db, CONSULTS));
  const hasSummary = Boolean(form.caseSummary && form.caseSummary.trim());
  const batch = writeBatch(db);
  batch.set(ref, {
    fromId: uid, toId, fromName: from.fullName, fromClinic: from.clinicName, fromPhone: from.phone,
    urgency: form.urgency, patientRef: (form.patientRef || "").trim(),
    caseSummary: hasSummary ? form.caseSummary.trim() : null,
    consentVersion: hasSummary ? CONSENT_VERSION : null,
    consentText: hasSummary ? CONSENT_TEXT : null,
    consentAt: hasSummary ? serverTimestamp() : null,
    status: "sent", reportBack: null, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  batch.set(doc(db, AUDIT, `consult_${ref.id}`), auditDoc(uid, "consult_create", toId, { consultId: ref.id, withCase: hasSummary }));
  await batch.commit();
  return ref.id;
};

export const listConsults = async (db, uid, side) => {
  const field = side === "received" ? "toId" : "fromId";
  const snap = await getDocs(query(collection(db, CONSULTS), where(field, "==", uid)));
  return snap.docs.map(withId).sort(newestFirst);
};

export const respondConsult = async (db, uid, consult, status, reportBack = "") => {
  const batch = writeBatch(db);
  batch.update(doc(db, CONSULTS, consult.id), {
    status, reportBack: reportBack.trim() ? reportBack.trim() : consult.reportBack || null, updatedAt: serverTimestamp(),
  });
  batch.set(doc(db, AUDIT, `status_${consult.id}_${status}`), auditDoc(uid, "status_change", consult.fromId, { consultId: consult.id, status }));
  await batch.commit();
};

export const listPending = async (db) => {
  const snap = await getDocs(query(collection(db, DENTISTS), where("status", "==", "pending")));
  return snap.docs.map(withId).sort(newestFirst);
};

export const verifyDentist = async (db, adminUid, id) => {
  await updateDoc(doc(db, DENTISTS, id), { status: "verified", verifiedBy: adminUid, verifiedAt: serverTimestamp() });
};

export const suspendDentist = async (db, id) => {
  const batch = writeBatch(db);
  batch.update(doc(db, DENTISTS, id), { status: "suspended", listed: false });
  batch.delete(doc(db, DIRECTORY, id));
  await batch.commit();
};

// ---------------- Network feed ----------------

/** One page of posts, newest first. `cursor` is the last snapshot of the previous page. */
export const listPosts = async (db, cursor) => {
  const q = cursor
    ? query(collection(db, POSTS), orderBy("createdAt", "desc"), startAfter(cursor), limit(FEED_PAGE))
    : query(collection(db, POSTS), orderBy("createdAt", "desc"), limit(FEED_PAGE));
  const snap = await getDocs(q);
  return { posts: snap.docs.map(withId), cursor: snap.docs.length === FEED_PAGE ? snap.docs[snap.docs.length - 1] : null };
};

export const createPost = async (db, post, images = []) => {
  const ref = doc(collection(db, POSTS));
  await setDoc(ref, { ...post, createdAt: serverTimestamp() });
  try {
    for (let i = 0; i < images.length; i++) {
      await setDoc(doc(db, POSTS, ref.id, "images", String(i)), { data: images[i], createdAt: serverTimestamp() });
    }
  } catch (e) {
    // Do not leave a case that promises pictures it does not have.
    await Promise.all(images.map((_, i) => deleteDoc(doc(db, POSTS, ref.id, "images", String(i))).catch(() => {})));
    await deleteDoc(ref).catch(() => {});
    throw e;
  }
  return ref.id;
};

export const getPostImages = async (db, postId, count) => {
  const out = [];
  for (let i = 0; i < Math.min(count || 0, 2); i++) {
    const snap = await getDoc(doc(db, POSTS, postId, "images", String(i)));
    if (snap.exists()) out.push(snap.data().data);
  }
  return out;
};

export const deletePost = async (db, postId, imageCount = 0) => {
  // Pictures first: their rules look at the post, which must still exist.
  await Promise.all(Array.from({ length: Math.min(imageCount, 2) }, (_, i) => deleteDoc(doc(db, POSTS, postId, "images", String(i))).catch(() => {})));
  await deleteDoc(doc(db, POSTS, postId));
};

export const likedSet = async (db, uid, postIds) => {
  const found = await Promise.all(postIds.map(async (id) => ((await getDoc(doc(db, POSTS, id, "likes", uid))).exists() ? id : null)));
  return new Set(found.filter(Boolean));
};

export const setLike = async (db, uid, postId, on) => {
  const batch = writeBatch(db);
  const like = doc(db, POSTS, postId, "likes", uid);
  if (on) batch.set(like, { createdAt: serverTimestamp() });
  else batch.delete(like);
  batch.update(doc(db, POSTS, postId), { likeCount: increment(on ? 1 : -1) });
  await batch.commit();
};

export const listComments = async (db, postId) => {
  const snap = await getDocs(query(collection(db, POSTS, postId, "comments"), orderBy("createdAt", "asc"), limit(100)));
  return snap.docs.map(withId);
};

export const addComment = async (db, uid, postId, profile, text) => {
  const batch = writeBatch(db);
  const ref = doc(collection(db, POSTS, postId, "comments"));
  batch.set(ref, { authorId: uid, authorName: profile.fullName, authorSpecialty: profile.specialty, text, createdAt: serverTimestamp() });
  batch.update(doc(db, POSTS, postId), { commentCount: increment(1) });
  await batch.commit();
  return ref.id;
};

export const deleteComment = async (db, postId, commentId) => {
  const batch = writeBatch(db);
  batch.delete(doc(db, POSTS, postId, "comments", commentId));
  batch.update(doc(db, POSTS, postId), { commentCount: increment(-1) });
  await batch.commit();
};

export const followingSet = async (db, uid) => {
  const snap = await getDocs(query(collection(db, FOLLOWS), where("followerId", "==", uid)));
  return new Set(snap.docs.map((d) => d.data().followeeId));
};

export const setFollow = async (db, uid, followeeId, on) => {
  const ref = doc(db, FOLLOWS, `${uid}_${followeeId}`);
  if (on) await setDoc(ref, { followerId: uid, followeeId, createdAt: serverTimestamp() });
  else await deleteDoc(ref);
};

export const reportContent = (db, uid, { postId, commentId = null, reason }) =>
  addDoc(collection(db, REPORTS), { postId, commentId, reporterId: uid, reason: String(reason).slice(0, 200), createdAt: serverTimestamp() });

export const listReports = async (db) => {
  const snap = await getDocs(query(collection(db, REPORTS), orderBy("createdAt", "desc"), limit(50)));
  return snap.docs.map(withId);
};
export const getPost = async (db, postId) => {
  const snap = await getDoc(doc(db, POSTS, postId));
  return snap.exists() ? withId(snap) : null;
};
export const dismissReport = (db, reportId) => deleteDoc(doc(db, REPORTS, reportId));

/** All of one dentist's posts, newest first. An equality query only, so it needs no index. */
export const listPostsBy = async (db, authorId) => {
  const snap = await getDocs(query(collection(db, POSTS), where("authorId", "==", authorId), limit(60)));
  return snap.docs.map(withId).sort(newestFirst);
};

/** Events from `today` on, soonest first. One range on one field, so it needs no index. */
export const listUpcomingEvents = async (db, today, n = 6) => {
  const snap = await getDocs(query(collection(db, POSTS), where("eventDate", ">=", today), orderBy("eventDate", "asc"), limit(n)));
  return snap.docs.map(withId);
};

/** Edit your own post. `unset` lists fields to remove (a cleared topic). */
export const updatePost = async (db, postId, { set, unset = [] }) => {
  const data = { ...set, editedAt: serverTimestamp() };
  for (const k of unset) data[k] = deleteField();
  await updateDoc(doc(db, POSTS, postId), data);
};

/** The asker marks one comment as the answer. An empty id clears it. */
export const setAccepted = (db, postId, commentId) => updateDoc(doc(db, POSTS, postId), { acceptedCommentId: commentId || "" });

// Saved posts are private to the dentist who saved them.
const savedDocs = async (db, uid) => {
  const snap = await getDocs(query(collection(db, SAVES), where("userId", "==", uid), limit(200)));
  return snap.docs.map((d) => d.data()).sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
};
export const savedIds = async (db, uid) => new Set((await savedDocs(db, uid)).map((s) => s.postId));
export const listSaved = async (db, uid) => {
  const posts = await Promise.all((await savedDocs(db, uid)).slice(0, 30).map((s) => getPost(db, s.postId).catch(() => null)));
  return posts.filter(Boolean);
};
export const setSaved = async (db, uid, postId, on) => {
  const ref = doc(db, SAVES, `${uid}_${postId}`);
  if (on) await setDoc(ref, { userId: uid, postId, createdAt: serverTimestamp() });
  else await deleteDoc(ref);
};

export const countFollowers = async (db, uid) =>
  (await getCountFromServer(query(collection(db, FOLLOWS), where("followeeId", "==", uid)))).data().count;

/** One vote per dentist: the vote record and the option's counter are written together. */
export const castVote = async (db, uid, postId, option) => {
  const batch = writeBatch(db);
  batch.set(doc(db, POSTS, postId, "votes", uid), { option, createdAt: serverTimestamp() });
  batch.update(doc(db, POSTS, postId), { [`v${option}`]: increment(1) });
  await batch.commit();
};
/** Which option this dentist picked on each poll, as { postId: optionIndex }. */
export const myVotes = async (db, uid, postIds) => {
  const found = await Promise.all(postIds.map(async (id) => {
    const snap = await getDoc(doc(db, POSTS, id, "votes", uid));
    return snap.exists() ? [id, snap.data().option] : null;
  }));
  return Object.fromEntries(found.filter(Boolean));
};

/** Bind everything to one db and uid for the UI. */
export const bindApi = (db, uid) => ({
  enabled: Boolean(db && uid),
  uid,
  getProfile: () => getProfile(db, uid),
  isAdmin: () => isAdmin(db, uid),
  saveNewProfile: (p) => saveNewProfile(db, uid, p),
  updateOwnSettings: (c) => updateOwnSettings(db, uid, c),
  setListed: (profile, listed) => setListed(db, uid, profile, listed),
  search: (center, radiusKm) => searchDirectory(db, uid, center, radiusKm),
  createConsult: (from, toId, form) => createConsult(db, uid, from, toId, form),
  listConsults: (side) => listConsults(db, uid, side),
  respondConsult: (consult, status, reportBack) => respondConsult(db, uid, consult, status, reportBack),
  listPending: () => listPending(db),
  verify: (id) => verifyDentist(db, uid, id),
  suspend: (id) => suspendDentist(db, id),
  listPosts: (cursor) => listPosts(db, cursor),
  createPost: (post, images) => createPost(db, post, images),
  getPostImages: (postId, count) => getPostImages(db, postId, count),
  deletePost: (postId, imageCount) => deletePost(db, postId, imageCount),
  likedSet: (ids) => likedSet(db, uid, ids),
  setLike: (postId, on) => setLike(db, uid, postId, on),
  listComments: (postId) => listComments(db, postId),
  addComment: (postId, profile, text) => addComment(db, uid, postId, profile, text),
  deleteComment: (postId, commentId) => deleteComment(db, postId, commentId),
  followingSet: () => followingSet(db, uid),
  setFollow: (followeeId, on) => setFollow(db, uid, followeeId, on),
  report: (target) => reportContent(db, uid, target),
  listReports: () => listReports(db),
  getPost: (id) => getPost(db, id),
  dismissReport: (id) => dismissReport(db, id),
  listPostsBy: (authorId) => listPostsBy(db, authorId),
  listUpcomingEvents: (today, n) => listUpcomingEvents(db, today, n),
  updatePost: (postId, patch) => updatePost(db, postId, patch),
  setAccepted: (postId, commentId) => setAccepted(db, postId, commentId),
  savedIds: () => savedIds(db, uid),
  listSaved: () => listSaved(db, uid),
  setSaved: (postId, on) => setSaved(db, uid, postId, on),
  countFollowers: () => countFollowers(db, uid),
  vote: (postId, option) => castVote(db, uid, postId, option),
  myVotes: (postIds) => myVotes(db, uid, postIds),
});
