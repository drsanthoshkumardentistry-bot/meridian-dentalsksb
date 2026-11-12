/* ==============================================================================
 * MERIDENT OS - DASHBOARD "TODAY" PIECES (pure functions)
 * The action tiles (what the front desk should send or chase today) and the live waiting-room strip.
 * ============================================================================== */

import { Q_STATUS, waitMinutes } from "./queue.js";

/** One tile per kind of job. Tiles with nothing to do stay quiet but visible, so the screen never jumps around. */
export const todayActionTiles = ({ reminders = 0, recalls = 0, payments = 0, nextVisits = 0, plans = 0, bookings = 0, feedback = 0 } = {}) => [
  { id: "bookings", label: "Online booking requests", count: bookings, to: "Appointments Diary", tone: "rose", cta: "Tap to answer" },
  { id: "reminders", label: "Appointment reminders", count: reminders, to: "Appointments Diary", tone: "blue", cta: "Tap to send" },
  { id: "nextVisits", label: "Next visits due", count: nextVisits, to: "Appointments Diary", tone: "aqua", cta: "Tap to remind" },
  { id: "recalls", label: "Patients due for recall", count: recalls, to: "Appointments Diary", tone: "aqua", cta: "Tap to send" },
  { id: "plans", label: "Treatment plans to follow up", count: plans, to: "Appointments Diary", tone: "gold", cta: "Tap to send" },
  { id: "payments", label: "Payments to chase", count: payments, to: "Billing & Invoices", tone: "gold", cta: "Tap to send" },
  { id: "feedback", label: "Feedback to ask for", count: feedback, to: "Appointments Diary", tone: "blue", cta: "Tap to send" },
];

export const totalActions = (tiles) => tiles.reduce((s, t) => s + t.count, 0);

/** Waiting room right now: who is in the chair, who has waited longest, who is next. Null when nobody came in today. */
export const liveFlow = (queue = [], ymd, now = new Date()) => {
  const today = queue.filter((e) => e.date === ymd);
  if (today.length === 0) return null;
  const waiting = today.filter((e) => e.status === Q_STATUS.WAITING);
  const rank = (e) => (e.priority === "Urgent" ? 0 : 1);
  const next = [...waiting].sort((a, b) => rank(a) - rank(b) || a.token - b.token)[0] || null;
  const longest = waiting.reduce((best, e) => (!best || waitMinutes(e, now) > waitMinutes(best, now) ? e : best), null);
  return {
    waiting: waiting.length,
    urgent: waiting.filter((e) => e.priority === "Urgent").length,
    inChair: today.filter((e) => e.status === Q_STATUS.IN_CHAIR).length,
    seen: today.filter((e) => e.status === Q_STATUS.DONE).length,
    next,
    longest: longest ? { name: longest.name, minutes: waitMinutes(longest, now) } : null,
  };
};
