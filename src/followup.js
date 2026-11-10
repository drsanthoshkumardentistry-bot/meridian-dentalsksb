/* ==============================================================================
 * MERIDENT OS - AFTER-VISIT FEEDBACK AND TREATMENT-PLAN FOLLOW-UP (pure functions)
 * Same model as reminders: WhatsApp opens with the message ready and the clinic taps Send.
 * Patients reply on WhatsApp; the clinic records the rating, so no patient-facing page is needed.
 * ============================================================================== */

import { formatINR } from "./billing.js";
import { whatsappNumber, hasWhatsAppConsent, parseAnyDate, dateKey, addDays, hasUpcomingAppointment } from "./reminders.js";

export const FEEDBACK_ASK_WITHIN_DAYS = 3; // ask only about recent visits
export const FEEDBACK_REPLY_WITHIN_DAYS = 14; // stop waiting for a reply after this
export const LOW_RATING = 3; // this and below is flagged for the clinic
export const PLAN_PROPOSED_WAIT_DAYS = 3;
export const PLAN_APPROVED_WAIT_DAYS = 7;
export const PLAN_REPEAT_DAYS = 7;

const DAY = 24 * 60 * 60 * 1000;
const daysSince = (date, now) => (now.getTime() - date.getTime()) / DAY;
const completed = (a) => a && String(a.status || "").toLowerCase() === "completed";
const consentOk = (patients, id) => {
  const p = patients.find((x) => String(x.id) === String(id));
  return hasWhatsAppConsent(p);
};

/* ------------------------------- Feedback ------------------------------- */

/** Completed visits from the last few days that we have not asked about yet. */
export const dueFeedbackRequests = (appointments = [], patients = [], now = new Date()) => {
  const earliest = dateKey(addDays(now, -FEEDBACK_ASK_WITHIN_DAYS));
  const today = dateKey(now);
  return appointments
    .filter((a) => completed(a) && !a.feedbackAskedAt && !a.feedback && a.date >= earliest && a.date <= today)
    .filter((a) => whatsappNumber(a.phone) && consentOk(patients, a.patientId))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
};

export const buildFeedbackMessage = ({ clinicName, appt }) =>
  `Hello ${appt.patientName},\n\n` +
  `Thank you for visiting ${clinicName || "our dental clinic"}${appt.procedure ? ` for ${appt.procedure}` : ""}. ` +
  `How was your experience?\n\n` +
  `Please reply with a number from 1 (poor) to 5 (excellent). If anything could have been better, tell us and we will make it right.\n\n` +
  `Thank you.`;

export const markFeedbackAsked = (appt, now = new Date()) => ({ ...appt, feedbackAskedAt: now.toISOString() });

/** Asked, but no rating recorded yet. */
export const awaitingRatings = (appointments = [], now = new Date()) =>
  appointments
    .filter((a) => a.feedbackAskedAt && !a.feedback && daysSince(new Date(a.feedbackAskedAt), now) <= FEEDBACK_REPLY_WITHIN_DAYS)
    .sort((a, b) => String(b.feedbackAskedAt).localeCompare(String(a.feedbackAskedAt)));

export const isValidRating = (n) => Number.isInteger(Number(n)) && Number(n) >= 1 && Number(n) <= 5;

export const recordRating = (appt, rating, comment = "", now = new Date()) =>
  isValidRating(rating)
    ? { ...appt, feedback: { rating: Number(rating), comment: String(comment || "").trim().slice(0, 300), at: now.toISOString(), resolved: Number(rating) > LOW_RATING } }
    : appt;

export const resolveFeedback = (appt) => (appt.feedback ? { ...appt, feedback: { ...appt.feedback, resolved: true } } : appt);

/** Low ratings the clinic has not yet followed up on. */
export const lowRatings = (appointments = []) =>
  appointments.filter((a) => a.feedback && a.feedback.rating <= LOW_RATING && !a.feedback.resolved);

export const isValidReviewLink = (url) => /^https:\/\/[^\s/]+\.[^\s/]+\S*$/i.test(String(url || "").trim());

/** A happy patient is invited to leave a public review, when the clinic has set a review link. */
export const canInviteReview = (appt, reviewLink) =>
  Boolean(appt.feedback) && appt.feedback.rating >= 4 && !appt.reviewAskedAt && isValidReviewLink(reviewLink) && Boolean(whatsappNumber(appt.phone));

export const buildReviewMessage = ({ clinicName, appt, reviewLink }) =>
  `Hello ${appt.patientName},\n\n` +
  `Thank you for the kind rating. If you have a minute, a short public review helps other patients find ${clinicName || "us"}:\n${String(reviewLink).trim()}\n\n` +
  `Thank you.`;

export const markReviewAsked = (appt, now = new Date()) => ({ ...appt, reviewAskedAt: now.toISOString() });

export const feedbackSummary = (appointments = [], now = new Date(), days = 90) => {
  const cutoff = now.getTime() - days * DAY;
  const rated = appointments.filter((a) => a.feedback && new Date(a.feedback.at).getTime() >= cutoff);
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  rated.forEach((a) => { distribution[a.feedback.rating] += 1; });
  const total = rated.reduce((s, a) => s + a.feedback.rating, 0);
  return { count: rated.length, average: rated.length ? Math.round((total / rated.length) * 10) / 10 : 0, distribution };
};

/* --------------------------- Treatment-plan follow-up --------------------------- */

/**
 * Plans the patient has not acted on: proposed a few days ago, or approved but not billed for a week.
 * Skips patients with a visit already booked, opted-out patients and plans nudged recently.
 */
export const duePlanFollowUps = (patients = [], appointments = [], now = new Date()) => {
  const due = [];
  for (const patient of patients) {
    if (!patient || !whatsappNumber(patient.phone) || !hasWhatsAppConsent(patient)) continue;
    if (hasUpcomingAppointment(patient, appointments, now)) continue;
    for (const plan of patient.plans || []) {
      if (plan.status !== "Proposed" && plan.status !== "Approved") continue;
      const since = parseAnyDate(plan.status === "Approved" ? plan.decidedAt || plan.createdAt : plan.createdAt);
      if (!since) continue;
      const wait = plan.status === "Approved" ? PLAN_APPROVED_WAIT_DAYS : PLAN_PROPOSED_WAIT_DAYS;
      const age = daysSince(since, now);
      if (age < wait) continue;
      if (plan.followedUpAt && daysSince(new Date(plan.followedUpAt), now) < PLAN_REPEAT_DAYS) continue;
      due.push({ patient, plan, days: Math.floor(age) });
    }
  }
  return due.sort((a, b) => b.days - a.days);
};

export const buildPlanFollowUp = ({ clinicName, clinicPhone, patient, plan, totalP }) =>
  `Hello ${patient.name},\n\n` +
  (plan.status === "Approved"
    ? `You agreed to your treatment plan "${plan.title}" at ${clinicName || "our dental clinic"}. Dental problems usually get bigger and costlier when treatment waits, so we would like to find a time to continue.\n\n`
    : `This is a follow-up on the treatment estimate "${plan.title}" we shared from ${clinicName || "our dental clinic"}${totalP ? ` (₹${formatINR(totalP)})` : ""}. Please let us know if you have questions or would like to go ahead.\n\n`) +
  `Reply to this message${clinicPhone ? ` or call ${clinicPhone}` : ""} to book a convenient time.\n\n` +
  `Thank you.`;

export const markPlanFollowedUp = (patient, planId, now = new Date()) => ({
  ...patient,
  plans: (patient.plans || []).map((pl) => (pl.id === planId ? { ...pl, followedUpAt: now.toISOString() } : pl)),
});
