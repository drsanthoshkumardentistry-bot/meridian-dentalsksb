import { dateKey } from "./reminders.js";

export const APPT_STATUSES = ["Confirmed", "Completed", "No show", "Cancelled"];
/** Without a duration field, two bookings on one chair closer than this clash. */
export const SLOT_MINUTES = 30;

const norm = (s) => String(s || "").toLowerCase();
const isActive = (a) => !["cancelled", "canceled", "completed", "no show", "no-show"].includes(norm(a?.status));
const minutes = (hhmm) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || ""));
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};
const stamp = (a) => `${a.date || ""} ${String(a.time || "").padStart(5, "0")}`;
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12);

/** An active booking on the same chair, or with the same doctor, within one slot of the candidate. */
export const findClash = (appointments = [], candidate) => {
  const t = minutes(candidate.time);
  if (t === null) return null;
  for (const a of appointments) {
    if (!isActive(a) || a.date !== candidate.date) continue;
    const at = minutes(a.time);
    if (at === null || Math.abs(at - t) >= SLOT_MINUTES) continue;
    if (a.chair === candidate.chair) return { appt: a, reason: "chair" };
    if (candidate.doctor && norm(a.doctor).trim() === norm(candidate.doctor).trim()) return { appt: a, reason: "doctor" };
  }
  return null;
};

/** Booked visits whose day has passed but were never marked Completed, No show or Cancelled. */
export const needsUpdate = (a, now = new Date()) => isActive(a) && Boolean(a.date) && a.date < dateKey(now);

export const diarySummary = (appointments = [], now = new Date()) => {
  const today = dateKey(now);
  const tomorrow = dateKey(addDays(now, 1));
  const s = { today: 0, tomorrow: 0, upcoming: 0, needsUpdate: 0 };
  for (const a of appointments) {
    if (needsUpdate(a, now)) s.needsUpdate += 1;
    if (!isActive(a)) continue;
    if (a.date === today) s.today += 1;
    else if (a.date === tomorrow) s.tomorrow += 1;
    if (a.date > today) s.upcoming += 1;
  }
  return s;
};

/** view: today | upcoming | past | update | all. Today and upcoming run soonest first, the rest newest first. */
export const diaryView = (appointments = [], { view = "upcoming", query = "" } = {}, now = new Date()) => {
  const today = dateKey(now);
  const q = norm(query).trim();
  const found = q ? appointments.filter((a) => [a.patientName, a.phone, a.procedure, a.doctor].some((f) => norm(f).includes(q))) : appointments;
  const asc = (a, b) => stamp(a).localeCompare(stamp(b));
  const desc = (a, b) => stamp(b).localeCompare(stamp(a));
  if (view === "today") return found.filter((a) => a.date === today).sort(asc);
  if (view === "upcoming") return found.filter((a) => a.date >= today && isActive(a)).sort(asc);
  if (view === "past") return found.filter((a) => a.date < today || !isActive(a)).sort(desc);
  if (view === "update") return found.filter((a) => needsUpdate(a, now)).sort(desc);
  return [...found].sort(desc);
};

export const withStatus = (appt, status) => (APPT_STATUSES.includes(status) ? { ...appt, status } : appt);
