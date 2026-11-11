/* ==============================================================================
 * MERIDENT OS - PHYSICIAN CONSULT AND PATIENT HISTORY SUMMARY (pure functions, no React)
 * A dentist needs to know when the patient last saw their physician and what was advised,
 * especially for patients with conditions such as diabetes, heart disease or high blood pressure.
 * ============================================================================== */

import { dateKey, parseAnyDate, monthsBetween } from "./reminders.js";
import { sortVisits } from "./visits.js";
import { normalizeInvoice } from "./billing.js";

export const CLEARANCE = ["", "Fit for dental treatment", "Needs physician advice first"];

const clip = (v, n) => String(v || "").trim().slice(0, n);

/** Shapes what the clinic typed. Keeps a date only when it is a real past or present yyyy-mm-dd date. */
export const cleanPhysician = (form = {}, now = new Date()) => {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(form.lastConsultDate || "")) && form.lastConsultDate <= dateKey(now) ? form.lastConsultDate : "";
  return {
    name: clip(form.name, 80),
    phone: clip(form.phone, 20),
    lastConsultDate: date,
    reason: clip(form.reason, 300),
    advice: clip(form.advice, 500),
    medicines: clip(form.medicines, 500),
    clearance: CLEARANCE.includes(form.clearance) ? form.clearance : "",
  };
};

export const hasPhysicianInfo = (p) => Boolean(p && (p.name || p.lastConsultDate || p.reason || p.advice || p.medicines || p.clearance));

const hasCondition = (patient) => {
  const c = String(patient?.conditions || "").trim().toLowerCase();
  return Boolean(c) && !/^(none|nil|no|n\/a|not recorded|none reported)\b/.test(c);
};

/** How long ago the last physician consult was, with a nudge when it is old and the patient has conditions. */
export const physicianStatus = (patient, now = new Date()) => {
  const ph = patient?.physician;
  const date = ph?.lastConsultDate ? parseAnyDate(ph.lastConsultDate) : null;
  if (!date) {
    return hasCondition(patient)
      ? { state: "missing", tone: "warn", label: "No physician consult recorded. Ask, as this patient has a medical condition." }
      : { state: "none", tone: "muted", label: "No physician consult recorded" };
  }
  const months = monthsBetween(date, now);
  const when = date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const ago = months < 1 ? "less than a month ago" : months === 1 ? "1 month ago" : `${months} months ago`;
  if (hasCondition(patient) && months >= 6) return { state: "old", tone: "warn", label: `Last physician consult ${when} (${ago}). Consider asking for an update.` };
  return { state: "recent", tone: "ok", label: `Last physician consult ${when} (${ago})` };
};

/** One screen of the newest facts about a patient. */
export const historySummary = (patient, { appointments = [], invoices = [], now = new Date() } = {}) => {
  const today = dateKey(now);
  const same = (a) => (a.patientId && String(a.patientId) === String(patient.id)) || (!a.patientId && String(a.patientName || "").trim().toLowerCase() === String(patient.name || "").trim().toLowerCase());
  const mine = appointments.filter(same);
  const lastVisit = sortVisits(patient.visits || [])[0] || null;
  const upcoming = mine.filter((a) => a.date >= today && !/^(cancel|completed|no.?show)/i.test(String(a.status || ""))).sort((a, b) => `${a.date} ${a.time || ""}`.localeCompare(`${b.date} ${b.time || ""}`))[0] || null;
  const lastDone = mine.filter((a) => /^completed/i.test(String(a.status || "")) && a.date <= today).sort((a, b) => b.date.localeCompare(a.date))[0] || null;
  const inv = invoices
    .filter((i) => (i.patientId && String(i.patientId) === String(patient.id)) || (!i.patientId && String(i.patient || "").trim().toLowerCase() === String(patient.name || "").trim().toLowerCase()))
    .map(normalizeInvoice)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const lastInvoice = inv[0] || null;
  const dueP = inv.reduce((s, i) => s + Math.max(0, (i.totalP || 0) - (i.payments || []).reduce((x, p) => x + (p.amountP || 0), 0)), 0);
  return {
    alert: clip(patient.medicalAlert, 300),
    conditions: clip(patient.conditions, 300),
    allergies: clip(patient.allergies, 300),
    lastVisit,
    lastCompletedAppointment: lastDone,
    nextAppointment: upcoming,
    lastInvoice,
    dueP,
    physician: patient.physician && hasPhysicianInfo(patient.physician) ? patient.physician : null,
    physicianStatus: physicianStatus(patient, now),
    plansOpen: (patient.plans || []).filter((p) => p.status === "Proposed" || p.status === "Approved").length,
  };
};
