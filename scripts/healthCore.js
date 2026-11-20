// Pure helpers for the daily health check: size estimate, per-clinic counts, drop detection. Never keeps document contents.
export const GIB = 1024 * 1024 * 1024;
export const WARN_AT = 0.7;
export const URGENT_AT = 0.9;
export const INDEX_FACTOR = 2; // Firestore bills documents plus index entries; this rough factor keeps the estimate on the safe side

export const newTally = () => ({ docs: 0, bytes: 0, clinics: {} });

/** Adds one document ({ path, fields }) to the running tally. */
export const addDoc = (tally, d) => {
  const size = JSON.stringify(d.fields || {}).length + String(d.path).length;
  tally.docs += 1;
  tally.bytes += size;
  const m = /^clinics\/([^/]+)\/([^/]+)/.exec(String(d.path));
  if (m) {
    const c = (tally.clinics[m[1]] ||= { bytes: 0, counts: {} });
    c.bytes += size;
    c.counts[m[2]] = (c.counts[m[2]] || 0) + 1;
  }
};

export const storageLevel = (bytes, limit = GIB) => {
  const used = (bytes * INDEX_FACTOR) / limit;
  return { used, percent: Math.round(used * 1000) / 10, level: used >= URGENT_AT ? "urgent" : used >= WARN_AT ? "warn" : "ok" };
};

/** Clinics whose patients, invoices or appointments fell a lot since the last run. */
export const findDrops = (prev, cur, { dropFraction = 0.2, minPrev = 10, keys = ["patients", "invoices", "appointments"] } = {}) => {
  const out = [];
  for (const [id, p] of Object.entries((prev && prev.clinics) || {})) {
    const c = cur.clinics[id];
    for (const k of keys) {
      const before = (p.counts && p.counts[k]) || 0;
      if (before < minPrev) continue;
      const now = (c && c.counts && c.counts[k]) || 0;
      if (now < before * (1 - dropFraction)) out.push({ clinic: id.slice(0, 8), what: k, before, now });
    }
  }
  return out;
};

export const topClinics = (tally, n = 5) =>
  Object.entries(tally.clinics).sort((a, b) => b[1].bytes - a[1].bytes).slice(0, n)
    .map(([id, c]) => ({ clinic: id.slice(0, 8), mb: Math.round((c.bytes / 1048576) * 10) / 10, patients: c.counts.patients || 0 }));

/** What gets saved for tomorrow's comparison: counts only. */
export const snapshot = (tally) => ({ takenAt: new Date().toISOString(), clinics: Object.fromEntries(Object.entries(tally.clinics).map(([id, c]) => [id, { counts: c.counts }])) });

/** Did the daily encrypted backup run lately, and did its file stay about the same size? Pure: the caller fetches the data. */
export const checkBackup = ({ lastSuccessAt, bytes, expired, prevBytes, now = Date.now(), maxAgeHours = 30, minRatio = 0.5, minPrevBytes = 20000 }) => {
  const problems = [];
  if (!lastSuccessAt) problems.push("No successful daily backup run was found.");
  else {
    const hours = (now - new Date(lastSuccessAt).getTime()) / 3600000;
    if (hours > maxAgeHours) problems.push(`The last successful backup was ${Math.round(hours)} hours ago.`);
  }
  if (lastSuccessAt && (expired || !bytes)) problems.push("The latest backup file is missing or expired.");
  if (bytes && prevBytes && prevBytes >= minPrevBytes && bytes < prevBytes * minRatio) problems.push(`The backup file shrank from ${prevBytes} to ${bytes} bytes. Records may be missing.`);
  return problems;
};
