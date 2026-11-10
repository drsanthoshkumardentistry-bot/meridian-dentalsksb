import { dateKey } from "./reminders.js";

export const DAY_START_HOUR = 8;
export const DAY_END_HOUR = 20;
export const SLOT_PX = 30; // height of a 30-minute slot

const mins = (hhmm) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || ""));
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

/** Move a yyyy-mm-dd date by whole days. */
export const shiftDay = (ymd, n) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd || "");
  const base = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12) : new Date();
  return dateKey(new Date(base.getFullYear(), base.getMonth(), base.getDate() + n, 12));
};

/** Hour labels down the left edge. */
export const hourMarks = () =>
  Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => ({ hour: DAY_START_HOUR + i, top: i * 2 * SLOT_PX }));

/**
 * Appointments for one day laid out per chair. Visits outside opening hours are returned in
 * `offHours` so nothing silently disappears. Cancelled visits are left out of the grid.
 */
export const dayGrid = (appointments = [], ymd, chairs = []) => {
  const names = [...new Set([...chairs, ...appointments.filter((a) => a.date === ymd).map((a) => a.chair).filter(Boolean)])];
  const columns = names.map((chair) => ({ chair, items: [] }));
  const offHours = [];
  const dayAppts = appointments
    .filter((a) => a.date === ymd && !["cancelled", "canceled"].includes(String(a.status || "").toLowerCase()))
    .sort((a, b) => String(a.time).localeCompare(String(b.time)));
  for (const a of dayAppts) {
    const t = mins(a.time);
    if (t === null || t < DAY_START_HOUR * 60 || t >= DAY_END_HOUR * 60) {
      offHours.push(a);
      continue;
    }
    const col = columns.find((c) => c.chair === a.chair) || columns[0];
    if (col) col.items.push({ appt: a, top: ((t - DAY_START_HOUR * 60) / 30) * SLOT_PX, height: SLOT_PX });
  }
  return { columns, offHours, heightPx: (DAY_END_HOUR - DAY_START_HOUR) * 2 * SLOT_PX, total: dayAppts.length };
};
