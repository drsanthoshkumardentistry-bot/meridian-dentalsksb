// "Recently deleted": when a patient or invoice is deleted, a copy is kept for 30 days so it can be brought back.
// Pure helpers; the Firestore side is in recycleStore.js.
export const BIN_DAYS = 30;
export const BIN_COLLECTIONS = ["patients", "invoices"];
export const MAX_JSON_CHARS = 900000; // one Firestore document must stay under 1 MB

export const binId = (coll, id) => `${coll}__${String(id).replace(/[/\s]/g, "_")}`;

/** The entry to keep, or null when there is nothing worth keeping (unknown collection, no saved copy, too big). */
export const makeBinEntry = (coll, id, json, now = new Date()) => {
  if (!BIN_COLLECTIONS.includes(coll) || id === undefined || id === null || id === "") return null;
  if (typeof json !== "string" || json.charAt(0) !== "{" || json.length > MAX_JSON_CHARS) return null;
  return { id: binId(coll, id), coll, recordId: String(id), deletedAt: now.toISOString(), json };
};

/** The record inside an entry, or null if the copy cannot be read. */
export const recordOf = (entry) => {
  try {
    const r = JSON.parse(entry && entry.json);
    return r && typeof r === "object" && !Array.isArray(r) ? r : null;
  } catch { return null; }
};

export const daysLeft = (entry, now = new Date()) => {
  const t = Date.parse(entry && entry.deletedAt);
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, BIN_DAYS - Math.floor((now.getTime() - t) / 86400000));
};

/** Ids of entries older than 30 days (or with an unreadable date), ready to be removed for good. */
export const expiredIds = (entries, now = new Date()) =>
  (Array.isArray(entries) ? entries : []).filter((e) => e && e.id && daysLeft(e, now) <= 0).map((e) => e.id);

export const describeEntry = (entry) => {
  const r = recordOf(entry) || {};
  if (entry && entry.coll === "invoices") return { title: `Invoice ${r.id || (entry && entry.recordId) || ""}`.trim(), detail: [r.patientName, r.date].filter(Boolean).join(" · ") };
  return { title: String(r.name || "Unnamed patient"), detail: [r.phone, r.age ? `${r.age} yrs` : ""].filter(Boolean).join(" · ") };
};

/** Newest deletion first, skipping anything that is not an entry. */
export const sortedEntries = (entries) =>
  (Array.isArray(entries) ? entries : []).filter((e) => e && e.id && e.coll && e.json).sort((a, b) => String(b.deletedAt).localeCompare(String(a.deletedAt)));
