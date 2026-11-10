import { doc, setDoc, updateDoc, deleteDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { normalizeEmail } from "./team.js";

const ref = (db, email) => doc(db, "clinicStaff", normalizeEmail(email));
export const watchMyMembership = (db, email, onData, onError) =>
  onSnapshot(ref(db, email), (s) => onData(s.exists() ? s.data() : null), onError);
export const watchTeam = (db, clinicId, onData, onError) =>
  onSnapshot(query(collection(db, "clinicStaff"), where("clinicId", "==", clinicId)), (s) => onData(s.docs.map((d) => d.data())), onError);
export const createInvite = (db, invite) => setDoc(ref(db, invite.email), invite);
export const acceptInvite = (db, email) => updateDoc(ref(db, email), { status: "active" });
export const updateMember = (db, email, changes) => updateDoc(ref(db, email), changes);
export const removeMember = (db, email) => deleteDoc(ref(db, email));
