// Pure helpers for the founder's Admin profile page. No patient data is handled here.
const DAY = 86400000;
const csvCell = (v) => {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // stop spreadsheet formula injection from a hostile sign-in email
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export const toCsv = (rows) => rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
const day = (ms) => (ms ? new Date(ms).toISOString().slice(0, 10) : "");

export const clinicsCsv = (clinics = []) => toCsv([
  ["Email", "Joined", "Last sign-in", "Online now", "Minutes today", "Minutes this week", "Plan", "Paid until", "Status", "Plan request"],
  ...clinics.map((c) => [c.email, day(c.created), day(c.lastLogin), c.online ? "yes" : "no", c.todayMin || 0, c.weekMin || 0, c.plan || "", day(c.paidUntil), c.state || "", c.request || ""]),
]);

export const requestsCsv = (requests = []) => toCsv([
  ["Email", "Clinic", "Plan", "Yearly", "Status", "Asked on"],
  ...requests.map((r) => [r.email, r.clinic || "", r.plan || "", r.yearly ? "yes" : "no", r.status || "", day(r.createdAt)]),
]);

/** Who needs a call or a message today. Each list is a plain array of clinic rows. */
export function followUps(clinics = [], now = Date.now()) {
  const list = Array.isArray(clinics) ? clinics.filter(Boolean) : [];
  const soon = list.filter((c) => c.state === "paid" && c.paidUntil && c.paidUntil - now <= 7 * DAY && c.paidUntil > now);
  const expired = list.filter((c) => c.state === "expired");
  const quiet = list.filter((c) => !c.online && (!c.lastLogin || now - c.lastLogin > 30 * DAY));
  const fresh = list.filter((c) => c.created && now - c.created <= 7 * DAY);
  return { renewalsDue: soon, expired, quiet, fresh };
}

export const emailList = (rows = []) => [...new Set(rows.map((c) => String(c.email || "").trim()).filter(Boolean))].join(", ");

export const REFRESH_CHOICES = [[30000, "Every 30 seconds"], [60000, "Every minute"], [300000, "Every 5 minutes"], [0, "Only when I press Refresh"]];

/** Founder's own to-do list and notes live in this browser only. Returns safe defaults on bad data. */
export function readLocal(key, fallback, storage = typeof localStorage !== "undefined" ? localStorage : null) {
  try { const v = storage && storage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
export function writeLocal(key, value, storage = typeof localStorage !== "undefined" ? localStorage : null) {
  try { if (storage) storage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
export const cleanTodos = (v) => (Array.isArray(v) ? v : []).filter((t) => t && typeof t.text === "string" && t.text.trim()).slice(0, 50).map((t) => ({ id: String(t.id || t.text).slice(0, 40), text: t.text.slice(0, 140), done: Boolean(t.done) }));

/** New clinics per week, oldest first. The last bar is the current 7 days. */
export function weeklySignups(clinics = [], now = Date.now(), weeks = 8) {
  const list = Array.isArray(clinics) ? clinics.filter((c) => c && c.created) : [];
  return Array.from({ length: weeks }, (_, i) => {
    const end = now - (weeks - 1 - i) * 7 * DAY;
    const start = end - 7 * DAY;
    return { end, count: list.filter((c) => c.created > start && c.created <= end).length };
  });
}

/** Paid clinics by how soon the plan ends. daysLeft rounds up; urgent means 7 days or fewer. */
export function renewalsTimeline(clinics = [], now = Date.now()) {
  return (Array.isArray(clinics) ? clinics : [])
    .filter((c) => c && c.state === "paid" && c.paidUntil > now)
    .map((c) => ({ ...c, daysLeft: Math.ceil((c.paidUntil - now) / DAY) }))
    .map((c) => ({ ...c, urgent: c.daysLeft <= 7 }))
    .sort((a, b) => a.paidUntil - b.paidUntil);
}

export const SORTS = [["seen", "Last signed in"], ["time", "Most time this week"], ["new", "Newest first"], ["email", "Email A to Z"]];
export function sortClinics(rows = [], key = "seen") {
  const by = {
    seen: (a, b) => (b.lastLogin || 0) - (a.lastLogin || 0),
    time: (a, b) => (b.weekMin || 0) - (a.weekMin || 0),
    new: (a, b) => (b.created || 0) - (a.created || 0),
    email: (a, b) => String(a.email || "").localeCompare(String(b.email || "")),
  };
  return [...rows].sort(by[key] || by.seen);
}
