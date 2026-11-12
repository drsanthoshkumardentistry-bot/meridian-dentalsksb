// Firestore access for patient portal pages: collection portalPages/{token}. See firestore.rules.
import { doc, getDoc, setDoc, deleteDoc, Timestamp } from "firebase/firestore";

const COLLECTION = "portalPages";

export const publishPortal = (db, token, page) =>
  setDoc(doc(db, COLLECTION, token), { ...page, expiresAt: Timestamp.fromDate(page.expiresAt) });

export const fetchPortal = async (db, token) => {
  const snap = await getDoc(doc(db, COLLECTION, token));
  return snap.exists() ? snap.data() : null;
};

export const deletePortal = (db, token) => deleteDoc(doc(db, COLLECTION, token));
