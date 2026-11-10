// Firestore access for MeriDent Connect. Every function takes the db and the signed-in uid explicitly.
import {
  collection, doc, getDoc, getDocs, query, where, orderBy, startAt, endAt,
  setDoc, updateDoc, deleteDoc, addDoc, writeBatch, serverTimestamp,
} from "firebase/firestore";
import { searchBounds, withinRadius } from "./geo.js";
import { CONSENT_TEXT, CONSENT_VERSION } from "./rules.js";

const DENTISTS = "connectDentists";
const DIRECTORY = "connectDirectory";
const CONSULTS = "connectConsults";
const AUDIT = "connectAudit";
const ADMINS = "connectAdmins";

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
});
