import { parseAnyDate } from "./reminders.js";

const DAY = 24 * 60 * 60 * 1000;
export const LICENSE_WARN_DAYS = 60;
export const LEAVE_TYPES = ["Sick leave", "Vacation", "Personal leave"];
export const LEAVE_STATUSES = ["Pending", "Approved", "Rejected"];

const at = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12).getTime();
const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Days until the licence runs out (negative once expired); null when no usable date. */
export const licenseDays = (expiry, now = new Date()) => {
  const d = parseAnyDate(expiry);
  return d ? Math.round((at(d) - at(now)) / DAY) : null;
};

/** Inclusive number of days from start to end. */
export const leaveDays = (leave) => {
  const s = parseAnyDate(leave?.startDate);
  const e = parseAnyDate(leave?.endDate);
  return s && e ? Math.round((at(e) - at(s)) / DAY) + 1 : 0;
};

/** Returns { ok, leave } or { ok: false, error }. Overlap with an approved or pending leave is refused. */
export const buildLeave = (form, existing = [], id, now = new Date()) => {
  const s = parseAnyDate(form.startDate);
  const e = parseAnyDate(form.endDate || form.startDate);
  if (!s) return { ok: false, error: "Choose the first day of leave" };
  if (!e) return { ok: false, error: "Choose the last day of leave" };
  if (e < s) return { ok: false, error: "The last day cannot be before the first day" };
  const leave = {
    id,
    type: LEAVE_TYPES.includes(form.leaveType) ? form.leaveType : LEAVE_TYPES[0],
    startDate: key(s),
    endDate: key(e),
    reason: String(form.reason || "").trim(),
    status: "Pending",
    requestedAt: now.toISOString()
  };
  const clash = existing.find((x) => x.status !== "Rejected" && !(parseAnyDate(x.endDate) < s || parseAnyDate(x.startDate) > e));
  if (clash) return { ok: false, error: `Overlaps leave already booked from ${clash.startDate} to ${clash.endDate}` };
  return { ok: true, leave };
};

export const setLeaveStatus = (employee, leaveId, status) =>
  LEAVE_STATUSES.includes(status)
    ? { ...employee, leaves: (employee.leaves || []).map((l) => (l.id === leaveId ? { ...l, status, decidedAt: new Date().toISOString() } : l)) }
    : employee;

export const removeLeave = (employee, leaveId) => ({ ...employee, leaves: (employee.leaves || []).filter((l) => l.id !== leaveId) });

/** Staff on approved leave on the given day. */
export const onLeaveOn = (employees = [], now = new Date()) => {
  const t = at(now);
  return employees.filter((emp) =>
    (emp.leaves || []).some((l) => l.status === "Approved" && at(parseAnyDate(l.startDate) || new Date(0)) <= t && t <= at(parseAnyDate(l.endDate) || new Date(0)))
  );
};

/** Returns { ok, review } or { ok: false, error }. */
export const buildReview = ({ rating, notes, reviewer, date }, id) => {
  const r = Math.round(Number(rating));
  if (!(r >= 1 && r <= 5)) return { ok: false, error: "Choose a rating from 1 to 5" };
  return { ok: true, review: { id, rating: r, notes: String(notes || "").trim(), reviewer: String(reviewer || "").trim(), date } };
};

export const averageRating = (employee) => {
  const rs = (employee.reviews || []).map((r) => r.rating).filter(Number.isFinite);
  return rs.length ? Math.round((rs.reduce((a, b) => a + b, 0) / rs.length) * 10) / 10 : null;
};

/** Real alerts from the saved data: licences expired or due soon, and leave waiting for a decision. */
export const staffAlerts = (employees = [], now = new Date()) => {
  const out = [];
  for (const emp of employees) {
    if (emp.active === false) continue;
    const d = licenseDays(emp.licenseExpiry, now);
    if (d !== null && d < 0) out.push({ kind: "license", level: "danger", empId: emp.id, text: `${emp.name}'s licence expired ${Math.abs(d)} ${Math.abs(d) === 1 ? "day" : "days"} ago` });
    else if (d !== null && d <= LICENSE_WARN_DAYS) out.push({ kind: "license", level: "warn", empId: emp.id, text: `${emp.name}'s licence expires in ${d} ${d === 1 ? "day" : "days"}` });
    const pending = (emp.leaves || []).filter((l) => l.status === "Pending").length;
    if (pending) out.push({ kind: "leave", level: "warn", empId: emp.id, text: `${emp.name} has ${pending} leave ${pending === 1 ? "request" : "requests"} waiting for a decision` });
  }
  return out.sort((a, b) => (a.level === b.level ? 0 : a.level === "danger" ? -1 : 1));
};
