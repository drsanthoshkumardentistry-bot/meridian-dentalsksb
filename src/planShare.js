// Firestore access for the patient approval link: collection planShares/{token}.
// The token is the only key; rules allow reading one document by token and a one-time, limited decision write.
import { doc, getDoc, setDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";

const COLLECTION = "planShares";

export const createShare = async (db, token, share) => {
  await setDoc(doc(db, COLLECTION, token), { ...share, expiresAt: Timestamp.fromDate(share.expiresAt) });
};

export const fetchShare = async (db, token) => {
  const snap = await getDoc(doc(db, COLLECTION, token));
  return snap.exists() ? snap.data() : null;
};

export const decideShare = async (db, token, decision, name) => {
  await updateDoc(doc(db, COLLECTION, token), {
    decision,
    decidedAt: Timestamp.now(),
    decidedName: String(name || "").trim().slice(0, 80),
  });
};

export const deleteShare = async (db, token) => {
  await deleteDoc(doc(db, COLLECTION, token));
};
