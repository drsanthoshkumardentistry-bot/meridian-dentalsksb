// Firestore access for MeriDent DocLog. Everything lives under the doctor's own uid and only that doctor can read it.
import { collection, doc, getDocs, setDoc, deleteDoc, query, orderBy, limit, writeBatch } from "firebase/firestore";
import { MAX_VISITS_LOADED } from "../docLog.js";

const ROOT = "connectDocLog";
const strip = (o) => Object.fromEntries(Object.entries(o).filter(([k, v]) => k !== "id" && v !== undefined));

export const listClinics = async (db, uid) => {
  const snap = await getDocs(collection(db, ROOT, uid, "clinics"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => String(a.name).localeCompare(String(b.name)));
};
export const saveClinic = (db, uid, clinic) => setDoc(doc(db, ROOT, uid, "clinics", clinic.id), strip(clinic));
export const deleteClinic = (db, uid, id) => deleteDoc(doc(db, ROOT, uid, "clinics", id));

export const listVisits = async (db, uid) => {
  const snap = await getDocs(query(collection(db, ROOT, uid, "visits"), orderBy("date", "desc"), limit(MAX_VISITS_LOADED)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
export const saveVisit = (db, uid, visit) => setDoc(doc(db, ROOT, uid, "visits", visit.id), strip(visit));
export const deleteVisit = (db, uid, id) => deleteDoc(doc(db, ROOT, uid, "visits", id));
/** Several visits in one write (a clinic payment spread over its unpaid visits). */
export const saveVisits = async (db, uid, visits) => {
  const batch = writeBatch(db);
  visits.forEach((v) => batch.set(doc(db, ROOT, uid, "visits", v.id), strip(v)));
  await batch.commit();
};
