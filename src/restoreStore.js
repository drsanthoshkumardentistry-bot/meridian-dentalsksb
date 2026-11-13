// Firestore side of restore points. Owner only: it lives under clinics/{clinicId}, which only the owner can reach.
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import { chunkText, joinChunks, pointId, toDelete, sortedPoints, MAX_CHARS } from "./restorePoints.js";

const pointsCol = (db, cid) => collection(db, "clinics", cid, "restorePoints");
const partDoc = (db, cid, id, n) => doc(db, "clinics", cid, "restorePointParts", `${id}_${n}`);

export const listRestorePoints = async (db, cid) => {
  const snap = await getDocs(pointsCol(db, cid));
  return sortedPoints(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
};

/** Parts are written first and the listing entry last, so a half-saved copy never shows up. Returns the new entry. */
export const saveRestorePoint = async (db, cid, backup, now = new Date()) => {
  const text = JSON.stringify(backup);
  if (text.length > MAX_CHARS) throw new Error("too-large");
  const parts = chunkText(text);
  const id = pointId(now);
  for (let n = 0; n < parts.length; n++) await setDoc(partDoc(db, cid, id, n), { text: parts[n] });
  const entry = { at: now.toISOString(), parts: parts.length, chars: text.length, counts: backup.counts || {} };
  await setDoc(doc(pointsCol(db, cid), id), entry);
  return { ...entry, id };
};

export const loadRestorePoint = async (db, cid, point) => {
  const parts = [];
  for (let n = 0; n < point.parts; n++) {
    const s = await getDoc(partDoc(db, cid, point.id, n));
    if (!s.exists()) throw new Error("missing-part");
    parts.push(s.data().text);
  }
  return JSON.parse(joinChunks(parts));
};

export const deleteRestorePoint = async (db, cid, point) => {
  await deleteDoc(doc(pointsCol(db, cid), point.id));
  for (let n = 0; n < (point.parts || 0); n++) await deleteDoc(partDoc(db, cid, point.id, n));
};

export const pruneRestorePoints = async (db, cid, points) => {
  const ids = new Set(toDelete(points));
  for (const p of points.filter((x) => ids.has(x.id))) await deleteRestorePoint(db, cid, p);
};
