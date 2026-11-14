// Saves one record to the cloud without overwriting a newer edit made on another device.
import { mergeDoc, sameJson } from "./syncMerge.js";

export const isOfflineError = (e) => Boolean(e) && (e.code === "unavailable" || /offline/i.test(String(e.message || "")));

/**
 * Reads the cloud copy and saves the merge of base, local and remote in one transaction, so two devices saving
 * at once cannot lose each other's changes. Transactions need a connection; offline, the plain save is queued
 * by the Firestore cache and sent when the connection returns. Returns what the cloud now holds.
 */
export async function writeDocMerged({ db, ref, clean, base, runTransaction, setDoc }) {
  if (typeof runTransaction !== "function") { await setDoc(ref, clean); return clean; }
  try {
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) { tx.set(ref, clean); return clean; }
      const remote = snap.data();
      const merged = mergeDoc(base, clean, remote);
      if (!sameJson(merged, remote)) tx.set(ref, merged);
      return merged;
    });
  } catch (e) {
    if (isOfflineError(e)) { await setDoc(ref, clean); return clean; }
    throw e;
  }
}
