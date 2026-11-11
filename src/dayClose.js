/* ==============================================================================
 * MERIDENT OS - DAY-END SUMMARY (pure functions, no React)
 * What came in and what happened today, for the person closing the front desk.
 * Amounts are in paise. "Today" is the clinic's own calendar day.
 * ============================================================================== */

import { normalizeInvoice, balancePaise, formatINR, toPaise } from "./billing.js";
import { parseAnyDate, dateKey, formatDateLong } from "./reminders.js";
import { MODE_KEYS } from "./reports.js";

const sameDay = (value, key) => {
  const d = parseAnyDate(value);
  return Boolean(d) && dateKey(d) === key;
};
const status = (a) => String(a.status || "").trim().toLowerCase();

export const dayClose = ({ invoices = [], appointments = [], patients = [] } = {}, now = new Date()) => {
  const day = dateKey(now);
  const byMode = Object.fromEntries([...MODE_KEYS, "Other"].map((m) => [m, 0]));
  let receivedP = 0, payments = 0, billedP = 0, raised = 0;
  for (const raw of invoices) {
    const inv = normalizeInvoice(raw);
    for (const p of inv.payments || []) {
      if (!sameDay(p.date, day)) continue;
      byMode[MODE_KEYS.includes(p.mode) ? p.mode : "Other"] += p.amountP || 0;
      receivedP += p.amountP || 0;
      payments += 1;
    }
    if (sameDay(inv.date, day)) { billedP += inv.totalP || 0; raised += 1; }
  }
  const today = appointments.filter((a) => a.date === day);
  return {
    day,
    receivedP, payments, byMode, billedP, invoices: raised,
    completed: today.filter((a) => status(a) === "completed").length,
    noShows: today.filter((a) => /^no[ -]?show$/.test(status(a))).length,
    cancelled: today.filter((a) => /^cancel/.test(status(a))).length,
    stillWaiting: today.filter((a) => !["completed", "cancelled", "canceled", "no show", "no-show"].includes(status(a))).length,
    newPatients: patients.filter((p) => sameDay(p.registeredDate, day)).length,
    outstandingP: invoices.reduce((s, i) => s + balancePaise(normalizeInvoice(i)), 0),
  };
};

/** Cash in the drawer against what the invoices say. `counted` is rupees as typed; blank means not counted. */
export const cashCheck = (summary, counted) => {
  if (counted === "" || counted === null || counted === undefined) return null;
  const n = Number(counted);
  if (!Number.isFinite(n) || n < 0) return null;
  const diffP = toPaise(n) - summary.byMode.Cash;
  return { expectedP: summary.byMode.Cash, countedP: toPaise(n), diffP, balanced: diffP === 0 };
};

const money = (p) => `₹${formatINR(p)}`;

export const buildDaySummaryMessage = ({ clinicName, summary, cash }) => {
  const modes = MODE_KEYS.concat("Other").filter((m) => summary.byMode[m] > 0).map((m) => `${m} ${money(summary.byMode[m])}`);
  return [
    `${clinicName || "Clinic"}: day summary, ${formatDateLong(summary.day)}`,
    "",
    `Received: ${money(summary.receivedP)}${modes.length ? ` (${modes.join(", ")})` : ""}`,
    `Billed today: ${money(summary.billedP)} on ${summary.invoices} ${summary.invoices === 1 ? "invoice" : "invoices"}`,
    `Visits: ${summary.completed} done, ${summary.noShows} no-show, ${summary.cancelled} cancelled${summary.stillWaiting ? `, ${summary.stillWaiting} not closed` : ""}`,
    `New patients: ${summary.newPatients}`,
    `Outstanding in total: ${money(summary.outstandingP)}`,
    ...(cash ? [`Cash: expected ${money(cash.expectedP)}, counted ${money(cash.countedP)}${cash.balanced ? ", matches" : cash.diffP > 0 ? `, ${money(cash.diffP)} extra` : `, ${money(-cash.diffP)} short`}`] : []),
  ].join("\n");
};
