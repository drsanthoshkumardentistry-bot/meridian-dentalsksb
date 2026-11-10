// Firestore access for online booking. bookingPages/{clinicId} is public to read by id;
// bookingRequests/{id} can be created by anyone (validated by rules) and read only by the clinic.
import { doc, getDoc, setDoc, updateDoc, collection, query, where, onSnapshot } from "firebase/firestore";

export const fetchBookingPage = async (db, clinicId) => {
  const snap = await getDoc(doc(db, "bookingPages", clinicId));
  return snap.exists() ? snap.data() : null;
};
export const publishBookingPage = (db, clinicId, page) => setDoc(doc(db, "bookingPages", clinicId), page);

export const submitBookingRequest = (db, id, data) => setDoc(doc(db, "bookingRequests", id), data);

export const watchBookingRequests = (db, clinicId, onData, onError) =>
  onSnapshot(
    query(collection(db, "bookingRequests"), where("clinicId", "==", clinicId)),
    (snap) => onData(snap.docs.map((d) => ({ ...d.data(), id: d.id }))),
    onError
  );

export const markBookingRequest = (db, id, status) =>
  updateDoc(doc(db, "bookingRequests", id), { status, handledAt: new Date().toISOString() });
