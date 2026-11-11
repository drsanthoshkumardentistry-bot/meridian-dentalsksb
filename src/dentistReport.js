/* ==============================================================================
 * MERIDENT OS - DENTIST EARNINGS (pure functions, no React)
 * One month, per dentist: money received on the invoices they treated, work billed,
 * completed visits, and an optional commission. Amounts are in paise.
 * ============================================================================== */

import { normalizeInvoice } from "./billing.js";
import { parseAnyDate } from "./reminders.js";
import { currentMonthKey, toCsv } from "./reports.js";

export const UNASSIGNED = "Not assigned";
const pad = (n) => String(n).padStart(2, "0");
const ymOf = (d) => (d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}` : "");
const nameOf = (v) => String(v || "").trim() || UNASSIGNED;
const key = (v) => nameOf(v).toLowerCase();

/** A commission percentage as a number from 0 to 100, or 0 when blank or invalid. */
export const cleanPct = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n * 100) / 100)) : 0;
};

export const dentistEarnings = (invoices = [], appointments = [], ym = currentMonthKey(), commissions = {}) => {
  const rows = new Map();
  const row = (name) => {
    const k = key(name);
    if (!rows.has(k)) rows.set(k, { name: nameOf(name), collectedP: 0, billedP: 0, invoices: 0, completedVisits: 0 });
    return rows.get(k);
  };
  const pct = new Map(Object.entries(commissions || {}).map(([n, v]) => [n.trim().toLowerCase(), cleanPct(v)]));

  for (const raw of invoices) {
    const inv = normalizeInvoice(raw);
    const r = row(raw.doctor);
    r.collectedP += (inv.payments || []).filter((p) => ymOf(parseAnyDate(p.date)) === ym).reduce((s, p) => s + (p.amountP || 0), 0);
    if (ymOf(parseAnyDate(inv.date)) === ym) { r.billedP += inv.totalP || 0; r.invoices += 1; }
  }
  for (const a of appointments) {
    if (String(a.status || "").trim().toLowerCase() === "completed" && ymOf(parseAnyDate(a.date)) === ym) row(a.doctor).completedVisits += 1;
  }

  const list = [...rows.values()]
    .filter((r) => r.collectedP || r.billedP || r.completedVisits)
    .map((r) => {
      const p = pct.get(r.name.toLowerCase()) || 0;
      return { ...r, commissionPct: p, commissionP: Math.round((r.collectedP * p) / 100) };
    })
    .sort((a, b) => b.collectedP - a.collectedP || a.name.localeCompare(b.name));
  const sum = (k2) => list.reduce((s, r) => s + r[k2], 0);
  return { rows: list, total: { collectedP: sum("collectedP"), billedP: sum("billedP"), invoices: sum("invoices"), completedVisits: sum("completedVisits"), commissionP: sum("commissionP") } };
};

const rupees = (p) => (p / 100).toFixed(2);

export const dentistEarningsCsv = (report, ym) =>
  toCsv([
    ["Month", "Dentist", "Received (INR)", "Billed (INR)", "Invoices", "Completed visits", "Commission %", "Commission (INR)"],
    ...report.rows.map((r) => [ym, r.name, rupees(r.collectedP), rupees(r.billedP), r.invoices, r.completedVisits, r.commissionPct, rupees(r.commissionP)]),
    [ym, "Total", rupees(report.total.collectedP), rupees(report.total.billedP), report.total.invoices, report.total.completedVisits, "", rupees(report.total.commissionP)],
  ]);
