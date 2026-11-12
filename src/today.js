// What the front desk needs to see right now. Pure: the app passes in its records.
import { balancePaise, normalizeInvoice } from "./billing.js";
import { followUpDue, membershipStatus, daysLeft } from "./growth.js";
import { dateKey } from "./reminders.js";

const DONE = new Set(["cancelled", "canceled", "completed", "no show", "no-show"]);

export const todaySummary = ({ appointments = [], invoices = [], leads = [], memberships = [], today = dateKey() } = {}) => {
  const appts = appointments
    .filter((a) => a && a.date === today)
    .sort((a, b) => String(a.time || "").localeCompare(String(b.time || "")));
  const upcoming = appts.filter((a) => !DONE.has(String(a.status || "").toLowerCase()));
  const dues = invoices
    .map(normalizeInvoice)
    .filter((i) => i && balancePaise(i) > 0)
    .map((i) => ({ inv: i, balanceP: balancePaise(i), overdue: Boolean(i.dueDate) && String(i.dueDate) < today }));
  const expiring = memberships
    .filter((m) => membershipStatus(m, today) === "expiring")
    .sort((a, b) => (a.endOn < b.endOn ? -1 : 1))
    .map((m) => ({ m, daysLeft: daysLeft(m, today) }));
  return {
    appts, upcomingCount: upcoming.length, doneCount: appts.length - upcoming.length,
    unpaidCount: dues.length, unpaidP: dues.reduce((s, d) => s + d.balanceP, 0), overdue: dues.filter((d) => d.overdue).sort((a, b) => b.balanceP - a.balanceP),
    leadsDue: leads.filter((l) => followUpDue(l, today)),
    expiring,
  };
};
