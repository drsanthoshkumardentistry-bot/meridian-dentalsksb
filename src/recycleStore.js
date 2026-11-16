// Firestore side of "Recently deleted". Lives under clinics/{clinicId}/recycleBin, so only the owner and managers can read it.
import { collection, doc, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import { sortedEntries, expiredIds, recordOf } from "./recycleBin.js";

const col = (db, cid) => collection(db, "clinics", cid, "recycleBin");
const cloudDocId = (id) => String(id).replace(/\//g, "_");

export const saveToBin = (db, cid, entry) => setDoc(doc(db, "clinics", cid, "recycleBin", entry.id), entry);

/** Lists the bin, removing anything older than 30 days first. */
export const listBin = async (db, cid, now = new Date()) => {
  const snap = await getDocs(col(db, cid));
  const all = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
  const old = expiredIds(all, now);
  await Promise.all(old.map((id) => deleteDoc(doc(db, "clinics", cid, "recycleBin", id)).catch(() => {})));
  return sortedEntries(all.filter((e) => !old.includes(e.id)));
};

/** Puts the record back where it was and removes it from the bin. Returns false when the copy cannot be read. */
export const restoreFromBin = async (db, cid, entry) => {
  const rec = recordOf(entry);
  if (!rec) return false;
  const id = rec.id !== undefined ? rec.id : entry.recordId;
  await setDoc(doc(db, "clinics", cid, entry.coll, cloudDocId(id)), { ...rec, id });
  await deleteDoc(doc(db, "clinics", cid, "recycleBin", entry.id));
  return true;
};

export const removeFromBin = (db, cid, entry) => deleteDoc(doc(db, "clinics", cid, "recycleBin", entry.id));
