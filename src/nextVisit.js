/* ==============================================================================
 * MERIDENT OS - NEXT-VISIT REMINDERS FOR TREATMENT IN STAGES (pure functions)
 * A visit note can carry a real "next visit on" date (root canal stage 2, crown fitting, suture removal).
 * When that date is near or passed and nothing is booked, the clinic gets a WhatsApp message ready to send.
 * ============================================================================== */

import { whatsappNumber, hasWhatsAppConsent, hasUpcomingAppointment, dateKey, addDays, parseAnyDate } from "./reminders.js";

export const NEXT_VISIT_PRESETS = [
  { label: "3 days", days: 3 },
  { label: "1 week", days: 7 },
  { label: "2 weeks", days: 14 },
  { label: "1 month", days: 30 },
];
export const NEXT_VISIT_LEAD_DAYS = 2; // start listing this many days before the date
export const NEXT_VISIT_GIVE_UP_DAYS = 45; // stop listing a missed visit after this
export const NEXT_VISIT_REPEAT_DAYS = 5;

const DAY = 24 * 60 * 60 * 1000;

/** yyyy-mm-dd that is `days` after the visit date. */
export const nextVisitFrom = (visitDate, days) => {
  const base = parseAnyDate(visitDate);
  return base ? dateKey(addDays(base, days)) : "";
};

/**
 * Patients whose newest visit note has a next-visit date that is close or missed,
 * with nothing booked and no visit since. Opted-out patients and bad numbers are skipped.
 */
export const dueNextVisits = (patients = [], appointments = [], now = new Date()) => {
  const today = dateKey(now);
  const soonest = dateKey(addDays(now, NEXT_VISIT_LEAD_DAYS));
  const oldest = dateKey(addDays(now, -NEXT_VISIT_GIVE_UP_DAYS));
  const out = [];
  for (const patient of patients) {
    if (!patient || !whatsappNumber(patient.phone) || !hasWhatsAppConsent(patient)) continue;
    const visit = (patient.visits || [])[0]; // newest first
    if (!visit || !visit.nextVisitOn || visit.nextVisitOn > soonest || visit.nextVisitOn < oldest) continue;
    if (visit.nextRemindedAt && now.getTime() - new Date(visit.nextRemindedAt).getTime() < NEXT_VISIT_REPEAT_DAYS * DAY) continue;
    if (hasUpcomingAppointment(patient, appointments, now)) continue;
    const cameBack = appointments.some((a) => String(a.patientId) === String(patient.id) && String(a.status || "").toLowerCase() === "completed" && a.date > visit.date && a.date <= today);
    if (cameBack) continue;
    const daysLate = Math.round((parseAnyDate(today) - parseAnyDate(visit.nextVisitOn)) / DAY);
    out.push({ patient, visit, daysLate });
  }
  return out.sort((a, b) => b.daysLate - a.daysLate);
};

export const buildNextVisitMessage = ({ clinicName, clinicPhone, patient, visit, formatDate }) => {
  const when = formatDate ? formatDate(visit.nextVisitOn) : visit.nextVisitOn;
  const what = visit.nextVisit ? ` (${visit.nextVisit})` : "";
  return (
    `Hello ${patient.name},\n\n` +
    `Your next visit at ${clinicName || "our dental clinic"} is due on ${when}${what}. ` +
    `Finishing treatment on time helps it work well and avoids extra pain or cost later.\n\n` +
    `Reply to this message${clinicPhone ? ` or call ${clinicPhone}` : ""} and we will fix a time that suits you.\n\n` +
    `Thank you.`
  );
};

export const markNextVisitReminded = (patient, visitId, now = new Date()) => ({
  ...patient,
  visits: (patient.visits || []).map((v) => (v.id === visitId ? { ...v, nextRemindedAt: now.toISOString() } : v)),
});
