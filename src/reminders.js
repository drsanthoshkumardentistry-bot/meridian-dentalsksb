/* ==============================================================================
 * MERIDENT OS - PATIENT REMINDERS (pure functions, no React)
 * Reminders open WhatsApp with the message ready (wa.me). The clinic taps Send.
 * No WhatsApp Business API is needed, so there is no per-message cost or approval.
 * ============================================================================== */

import { balancePaise, formatINR } from "./billing";
import { localized } from "./messageLanguage.js";

const pad = (n) => String(n).padStart(2, "0");

/** Local calendar date as YYYY-MM-DD (the clinic's own day, not UTC). */
export const dateKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const addDays = (d, days) => {
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
  next.setDate(next.getDate() + days);
  return next;
};

/** 10-digit Indian mobile -> "91XXXXXXXXXX" for wa.me. Returns "" when the number is not valid. */
export const whatsappNumber = (phone) => {
  let d = String(phone || "").replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? `91${d}` : "";
};

export const whatsappLink = (phone, text) => {
  const n = whatsappNumber(phone);
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : "";
};

/** "14:30" -> "2:30 PM" */
export const formatTime12 = (hhmm) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || ""));
  if (!m) return String(hhmm || "");
  const h = Number(m[1]);
  return `${h % 12 === 0 ? 12 : h % 12}:${m[2]} ${h >= 12 ? "PM" : "AM"}`;
};

export const formatDateLong = (key) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key || ""));
  if (!m) return String(key || "");
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/** Patients can opt out of WhatsApp. Records without a consent object (older data) are treated as allowed. */
export const hasWhatsAppConsent = (patient) => !patient || !patient.consent || patient.consent.whatsapp !== false;

const consentFor = (patients, patientId) => {
  if (!patientId) return true;
  return hasWhatsAppConsent(patients.find((p) => String(p.id) === String(patientId)));
};

const INACTIVE = new Set(["cancelled", "canceled", "completed", "no show", "no-show"]);

/**
 * Appointments that need a reminder now.
 * - kind "dayBefore": the appointment is tomorrow
 * - kind "sameDay": the appointment is today and has not started yet
 * Skips cancelled/completed visits, invalid phone numbers and reminders already sent.
 */
export const dueAppointmentReminders = (appointments = [], now = new Date(), patients = []) => {
  const today = dateKey(now);
  const tomorrow = dateKey(addDays(now, 1));
  const nowHHMM = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const due = [];
  for (const appt of appointments) {
    if (!appt || INACTIVE.has(String(appt.status || "").toLowerCase())) continue;
    if (!whatsappNumber(appt.phone)) continue;
    if (!consentFor(patients, appt.patientId)) continue;
    const sent = appt.reminders || {};
    if (appt.date === tomorrow && !sent.dayBefore) due.push({ appt, kind: "dayBefore" });
    else if (appt.date === today && String(appt.time || "") >= nowHHMM && !sent.sameDay) due.push({ appt, kind: "sameDay" });
  }
  return due.sort((a, b) => `${a.appt.date} ${a.appt.time}`.localeCompare(`${b.appt.date} ${b.appt.time}`));
};

export const buildAppointmentReminder = ({ clinicName, appt, kind, language }) => {
  const other = localized("appointment", language, { clinicName, name: appt.patientName, sameDay: kind === "sameDay", dateTime: `${formatDateLong(appt.date)} ${formatTime12(appt.time)}`, doctor: appt.doctor });
  if (other) return other;
  const when = `${kind === "sameDay" ? "today" : "tomorrow"}, ${formatDateLong(appt.date)} at ${formatTime12(appt.time)}`;
  return (
    `Hello ${appt.patientName},\n\n` +
    `This is a reminder from ${clinicName || "your dental clinic"} about your appointment ${when}` +
    `${appt.doctor ? ` with ${appt.doctor}` : ""}` +
    `${appt.procedure ? ` (${appt.procedure})` : ""}.\n\n` +
    `Please arrive 10 minutes early. If you need to reschedule, just reply to this message.\n\n` +
    `Thank you.`
  );
};

/** Outstanding invoices to chase, not reminded in the last `minGapDays` days. */
export const duePaymentReminders = (invoices = [], patients = [], now = new Date(), minGapDays = 3) => {
  const byId = new Map(patients.map((p) => [String(p.id), p]));
  const cutoff = now.getTime() - minGapDays * 24 * 60 * 60 * 1000;
  const due = [];
  for (const inv of invoices) {
    if (!inv || balancePaise(inv) <= 0) continue;
    const phone = (byId.get(String(inv.patientId)) || {}).phone || inv.phone || "";
    if (!whatsappNumber(phone)) continue;
    if (!consentFor(patients, inv.patientId)) continue;
    if (inv.lastReminderAt && new Date(inv.lastReminderAt).getTime() > cutoff) continue;
    due.push({ inv, phone });
  }
  return due;
};

export const buildPaymentReminder = ({ clinicName, inv, upiId, language, payLink = "" }) =>
  (localized("payment", language, { clinicName, name: inv.patient, invoiceId: inv.id, amount: formatINR(balancePaise(inv)), upiId }) ||
  `Hello ${inv.patient},\n\n` +
  `A gentle reminder from ${clinicName || "your dental clinic"}: ₹${formatINR(balancePaise(inv))} is pending on invoice ${inv.id}.\n\n` +
  (upiId ? `You can pay by UPI to ${upiId}.\n\n` : "") +
  `If you have already paid, please ignore this message. Thank you.`) + (payLink ? `\n\nPay now: ${payLink}` : "");

export const markAppointmentReminded = (appt, kind, now = new Date()) => ({
  ...appt,
  reminders: { ...(appt.reminders || {}), [kind]: now.toISOString() },
});

export const markInvoiceReminded = (inv, now = new Date()) => ({ ...inv, lastReminderAt: now.toISOString() });

/* ----------------------------- Patient recall ----------------------------- */

export const RECALL_OPTIONS = [3, 6, 12];
export const DEFAULT_RECALL_MONTHS = 6;

/** Reads "2026-11-10" (date inputs) and "10/11/2026" (en-IN dates saved by the app). */
export const parseAnyDate = (value) => {
  const str = String(value || "").trim();
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(str);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12);
  m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(str);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 12);
  return null;
};

/** Whole months from `from` to `to` (a month counts once the same day-of-month has been reached). */
export const monthsBetween = (from, to) => {
  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  if (to.getDate() < from.getDate()) months -= 1;
  return months;
};

/**
 * Most recent visit on or before today: past appointments (not cancelled / no show),
 * invoices for the patient, else the registration date.
 */
export const lastVisitDate = (patient, appointments = [], invoices = [], now = new Date()) => {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  let best = null;
  const consider = (d) => {
    if (d && d <= today && (!best || d > best)) best = d;
  };
  for (const a of appointments) {
    if (String(a.patientId) !== String(patient.id)) continue;
    const status = String(a.status || "").toLowerCase();
    if (status === "cancelled" || status === "canceled" || status === "no show" || status === "no-show") continue;
    consider(parseAnyDate(a.date));
  }
  for (const inv of invoices) {
    if (String(inv.patientId) === String(patient.id)) consider(parseAnyDate(inv.date));
  }
  if (!best) consider(parseAnyDate(patient.registeredDate));
  return best;
};

export const hasUpcomingAppointment = (patient, appointments, now) => {
  const todayKey = dateKey(now);
  return appointments.some((a) => {
    if (String(a.patientId) !== String(patient.id)) return false;
    const status = String(a.status || "").toLowerCase();
    if (status === "cancelled" || status === "canceled") return false;
    return String(a.date || "") >= todayKey;
  });
};

/**
 * Patients due for a recall: last visit at least `recallMonths` ago (default 6),
 * no appointment already booked, WhatsApp allowed, valid mobile, not nudged in the last 30 days.
 * Oldest visits first.
 */
export const dueRecalls = (patients = [], appointments = [], invoices = [], now = new Date(), snoozeDays = 30) => {
  const cutoff = now.getTime() - snoozeDays * 24 * 60 * 60 * 1000;
  const due = [];
  for (const patient of patients) {
    if (!patient || !whatsappNumber(patient.phone) || !hasWhatsAppConsent(patient)) continue;
    if (patient.lastRecallAt && new Date(patient.lastRecallAt).getTime() > cutoff) continue;
    if (hasUpcomingAppointment(patient, appointments, now)) continue;
    const last = lastVisitDate(patient, appointments, invoices, now);
    if (!last) continue;
    const months = monthsBetween(last, now);
    const every = RECALL_OPTIONS.includes(Number(patient.recallMonths)) ? Number(patient.recallMonths) : DEFAULT_RECALL_MONTHS;
    if (months >= every) due.push({ patient, lastVisit: last, months });
  }
  return due.sort((a, b) => a.lastVisit - b.lastVisit);
};

export const buildRecallMessage = ({ clinicName, clinicPhone, patient, months, language }) =>
  localized("recall", language, { clinicName, phone: clinicPhone, name: patient.name, months }) ||
  `Hello ${patient.name},\n\n` +
  `It has been ${months} months since your last visit to ${clinicName || "our dental clinic"}. ` +
  `A routine check-up and cleaning helps catch problems early.\n\n` +
  `Reply to this message${clinicPhone ? ` or call ${clinicPhone}` : ""} to book a convenient time.\n\n` +
  `Thank you.`;

export const markPatientRecalled = (patient, now = new Date()) => ({ ...patient, lastRecallAt: now.toISOString() });
