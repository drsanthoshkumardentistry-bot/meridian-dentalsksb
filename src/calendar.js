// Month grid for the header calendar: how many visits fall on each day. Cancelled visits are not counted.
import { dateKey } from "./reminders.js";

const cancelled = (a) => ["cancelled", "canceled"].includes(String(a?.status || "").toLowerCase());
export const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Visits per yyyy-mm-dd. */
export const countsByDate = (appointments = []) => {
  const out = {};
  for (const a of Array.isArray(appointments) ? appointments : []) if (a && a.date && !cancelled(a)) out[a.date] = (out[a.date] || 0) + 1;
  return out;
};

/** Weeks (Monday first) of day cells for a month. month is 0-11. */
export const monthGrid = (appointments, year, month, now = new Date()) => {
  const counts = countsByDate(appointments);
  const today = dateKey(now);
  const first = new Date(year, month, 1, 12);
  const lead = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = -lead; cells.length % 7 !== 0 || i < days; i++) {
    const d = new Date(year, month, 1 + i, 12);
    const date = dateKey(d);
    cells.push({ date, day: d.getDate(), inMonth: d.getMonth() === month, count: counts[date] || 0, today: date === today });
  }
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
};

/** Move a (year, month) pair by n months. */
export const shiftMonth = ({ year, month }, n) => {
  const d = new Date(year, month + n, 1, 12);
  return { year: d.getFullYear(), month: d.getMonth() };
};
