// OPG radiographs live in their own documents (clinics/{clinic}/opgScans/{patient}), not inside the patient record.
// The patient record then stays small: it loads fast, fits in the device copy, and syncs quickly.
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { dataUrlBytes } from "./storageUsage.js";

const ref = (db, clinicId, patientId) => doc(db, "clinics", clinicId, "opgScans", String(patientId).replace(/\//g, "_"));

/** The picture, or "" when none. */
export const getOpg = async (db, clinicId, patientId) => {
  const snap = await getDoc(ref(db, clinicId, patientId));
  return snap.exists() && typeof snap.data().data === "string" ? snap.data().data : "";
};

/** Saves the picture; returns the fields to keep on the patient record (no picture data). */
export const saveOpg = async (db, clinicId, patientId, dataUrl, now = new Date()) => {
  const bytes = dataUrlBytes(dataUrl);
  await setDoc(ref(db, clinicId, patientId), { id: String(patientId), patientId: String(patientId), data: dataUrl, bytes, uploadedAt: now.toISOString() });
  return { hasOpg: true, opgBytes: bytes, opgImage: "" };
};

export const deleteOpg = (db, clinicId, patientId) => deleteDoc(ref(db, clinicId, patientId));

/** Patients that still hold the picture inside the record (saved before OPGs moved). */
export const legacyOpgPatients = (patients = []) => (Array.isArray(patients) ? patients : []).filter((p) => p && typeof p.opgImage === "string" && p.opgImage.length > 0);
