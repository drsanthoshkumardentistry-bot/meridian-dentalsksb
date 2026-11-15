import { dateKey, addDays } from "./reminders.js";

// Appointments only make sense in a window around today. Without a limit, year 1900 or 9999 was accepted and
// the entry then sat in the diary forever.
export const APPT_BACK_DAYS = 366;   // recording a visit that already happened
export const APPT_AHEAD_DAYS = 730;  // two years ahead
export const BOOKING_AHEAD_DAYS = 365; // patients booking online

export const windowFor = (now = new Date(), back = APPT_BACK_DAYS, ahead = APPT_AHEAD_DAYS) => ({
  min: dateKey(addDays(now, -back)),
  maxAhead: dateKey(addDays(now, ahead)),
});

/** "" when iso (yyyy-mm-dd) is inside the window, otherwise a short message for the user. */
export const rangeProblem = (iso, now = new Date(), back = APPT_BACK_DAYS, ahead = APPT_AHEAD_DAYS) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso || ""))) return "";
  const w = windowFor(now, back, ahead);
  if (iso < w.min) return "That date is too far in the past.";
  if (iso > w.maxAhead) return "That date is too far ahead.";
  return "";
};
