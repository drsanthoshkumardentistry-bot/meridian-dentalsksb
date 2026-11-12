/* ==============================================================================
 * MERIDENT OS - FIND PATIENTS BY DATE (pure functions)
 * "Registered": when the record was created. "Seen": completed visits, visit notes and invoices.
 * "Booked": any appointment that is not cancelled (so it also finds tomorrow's patients).
 * Dates are inclusive. A blank "from" or "to" leaves that side open.
 * ============================================================================== */

import { parseAnyDate, dateKey, addDays } from "./reminders.js";

export const DATE_MODES = [
  { id: "seen", label: "Seen" },
  { id: "booked", label: "Booked" },
  { id: "registered", label: "Registered" },
];

const key = (value) => { const d = parseAnyDate(value); return d ? dateKey(d) : ""; };
const status = (a) => String(a.status || "").trim().toLowerCase();
const inRange = (k, from, to) => Boolean(k) && (!from || k >= from) && (!to || k <= to);

export const presetRange = (id, now = new Date()) => {
  const today = dateKey(now);
  if (id === "today") return { from: today, to: today };
  if (id === "yesterday") { const y = dateKey(addDays(now, -1)); return { from: y, to: y }; }
  if (id === "week") return { from: dateKey(addDays(now, -6)), to: today };
  if (id === "month") return { from: `${today.slice(0, 8)}01`, to: today };
  if (id === "tomorrow") { const t = dateKey(addDays(now, 1)); return { from: t, to: t }; }
  return { from: "", to: "" };
};

/** Patients matching the date range for the chosen mode. With no dates at all, everyone is returned. */
export const patientsInRange = (patients = [], { appointments = [], invoices = [] } = {}, { mode = "seen", from = "", to = "" } = {}) => {
  if (!from && !to) return patients;
  const hit = new Set();
  if (mode === "registered") {
    return patients.filter((p) => inRange(key(p.registeredDate), from, to));
  }
  for (const a of appointments) {
    const s = status(a);
    if (/^cancel/.test(s) || /^no[ -]?show$/.test(s)) continue;
    if (mode === "seen" && s !== "completed") continue;
    if (inRange(key(a.date), from, to)) hit.add(String(a.patientId));
  }
  if (mode === "seen") {
    for (const inv of invoices) if (inRange(key(inv.date), from, to)) hit.add(String(inv.patientId));
    for (const p of patients) if ((p.visits || []).some((v) => v && inRange(key(v.date), from, to))) hit.add(String(p.id));
  }
  return patients.filter((p) => hit.has(String(p.id)));
};

export const rangeText = (from, to) => {
  const fmt = (k) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(k || ""); return m ? `${m[3]}/${m[2]}/${m[1]}` : ""; };
  if (from && to) return from === to ? `on ${fmt(from)}` : `from ${fmt(from)} to ${fmt(to)}`;
  if (from) return `from ${fmt(from)}`;
  if (to) return `up to ${fmt(to)}`;
  return "";
};
