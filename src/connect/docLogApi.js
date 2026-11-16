// Firestore access for MeriDent DocLog. Everything lives under the doctor's own uid and only that doctor can read it.
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, orderBy, limit, writeBatch } from "firebase/firestore";
import { MAX_VISITS_LOADED, makeBinEntry, binRecord, expiredBinIds, sortedBin } from "../docLog.js";

const ROOT = "connectDocLog";
const strip = (o) => Object.fromEntries(Object.entries(o).filter(([k, v]) => k !== "id" && v !== undefined));

// "Recently deleted": a deleted visit or clinic is kept for 30 days so it can be brought back.
const binRef = (db, uid, id) => doc(db, ROOT, uid, "bin", id);
const keepCopy = async (db, uid, coll, id, record) => {
  const entry = makeBinEntry(coll, id, record);
  if (!entry) return; // nothing worth keeping; deleting still goes ahead
  try { await setDoc(binRef(db, uid, entry.id), strip(entry)); } catch { /* the delete must still work */ }
};
export const listBin = async (db, uid) => {
  const snap = await getDocs(collection(db, ROOT, uid, "bin"));
  const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const gone = expiredBinIds(all);
  await Promise.all(gone.map((id) => deleteDoc(binRef(db, uid, id)).catch(() => {})));
  return sortedBin(all.filter((e) => !gone.includes(e.id)));
};
export const restoreBin = async (db, uid, entry) => {
  const rec = binRecord(entry);
  if (!rec) throw new Error("unreadable copy");
  await setDoc(doc(db, ROOT, uid, entry.coll, entry.recordId), strip(rec));
  await deleteDoc(binRef(db, uid, entry.id));
  return { coll: entry.coll, record: { id: entry.recordId, ...strip(rec) } };
};
export const removeBin = (db, uid, entry) => deleteDoc(binRef(db, uid, entry.id));

export const listClinics = async (db, uid) => {
  const snap = await getDocs(collection(db, ROOT, uid, "clinics"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => String(a.name).localeCompare(String(b.name)));
};
export const saveClinic = (db, uid, clinic) => setDoc(doc(db, ROOT, uid, "clinics", clinic.id), strip(clinic));
export const deleteClinic = async (db, uid, id, record) => { await keepCopy(db, uid, "clinics", id, record); await deleteDoc(doc(db, ROOT, uid, "clinics", id)); };

export const listVisits = async (db, uid) => {
  const snap = await getDocs(query(collection(db, ROOT, uid, "visits"), orderBy("date", "desc"), limit(MAX_VISITS_LOADED)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
export const saveVisit = (db, uid, visit) => setDoc(doc(db, ROOT, uid, "visits", visit.id), strip(visit));
export const deleteVisit = async (db, uid, id, record) => { await keepCopy(db, uid, "visits", id, record); await deleteDoc(doc(db, ROOT, uid, "visits", id)); };
/** Several visits in one write (a clinic payment spread over its unpaid visits). */
export const saveVisits = async (db, uid, visits) => {
  const batch = writeBatch(db);
  visits.forEach((v) => batch.set(doc(db, ROOT, uid, "visits", v.id), strip(v)));
  await batch.commit();
};

/** The doctor's own DocLog profile (speciality, name, qualification). One document. */
export const getProfile = async (db, uid) => {
  const snap = await getDoc(doc(db, ROOT, uid, "profile", "me"));
  return snap.exists() ? snap.data() : null;
};
export const saveProfile = (db, uid, profile) => setDoc(doc(db, ROOT, uid, "profile", "me"), strip(profile));
