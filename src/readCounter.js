// Counts database reads on this device, per day, so the owner can see what the clinic costs to run.
// Stored only in this browser. It never writes to the database.
const KEY = "merident-reads";
const KEEP_DAYS = 14;
export const READ_PRICE_PER_100K = 0.06; // US dollars, Firestore price beyond the free allowance
export const FREE_READS_PER_DAY = 50000; // shared by every clinic on the project

const dayKey = (now) => new Date(now).toISOString().slice(0, 10);

const load = (store) => {
  try { const v = JSON.parse(store.getItem(KEY) || "{}"); return v && typeof v === "object" ? v : {}; } catch { return {}; }
};

const defaultStore = () => (typeof localStorage !== "undefined" ? localStorage : null);

/** Adds n reads to today's total. Never throws. */
export const recordReads = (n, now = Date.now(), store = defaultStore()) => {
  const count = Math.floor(Number(n));
  if (!store || !Number.isFinite(count) || count <= 0) return;
  try {
    const data = load(store);
    const k = dayKey(now);
    data[k] = (Number(data[k]) || 0) + count;
    const keep = Object.keys(data).sort().slice(-KEEP_DAYS);
    const trimmed = {};
    keep.forEach((d) => { trimmed[d] = data[d]; });
    store.setItem(KEY, JSON.stringify(trimmed));
  } catch { /* storage blocked: the counter is only a convenience */ }
};

/** Reads counted today on this device. */
export const readsToday = (now = Date.now(), store = defaultStore()) => (store ? Number(load(store)[dayKey(now)]) || 0 : 0);

/** Average reads per day over the days that have a count. */
export const averageDailyReads = (store = defaultStore()) => {
  if (!store) return 0;
  const vals = Object.values(load(store)).map(Number).filter((v) => v > 0);
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
};

/** Rough monthly cost in rupees if this many reads happen every day for one clinic, ignoring the shared free allowance. */
export const monthlyRupees = (readsPerDay, rupeesPerDollar = 88) => Math.round((readsPerDay * 30 / 100000) * READ_PRICE_PER_100K * rupeesPerDollar);

/** Reads a snapshot cost: documents that came from the server, not from the device's saved copy. */
export const serverReadsOf = (snapshot) => {
  try {
    if (!snapshot || snapshot.metadata?.fromCache) return 0;
    return typeof snapshot.docChanges === "function" ? snapshot.docChanges().length : 0;
  } catch { return 0; }
};
