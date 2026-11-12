/* ==============================================================================
 * MERIDENT OS - PATIENT PORTAL (pure functions)
 * One private link per patient. The clinic publishes a small snapshot (upcoming visits, bills, plans,
 * latest advice) at portalPages/{token}. Whoever holds the link can read that one page and nothing else.
 * It never carries phone numbers, addresses, diagnoses, charts or X-rays.
 * ============================================================================== */

import { balancePaise, paidPaise, isValidUpiId } from "./billing.js";
import { planTotals, newShareToken } from "./plans.js";
import { dateKey } from "./reminders.js";

export const PORTAL_DAYS = 30;
export const MAX_UPCOMING = 10;
export const MAX_BILLS = 12;
export const MAX_PLANS = 10;

export { newShareToken as newPortalToken };
export const portalUrl = (origin, token) => `${String(origin).replace(/\/$/, "")}/?portal=${encodeURIComponent(token)}`;

const live = (a) => !["cancelled", "canceled", "no show", "no-show"].includes(String(a.status || "").toLowerCase());
const text = (v, n) => String(v || "").trim().slice(0, n);

/** The snapshot a patient may see. `now` is injectable for tests. */
export const buildPortalDoc = ({ clinicId, profile = {}, patient, appointments = [], invoices = [] }, now = new Date()) => {
  const today = dateKey(now);
  const mine = (x) => String(x.patientId) === String(patient.id);
  const upcoming = appointments
    .filter((a) => mine(a) && live(a) && String(a.date || "") >= today)
    .sort((a, b) => `${a.date} ${a.time || ""}`.localeCompare(`${b.date} ${b.time || ""}`))
    .slice(0, MAX_UPCOMING)
    .map((a) => ({ date: text(a.date, 10), time: text(a.time, 5), procedure: text(a.procedure, 80), doctor: text(a.doctor, 60) }));
  const bills = invoices
    .filter(mine)
    .slice(0, MAX_BILLS)
    .map((i) => ({ number: text(i.id, 30), date: text(i.date, 20), totalP: i.totalP || 0, paidP: paidPaise(i), balanceP: balancePaise(i) }));
  const plans = (patient.plans || [])
    .filter((p) => p.status && p.status !== "Declined")
    .slice(0, MAX_PLANS)
    .map((p) => ({ title: text(p.title, 80), status: text(p.status, 20), totalP: planTotals(p).totalP }));
  const latest = (patient.visits || [])[0] || null;
  return {
    clinicId,
    clinicName: text(profile.name || "Your dental clinic", 80),
    clinicPhone: text(profile.phone, 20),
    upiId: isValidUpiId(profile.upiId) ? String(profile.upiId).trim() : "",
    patientFirstName: text(String(patient.name || "").split(/\s+/)[0], 40),
    upcoming,
    bills,
    plans,
    advice: latest ? text(latest.advice, 500) : "",
    nextVisitOn: latest && latest.nextVisitOn ? latest.nextVisitOn : "",
    outstandingP: bills.reduce((s, b) => s + b.balanceP, 0),
    updatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + PORTAL_DAYS * 24 * 60 * 60 * 1000),
  };
};

const toDate = (v) => (v && typeof v.toDate === "function" ? v.toDate() : v instanceof Date ? v : new Date(v));
export const isPortalExpired = (page, now = new Date()) => !page || !(toDate(page.expiresAt) > now);

export const buildPortalMessage = ({ clinicName, patient, url }) =>
  `Hello ${patient.name},\n\n` +
  `${clinicName || "Your dental clinic"} has a private page for you with your upcoming visits, bills and treatment plan:\n${url}\n\n` +
  `Only you have this link, so please do not forward it. It stays valid for ${PORTAL_DAYS} days.\n\n` +
  `Thank you.`;
