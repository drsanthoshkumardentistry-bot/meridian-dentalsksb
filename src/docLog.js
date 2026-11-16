// MeriDent DocLog: a visiting doctor's private log of clinic visits, treatments and payments.
// Money is kept in paise (whole numbers). Dates are "YYYY-MM-DD" strings in local time.
import { MAX_AMOUNT_P, toPaise } from "./billing.js";
import { toCsv } from "./reports.js";
import { SPECIALTIES } from "./connect/rules.js";

export const TREATMENTS = ["Consultation", "RCT", "Extraction", "Surgery", "Implant", "Perio", "Ortho", "Other"];
/** Treatment buttons shown in "Add visit" for each speciality. "Other" is always last. */
export const SPECIALTY_TREATMENTS = {
  general: ["Consultation", "Filling", "Scaling", "RCT", "Extraction", "Crown", "Denture", "Other"],
  endodontics: ["Consultation", "RCT", "Retreatment", "Re-RCT access", "Post and core", "Apicoectomy", "Pulpotomy", "Other"],
  oral_surgery: ["Consultation", "Surgical extraction", "Impaction", "Cyst enucleation", "Implant placement", "Sinus lift", "Fracture fixation", "Biopsy", "Other"],
  periodontics: ["Consultation", "Scaling", "Flap surgery", "Gingivectomy", "Graft", "Crown lengthening", "Maintenance", "Other"],
  orthodontics: ["Consultation", "Braces fixing", "Adjustment", "Aligners", "Retainer", "Debonding", "Other"],
  prosthodontics: ["Consultation", "Crown and bridge", "Complete denture", "Partial denture", "Veneer", "Implant crown", "Maxillofacial prosthesis", "Other"],
  pedodontics: ["Consultation", "Pulpectomy", "Pulpotomy", "Stainless steel crown", "Space maintainer", "Sealant", "Fluoride", "Other"],
  implantology: ["Consultation", "Implant placement", "Bone graft", "Sinus lift", "Second stage", "Implant crown", "Other"],
  oral_medicine: ["Consultation", "OPG", "CBCT", "Biopsy", "Lesion management", "TMJ management", "Other"],
  oral_pathology: ["Consultation", "Biopsy", "Cytology", "Report", "Other"],
  public_health: ["Consultation", "Screening camp", "Oral health talk", "Fluoride programme", "Other"],
};
export const specialtyOptions = SPECIALTIES;
/** Treatment buttons for a speciality; unknown or unset gives the general list. */
export const treatmentsFor = (specialty) => SPECIALTY_TREATMENTS[specialty] || SPECIALTY_TREATMENTS.general;

/** Checks the doctor's own DocLog profile. Returns { error } or { profile }. */
export function buildProfile(form) {
  const specialty = String((form && form.specialty) || "");
  if (!SPECIALTIES.some(([k]) => k === specialty)) return { error: "Choose your speciality." };
  return { profile: { name: clean(form.name, 80), qualification: clean(form.qualification, 60), specialty } };
}

export const CASE_STATUSES = [["planned", "Planned"], ["inprogress", "In progress"], ["completed", "Completed"]];
export const PAY_MODES = [["cash", "Cash"], ["upi", "UPI"], ["bank", "Bank transfer"], ["other", "Other"]];
export const MAX_VISITS_LOADED = 600;
export const MAX_CLINICS = 40;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const pad = (n) => String(n).padStart(2, "0");
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const clean = (v, max) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const validDate = (s) => {
  if (!DATE_RE.test(String(s))) return false;
  const [y, m, d] = s.split("-").map(Number);
  const t = new Date(y, m - 1, d);
  return t.getFullYear() === y && t.getMonth() === m - 1 && t.getDate() === d;
};
const dayNumber = (s) => { const [y, m, d] = s.split("-").map(Number); return Math.round(Date.UTC(y, m - 1, d) / 86400000); };
export const daysBetween = (from, to) => dayNumber(to) - dayNumber(from);
const paise = (v) => Math.max(0, Math.round(typeof v === "number" ? v : toPaise(v || 0)));
const label = (list, id) => (list.find(([k]) => k === id) || [])[1] || "";
export const statusLabel = (id) => label(CASE_STATUSES, id);
/** Payment mode text: a known mode shows its name; a mode the doctor typed under "Other" shows as typed. */
export const modeLabel = (id) => label(PAY_MODES, id) || String(id || "").slice(0, 10);

/** Checks a clinic form. Returns { error } or { clinic }. */
export function buildClinic(form, id) {
  const name = clean(form.name, 80);
  if (!name) return { error: "Enter the clinic name." };
  const place = clean(form.place, 80);
  const contact = clean(form.contact, 80);
  const phone = String(form.phone || "").replace(/[^\d+]/g, "").slice(0, 15);
  const fee = form.defaultFee === "" || form.defaultFee == null ? 0 : toPaise(form.defaultFee);
  if (fee < 0 || fee > MAX_AMOUNT_P) return { error: "Enter a usual fee between 0 and 1 crore rupees." };
  let share = form.sharePct === "" || form.sharePct == null ? 0 : Number(form.sharePct);
  if (!Number.isFinite(share) || share < 0 || share > 100) return { error: "Your share must be between 0 and 100 percent." };
  share = Math.round(share * 100) / 100;
  return { clinic: { id, name, place, contact, phone, defaultFeeP: fee, sharePct: share, note: clean(form.note, 200) } };
}

/** Checks a visit form against the clinic list. Returns { error } or { visit }. */
export function buildVisit(form, id, clinics, now = new Date()) {
  const clinic = clinics.find((c) => c.id === form.clinicId);
  if (!clinic) return { error: "Choose the clinic." };
  if (!validDate(form.date)) return { error: "Enter the date of the visit." };
  const today = dayKey(now);
  if (daysBetween(today, form.date) > 366) return { error: "That date is more than a year ahead." };
  if (daysBetween(form.date, today) > 366 * 10) return { error: "That date is too far in the past." };
  const treatment = clean(form.treatment, 40);
  if (!treatment) return { error: "Choose the treatment." };
  const status = CASE_STATUSES.some(([k]) => k === form.status) ? form.status : "completed";
  const next = form.nextVisit ? String(form.nextVisit) : "";
  if (next) {
    if (!validDate(next)) return { error: "Enter the next visit date." };
    if (daysBetween(form.date, next) < 0) return { error: "The next visit cannot be before this visit." };
    if (daysBetween(today, next) > 366 * 2) return { error: "The next visit date is too far ahead." };
  }
  const fee = paise(form.fee);
  const received = paise(form.received);
  if (fee > MAX_AMOUNT_P) return { error: "That fee is too large. Check the zeros." };
  if (received > fee) return { error: "The amount received is more than the fee." };
  let age = "";
  if (form.age !== "" && form.age != null) {
    const n = Number(form.age);
    if (!Number.isInteger(n) || n < 0 || n > 120) return { error: "Enter an age between 0 and 120, or leave it empty." };
    age = n;
  }
  let mode = "";
  if (received > 0) {
    if (form.payMode === "other") mode = clean(form.payOther, 10) || "other";
    else mode = PAY_MODES.some(([k]) => k === form.payMode) ? form.payMode : "cash";
  }
  return {
    visit: {
      id, clinicId: clinic.id, clinicName: clinic.name, clinicPlace: clinic.place || "", date: form.date,
      patient: clean(form.patient, 80), age, phone: String(form.phone || "").replace(/[^\d+]/g, "").slice(0, 15),
      treatment, tooth: clean(form.tooth, 20), done: clean(form.done, 120), status, nextVisit: next,
      feeP: fee, receivedP: received, payMode: mode, note: clean(form.note, 300),
      createdAt: (form.createdAt || now.toISOString()), updatedAt: now.toISOString(),
    },
  };
}

export const pendingP = (v) => Math.max(0, (v.feeP || 0) - (v.receivedP || 0));
/** "paid", "part", "pending", or "free" when there was no fee. */
export const paymentState = (v) => (!(v.feeP > 0) ? "free" : pendingP(v) === 0 ? "paid" : (v.receivedP || 0) > 0 ? "part" : "pending");

const byDateDesc = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : String(b.createdAt).localeCompare(String(a.createdAt)));
/** Visits as a clean list: anything that is not a list, and any empty or non-object entry, is dropped. */
const list = (x) => (Array.isArray(x) ? x : []).filter((v) => v && typeof v === "object");
export const sortVisits = (visits) => [...list(visits)].sort(byDateDesc);
export const monthOf = (date) => String(date).slice(0, 7);
export const monthsPresent = (visits, currentYm) => [...new Set([currentYm, ...list(visits).map((v) => monthOf(v.date))])].sort().reverse();

/** Totals for one month (ym = "2026-11") or for everything (ym = ""). */
export function summary(visits, ym) {
  const rows = list(visits).filter((v) => !ym || monthOf(v.date) === ym);
  const earnedP = rows.reduce((s, v) => s + (v.feeP || 0), 0);
  const receivedP = rows.reduce((s, v) => s + (v.receivedP || 0), 0);
  return {
    count: rows.length, clinics: new Set(rows.map((v) => v.clinicId)).size, earnedP, receivedP,
    pendingP: Math.max(0, earnedP - receivedP), pendingClinics: new Set(rows.filter((v) => pendingP(v) > 0).map((v) => v.clinicId)).size,
    collectedPct: earnedP > 0 ? Math.round((receivedP / earnedP) * 100) : 0,
  };
}

/** Money still owed, per clinic, across all months, biggest first. */
export function duesByClinic(visits, today) {
  const map = new Map();
  for (const v of visits || []) {
    const p = pendingP(v);
    if (!p) continue;
    const row = map.get(v.clinicId) || { clinicId: v.clinicId, name: v.clinicName, pendingP: 0, oldest: v.date };
    row.pendingP += p;
    if (v.date < row.oldest) row.oldest = v.date;
    map.set(v.clinicId, row);
  }
  return [...map.values()].map((r) => ({ ...r, oldestDays: Math.max(0, daysBetween(r.oldest, today)) })).sort((a, b) => b.pendingP - a.pendingP);
}

const samePatient = (a, b) => a.clinicId === b.clinicId && a.patient && b.patient && a.patient.toLowerCase() === b.patient.toLowerCase();

/** Next visits from today onward. A booking is dropped once a later visit for the same patient at the same clinic is logged. */
export function comingUp(visits, today, limit = 6) {
  const all = visits || [];
  return all
    .filter((v) => v.nextVisit && v.nextVisit >= today)
    .filter((v) => !all.some((o) => o.id !== v.id && samePatient(o, v) && o.date >= v.nextVisit))
    .sort((a, b) => (a.nextVisit < b.nextVisit ? -1 : a.nextVisit > b.nextVisit ? 1 : 0))
    .slice(0, limit);
}

/** "Visit 3" for a patient's third visit of the same treatment at that clinic, up to and including this one. */
export function visitNumber(visits, v) {
  if (!v.patient) return 1;
  return list(visits).filter((o) => samePatient(o, v) && o.treatment === v.treatment && (o.date < v.date || (o.date === v.date && String(o.createdAt) <= String(v.createdAt)))).length || 1;
}

export function filterVisits(visits, { ym = "", clinicId = "", status = "all", q = "" } = {}) {
  const needle = String(q).trim().toLowerCase();
  return sortVisits(visits).filter((v) => {
    if (ym && monthOf(v.date) !== ym) return false;
    if (clinicId && v.clinicId !== clinicId) return false;
    if (status === "inprogress" && v.status !== "inprogress") return false;
    if (status === "completed" && v.status !== "completed") return false;
    if (status === "pending" && pendingP(v) === 0) return false;
    if (needle && !`${v.patient} ${v.treatment} ${v.done} ${v.tooth} ${v.clinicName}`.toLowerCase().includes(needle)) return false;
    return true;
  });
}

/**
 * A clinic paid some money: apply it to that clinic's oldest unpaid visits first.
 * Returns the changed visits and any amount left over (when more was entered than is owed).
 */
export function allocatePayment(visits, clinicId, amountP, mode, now = new Date()) {
  let left = Math.max(0, Math.round(amountP || 0));
  const changed = [];
  const open = list(visits).filter((v) => v.clinicId === clinicId && pendingP(v) > 0).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : String(a.createdAt).localeCompare(String(b.createdAt))));
  for (const v of open) {
    if (left <= 0) break;
    const take = Math.min(left, pendingP(v));
    changed.push({ ...v, receivedP: (v.receivedP || 0) + take, payMode: PAY_MODES.some(([k]) => k === mode) ? mode : "cash", updatedAt: now.toISOString() });
    left -= take;
  }
  return { changed, leftoverP: left };
}

export function docLogCsv(visits, ym = "") {
  const money = (p) => (p / 100).toFixed(2);
  const rows = [["Date", "Clinic", "Place", "Patient", "Age", "Treatment", "Tooth", "What was done", "Treatment status", "Next visit", "Fee (Rs)", "Received (Rs)", "Pending (Rs)", "Payment mode", "Note"]];
  for (const v of filterVisits(visits, { ym }).reverse()) {
    rows.push([v.date, v.clinicName, v.clinicPlace, v.patient, v.age, v.treatment, v.tooth, v.done, statusLabel(v.status), v.nextVisit, money(v.feeP || 0), money(v.receivedP || 0), money(pendingP(v)), modeLabel(v.payMode), v.note]);
  }
  return toCsv(rows);
}

/** "Dr.priyanka" -> "Priyanka": drops a typed "Dr", capitalises only words typed in lower case, keeps the rest as typed. */
export const doctorName = (raw) => {
  const t = String(raw || "").replace(/\s+/g, " ").trim().replace(/^(dr|doctor)\b\.?\s*/i, "").replace(/^[\s.,-]+/, "");
  return t.split(" ").filter(Boolean).map((w) => (w === w.toLowerCase() ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(" ");
};

/** The line shown when DocLog opens, e.g. "Hi Dr. Priyanka". Falls back to a plain greeting when no name is known. */
export const greeting = (name) => { const n = doctorName(name); return n ? `Hi Dr. ${n}` : "Hi doctor"; };

/** One short line about today: bookings today, and money still to receive. Empty when there is nothing to say. */
export const todayLine = (visits, today, fmt = (p) => String(p / 100)) => {
  const list_ = Array.isArray(visits) ? visits : [];
  const booked = comingUp(list_, today, 500).filter((v) => v.nextVisit === today).length;
  const dues = duesByClinic(list_, today);
  const owed = dues.reduce((n, d) => n + d.pendingP, 0);
  const parts = [];
  if (booked > 0) parts.push(`${booked} follow-up${booked === 1 ? "" : "s"} booked for today`);
  if (owed > 0) parts.push(`${fmt(owed)} still to receive from ${dues.length} clinic${dues.length === 1 ? "" : "s"}`);
  return parts.join(" · ");
};
