// Automatic restore points (pure helpers). Once a day the owner's session saves a copy of the clinic's records inside
// the clinic's own private space, and keeps the last few. Restoring brings back records that were deleted by mistake.
export const RESTORE_KEEP = 7; // the newest seven, plus one per week for four weeks and one per month for six months (see toDelete)
export const KEEP_WEEKS = 4;
export const KEEP_MONTHS = 6;
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

const weekKey = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? "" : `${new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * 86400000).toISOString().slice(0, 10)}`; };
const monthKey = (iso) => String(iso).slice(0, 7);

/**
 * Ids of the restore points to remove. Kept: the newest `keep`, then the newest copy of each of the next four weeks,
 * then the newest copy of each of the next six months. So a mistake noticed weeks later can still be undone.
 */
export const toDelete = (points, keep = RESTORE_KEEP) => {
  const list = newestFirst(points);
  const kept = new Set(list.slice(0, keep).map((p) => p.id));
  const rest = list.slice(keep);
  const weeks = new Set();
  const topAt = list.length ? Date.parse(list[0].at) : NaN;
  for (const p of rest) {
    if (Number.isFinite(topAt) && topAt - Date.parse(p.at) > (KEEP_WEEKS + 1) * 7 * 86400000) continue; // older than about a month: left to the monthly rule
    const k = weekKey(p.at);
    if (k && !weeks.has(k) && weeks.size < KEEP_WEEKS) { weeks.add(k); kept.add(p.id); }
  }
  const months = new Set();
  const newestAt = list.length ? Date.parse(list[0].at) : NaN;
  for (const p of rest) {
    if (kept.has(p.id)) continue;
    if (Number.isFinite(newestAt) && newestAt - Date.parse(p.at) > KEEP_MONTHS * 31 * 86400000) continue; // older than six months
    const k = monthKey(p.at);
    if (!months.has(k)) { months.add(k); kept.add(p.id); }
  }
  return list.filter((p) => !kept.has(p.id)).map((p) => p.id);
};

/** Whole days since the newest copy, or null when there is none. */
export const daysSinceNewest = (points, now = new Date()) => {
  const newest = newestFirst(points)[0];
  const t = newest ? Date.parse(newest.at) : NaN;
  return Number.isFinite(t) ? Math.floor((now.getTime() - t) / 86400000) : null;
};

export const describePoint = (p) => {
  const d = new Date(p.at);
  const when = Number.isNaN(d.getTime()) ? "Unknown time" : d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
  const c = p.counts || {};
  return `${when}: ${c.patients || 0} patients, ${c.appointments || 0} appointments, ${c.invoices || 0} invoices`;
};
export const sortedPoints = newestFirst;
