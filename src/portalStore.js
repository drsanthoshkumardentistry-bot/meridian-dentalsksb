// Firestore access for patient portal pages: collection portalPages/{token}. See firestore.rules.
import { doc, getDoc, setDoc, deleteDoc, Timestamp } from "firebase/firestore";

const COLLECTION = "portalPages";

export const publishPortal = (db, token, page) =>
  setDoc(doc(db, COLLECTION, token), { ...page, expiresAt: Timestamp.fromDate(page.expiresAt) });

export const fetchPortal = async (db, token) => {
  // The rules refuse an expired link; to the patient that is the same as a link that no longer exists.
  const snap = await getDoc(doc(db, COLLECTION, token)).catch((e) => { if (e && e.code === "permission-denied") return null; throw e; });
  return snap && snap.exists() ? snap.data() : null;
};

export const deletePortal = (db, token) => deleteDoc(doc(db, COLLECTION, token));
