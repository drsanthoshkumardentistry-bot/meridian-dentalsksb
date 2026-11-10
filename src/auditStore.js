import { doc, setDoc, collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";

export const writeAudit = (db, clinicId, entry) => setDoc(doc(db, "clinics", clinicId, "audit", entry.id), entry);
export const watchAudit = (db, clinicId, onData, onError) =>
  onSnapshot(query(collection(db, "clinics", clinicId, "audit"), orderBy("at", "desc"), limit(300)), (s) => onData(s.docs.map((d) => d.data())), onError);
