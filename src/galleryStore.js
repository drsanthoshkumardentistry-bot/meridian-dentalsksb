import { uploadGate } from "./storageUsage.js";
import { collection, doc, getDocs, query, setDoc, deleteDoc, where } from "firebase/firestore";

const col = (db, clinicId) => collection(db, "clinics", clinicId, "patientImages");

export const listImages = async (db, clinicId, patientId) => {
  const snap = await getDocs(query(col(db, clinicId), where("patientId", "==", String(patientId))));
  return snap.docs.map((d) => d.data());
};
let clinicUsedBytes = 0;
/** The app tells the store how much picture space this clinic uses, so adding can stop at the safe limit. */
export const setClinicUsedBytes = (n) => { clinicUsedBytes = Number(n) || 0; };
export const addImage = (db, clinicId, image) => {
  const gate = uploadGate(clinicUsedBytes);
  if (!gate.allowed) return Promise.reject(new Error(gate.message));
  return setDoc(doc(db, "clinics", clinicId, "patientImages", image.id), image);
};
export const removeImage = (db, clinicId, id) => deleteDoc(doc(db, "clinics", clinicId, "patientImages", id));

import { getCountFromServer } from "firebase/firestore";
/** How many pictures the clinic holds (a cheap count, no pictures are downloaded). */
export const countImages = async (db, clinicId) => (await getCountFromServer(col(db, clinicId))).data().count;
