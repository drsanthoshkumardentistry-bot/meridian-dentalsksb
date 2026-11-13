import { useCallback, useEffect, useRef, useState } from "react";
import { buildBackup } from "./portability.js";
import { dueForRestorePoint, looksComplete } from "./restorePoints.js";
import { listRestorePoints, saveRestorePoint, loadRestorePoint, pruneRestorePoints } from "./restoreStore.js";

/* Keeps the owner's restore points. After the clinic has had time to load it saves one a day. Silent on failure:
 * a restore point is a safety net, never a reason to interrupt work. */
export default function useRestorePoints({ db, clinicId, enabled, getData, delayMs = 90000 }) {
  const [points, setPoints] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dataRef = useRef(getData);
  dataRef.current = getData;

  const refresh = useCallback(async () => {
    if (!db || !clinicId) return [];
    const list = await listRestorePoints(db, clinicId);
    setPoints(list);
    return list;
  }, [db, clinicId]);

  const saveNow = useCallback(async ({ force = false } = {}) => {
    if (!db || !clinicId) return null;
    setBusy(true); setError("");
    try {
      const list = await listRestorePoints(db, clinicId);
      const backup = buildBackup(dataRef.current());
      if (!force && (!dueForRestorePoint(list) || !looksComplete(backup.counts, list))) { setPoints(list); return null; }
      const entry = await saveRestorePoint(db, clinicId, backup);
      const all = [entry, ...list];
      await pruneRestorePoints(db, clinicId, all);
      await refresh();
      return entry;
    } catch (e) {
      setError(e && e.message === "too-large" ? "Your records are too large for an automatic restore point. Download a full backup instead." : "Could not save a restore point right now.");
      return null;
    } finally {
      setBusy(false);
    }
  }, [db, clinicId, refresh]);

  useEffect(() => {
    if (!enabled || !db || !clinicId) return undefined;
    refresh().catch(() => {});
    const t = setTimeout(() => { saveNow().catch(() => {}); }, delayMs);
    return () => clearTimeout(t);
  }, [enabled, db, clinicId, delayMs, refresh, saveNow]);

  const load = useCallback(async (point) => {
    setBusy(true); setError("");
    try { return await loadRestorePoint(db, clinicId, point); }
    catch { setError("Could not open this restore point."); return null; }
    finally { setBusy(false); }
  }, [db, clinicId]);

  return { points, busy, error, saveNow, load, refresh };
}
