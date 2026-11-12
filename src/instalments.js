// Pay a bill in instalments. The schedule sits on the invoice; payments are the normal payments on that invoice.
import { dateKey } from "./reminders.js";
import { addMonthsISO } from "./growth.js";

export const MAX_INSTALMENTS = 24;

/** Equal instalments of what is left after the down payment. The last one absorbs the rounding. */
export const buildSchedule = ({ totalP, count, firstDueOn, downP = 0, everyMonths = 1 } = {}) => {
  const n = Math.round(Number(count));
  if (!Number.isFinite(n) || n < 2 || n > MAX_INSTALMENTS) return { ok: false, error: `Choose 2 to ${MAX_INSTALMENTS} instalments.` };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(firstDueOn || "")) return { ok: false, error: "Choose the first due date." };
  const rest = (totalP || 0) - Math.max(0, downP || 0);
  if (rest <= 0) return { ok: false, error: "The down payment already covers the bill." };
  const base = Math.floor(rest / n);
  const items = Array.from({ length: n }, (_, i) => ({
    no: i + 1,
    dueOn: addMonthsISO(firstDueOn, i * Math.max(1, Math.round(everyMonths))),
    amountP: i === n - 1 ? rest - base * (n - 1) : base,
  }));
  return { ok: true, schedule: items };
};

/** Shares what has been paid over the schedule in order (after the down payment, which the app records as a payment). */
export const scheduleStatus = (schedule = [], paidAfterDownP = 0, today = dateKey()) => {
  let left = Math.max(0, paidAfterDownP);
  return schedule.map((s) => {
    const paid = Math.min(s.amountP, left);
    left -= paid;
    const status = paid >= s.amountP ? "paid" : paid > 0 ? (s.dueOn < today ? "overdue" : "part") : s.dueOn < today ? "overdue" : "due";
    return { ...s, paidP: paid, status };
  });
};

export const nextDue = (rows) => rows.find((r) => r.status !== "paid") || null;

/** Attaches the plan to an invoice and points its due date at the next unpaid instalment, so overdue and reminders just work. */
export const withInstalments = (inv, schedule, downP = 0, today = dateKey()) => {
  const rows = scheduleStatus(schedule, 0, today);
  return { ...inv, instalments: { schedule, downP: Math.max(0, downP || 0) }, dueDate: rows[0] ? rows[0].dueOn : inv.dueDate };
};

export const instalmentView = (inv, today = dateKey()) => {
  if (!inv || !inv.instalments || !inv.instalments.schedule) return null;
  const paid = (inv.payments || []).reduce((s, p) => s + (p.amountP || 0), 0);
  const rows = scheduleStatus(inv.instalments.schedule, paid - (inv.instalments.downP || 0), today);
  return { rows, next: nextDue(rows), overdue: rows.filter((r) => r.status === "overdue").length };
};

/** When an instalment is paid, move the invoice's due date to the next unpaid one. */
export const syncDueDate = (inv, today = dateKey()) => {
  const v = instalmentView(inv, today);
  if (!v) return inv;
  return { ...inv, dueDate: v.next ? v.next.dueOn : inv.dueDate };
};
