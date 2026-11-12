import { collection, doc, getDocs, query, setDoc, deleteDoc, where } from "firebase/firestore";

const col = (db, clinicId) => collection(db, "clinics", clinicId, "patientImages");

export const listImages = async (db, clinicId, patientId) => {
  const snap = await getDocs(query(col(db, clinicId), where("patientId", "==", String(patientId))));
  return snap.docs.map((d) => d.data());
};
export const addImage = (db, clinicId, image) => setDoc(doc(db, "clinics", clinicId, "patientImages", image.id), image);
export const removeImage = (db, clinicId, id) => deleteDoc(doc(db, "clinics", clinicId, "patientImages", id));
