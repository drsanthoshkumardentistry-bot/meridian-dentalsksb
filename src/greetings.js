/* ==============================================================================
 * MERIDENT OS - BIRTHDAY GREETINGS (pure functions, no React)
 * A warm note on a patient's birthday. WhatsApp opens with the message ready and the clinic taps Send.
 * Only patients who agreed to WhatsApp, with a valid mobile, and not already greeted this year.
 * ============================================================================== */

import { whatsappNumber, hasWhatsAppConsent, dateKey } from "./reminders.js";

const parseDob = (dob) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dob || "").trim());
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const check = new Date(y, mo - 1, d);
  return check.getFullYear() === y && check.getMonth() === mo - 1 && check.getDate() === d && y > 1900 ? { y, mo, d } : null;
};

const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/** A 29 February birthday is celebrated on 28 February in years without one. */
export const isBirthdayToday = (dob, now = new Date()) => {
  const p = parseDob(dob);
  if (!p || p.y > now.getFullYear()) return false;
  const m = now.getMonth() + 1, d = now.getDate();
  if (p.mo === 2 && p.d === 29 && !isLeap(now.getFullYear())) return m === 2 && d === 28;
  return p.mo === m && p.d === d;
};

export const dueBirthdays = (patients = [], now = new Date()) => {
  const year = String(now.getFullYear());
  const list = [];
  for (const p of patients) {
    if (!p || !isBirthdayToday(p.dob, now)) continue;
    if (!whatsappNumber(p.phone) || !hasWhatsAppConsent(p)) continue;
    if (String(p.lastGreetedAt || "").slice(0, 4) === year) continue;
    list.push({ patient: p, age: now.getFullYear() - parseDob(p.dob).y });
  }
  return list.sort((a, b) => a.patient.name.localeCompare(b.patient.name));
};

export const buildBirthdayMessage = ({ clinicName, patient }) =>
  `Happy birthday, ${String(patient.name || "").split(/\s+/)[0] || "there"}! 🎂\n\n` +
  `Wishing you a healthy and happy year ahead, from all of us at ${clinicName || "your dental clinic"}.\n\n` +
  `Keep smiling!`;

export const markGreeted = (patient, now = new Date()) => ({ ...patient, lastGreetedAt: now.toISOString() });
export const todayKey = dateKey;
