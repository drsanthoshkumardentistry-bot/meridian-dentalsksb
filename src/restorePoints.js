// Automatic restore points (pure helpers). Once a day the owner's session saves a copy of the clinic's records inside
// the clinic's own private space, and keeps the last few. Restoring brings back records that were deleted by mistake.
export const RESTORE_KEEP = 3;
export const MIN_GAP_HOURS = 20;
export const CHUNK_CHARS = 250000; // one Firestore document holds under 1 MB, even if every character takes 3 bytes
export const MAX_CHARS = 6000000;

export const pointId = (now = new Date()) => `rp-${now.toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}`;

const newestFirst = (points) => [...(Array.isArray(points) ? points : [])].filter((p) => p && p.id && p.at).sort((a, b) => String(b.at).localeCompare(String(a.at)));

/** True when there is no restore point yet, or the newest is at least MIN_GAP_HOURS old. */
export const dueForRestorePoint = (points, now = new Date()) => {
  const newest = newestFirst(points)[0];
  if (!newest) return true;
  const t = Date.parse(newest.at);
  return !Number.isFinite(t) || now.getTime() - t >= MIN_GAP_HOURS * 3600000;
};

/** Guards against saving a half-loaded clinic: the new copy must not hold clearly fewer patients than the last one. */
export const looksComplete = (counts = {}, points = []) => {
  const total = (c) => ["patients", "appointments", "invoices"].reduce((n, k) => n + (Number(c && c[k]) || 0), 0);
  if (total(counts) === 0) return false;
  const newest = newestFirst(points)[0];
  if (!newest) return true;
  const had = Number(newest.counts && newest.counts.patients) || 0;
  return (Number(counts.patients) || 0) >= Math.floor(had * 0.8);
};

export const chunkText = (rawText, rawSize = CHUNK_CHARS) => {
  const text = typeof rawText === "string" ? rawText : "";
  const size = Number.isFinite(rawSize) && rawSize >= 1 ? Math.floor(rawSize) : CHUNK_CHARS; // a size of 0 or less would loop forever
  const out = [];
  for (let i = 0; i < text.length; i += size) out.push(text.slice(i, i + size));
  return out.length ? out : [""];
};
export const joinChunks = (parts) => (Array.isArray(parts) ? parts.join("") : "");

/** Ids of the restore points to remove so only the newest `keep` remain. */
export const toDelete = (points, keep = RESTORE_KEEP) => newestFirst(points).slice(keep).map((p) => p.id);

export const describePoint = (p) => {
  const d = new Date(p.at);
  const when = Number.isNaN(d.getTime()) ? "Unknown time" : d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
  const c = p.counts || {};
  return `${when}: ${c.patients || 0} patients, ${c.appointments || 0} appointments, ${c.invoices || 0} invoices`;
};
export const sortedPoints = newestFirst;
