/* ==============================================================================
 * MERIDENT OS - REPORTS (pure functions, no React)
 * Daily collections come from PAYMENTS (when money was received).
 * GST figures come from INVOICES (GST is due on the invoice date, not the payment date).
 * ============================================================================== */

import { normalizeInvoice, balancePaise, formatINR, invoiceLines } from "./billing";
import { parseAnyDate, dateKey } from "./reminders";

export const MODE_KEYS = ["Cash", "UPI", "Card", "Net banking", "Insurance / TPA"];

const pad = (n) => String(n).padStart(2, "0");

export const currentMonthKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

const inMonth = (date, ym) => Boolean(date) && `${date.getFullYear()}-${pad(date.getMonth() + 1)}` === ym;

const modeKey = (mode) => (MODE_KEYS.includes(mode) ? mode : "Other");

const emptyModes = () => ({ Cash: 0, UPI: 0, Card: 0, "Net banking": 0, "Insurance / TPA": 0, Other: 0 });

/** Money received per day in the month, split by payment mode. All amounts in paise. */
export const collectionsForMonth = (invoices = [], ym = currentMonthKey()) => {
  const byDay = new Map();
  const totals = { byMode: emptyModes(), totalP: 0, payments: 0 };
  for (const raw of invoices) {
    const inv = normalizeInvoice(raw);
    for (const p of inv.payments || []) {
      const d = parseAnyDate(p.date);
      if (!inMonth(d, ym)) continue;
      const key = dateKey(d);
      if (!byDay.has(key)) byDay.set(key, { date: key, byMode: emptyModes(), totalP: 0, count: 0 });
      const row = byDay.get(key);
      const m = modeKey(p.mode);
      row.byMode[m] += p.amountP || 0;
      row.totalP += p.amountP || 0;
      row.count += 1;
      totals.byMode[m] += p.amountP || 0;
      totals.totalP += p.amountP || 0;
      totals.payments += 1;
    }
  }
  const days = [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
  return { days, totals };
};

/** GST summary for invoices raised in the month. */
export const gstSummaryForMonth = (invoices = [], ym = currentMonthKey()) => {
  const rows = [];
  const sum = { invoices: 0, subtotalP: 0, discountP: 0, taxableP: 0, exemptP: 0, taxableAt18P: 0, cgstP: 0, sgstP: 0, taxP: 0, totalP: 0 };
  for (const raw of invoices) {
    const inv = normalizeInvoice(raw);
    const d = parseAnyDate(inv.date);
    if (!inMonth(d, ym)) continue;
    const lines = invoiceLines(inv);
    const taxableLines = lines.filter((l) => l.gstRate > 0);
    const category =
      taxableLines.length === 0 ? "Exempt" : taxableLines.length === lines.length ? `Taxable ${inv.gstRate}%` : "Mixed";
    rows.push({
      date: dateKey(d),
      id: inv.id,
      patient: inv.patient,
      treatment: inv.treatment || "",
      category,
      taxableP: inv.taxableP || 0,
      cgstP: inv.cgstP || 0,
      sgstP: inv.sgstP || 0,
      totalP: inv.totalP || 0,
    });
    sum.invoices += 1;
    sum.subtotalP += inv.subtotalP || 0;
    sum.discountP += inv.discountP || 0;
    sum.taxableP += inv.taxableP || 0;
    for (const l of lines) {
      if (l.gstRate > 0) sum.taxableAt18P += l.taxableP || 0;
      else sum.exemptP += l.taxableP || 0;
    }
    sum.cgstP += inv.cgstP || 0;
    sum.sgstP += inv.sgstP || 0;
    sum.taxP += inv.taxP || 0;
    sum.totalP += inv.totalP || 0;
  }
  rows.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  return { rows, sum };
};

export const outstandingTotalP = (invoices = []) => invoices.reduce((s, i) => s + balancePaise(normalizeInvoice(i)), 0);

/* ------------------------------- CSV export ------------------------------- */

/** Escapes a cell and blocks spreadsheet formula injection (a patient named "=HYPERLINK(...)"). */
export const csvCell = (value) => {
  let s = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const toCsv = (rows) => rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";

const rupees = (p) => (p / 100).toFixed(2);

export const collectionsCsv = (invoices, ym) => {
  const { days, totals } = collectionsForMonth(invoices, ym);
  const head = ["Date", ...MODE_KEYS, "Other", "Total (INR)", "Payments"];
  const body = days.map((d) => [d.date, ...MODE_KEYS.map((m) => rupees(d.byMode[m])), rupees(d.byMode.Other), rupees(d.totalP), d.count]);
  const foot = ["TOTAL", ...MODE_KEYS.map((m) => rupees(totals.byMode[m])), rupees(totals.byMode.Other), rupees(totals.totalP), totals.payments];
  return toCsv([head, ...body, foot]);
};

export const gstRegisterCsv = (invoices, ym) => {
  const { rows, sum } = gstSummaryForMonth(invoices, ym);
  const head = ["Invoice date", "Invoice no.", "Patient", "Treatment", "GST category", "Taxable value (INR)", "CGST (INR)", "SGST (INR)", "Invoice total (INR)"];
  const body = rows.map((r) => [r.date, r.id, r.patient, r.treatment, r.category, rupees(r.taxableP), rupees(r.cgstP), rupees(r.sgstP), rupees(r.totalP)]);
  const foot = ["TOTAL", "", "", "", "", rupees(sum.taxableP), rupees(sum.cgstP), rupees(sum.sgstP), rupees(sum.totalP)];
  return toCsv([head, ...body, foot]);
};

/* ------------------------------ Printable report ------------------------------ */

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const monthLabel = (ym) => {
  const [y, m] = String(ym).split("-").map(Number);
  return new Date(y, (m || 1) - 1, 1, 12).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
};

export const buildReportHtml = (invoices, ym, profile = {}) => {
  const c = collectionsForMonth(invoices, ym);
  const g = gstSummaryForMonth(invoices, ym);
  const modeCols = MODE_KEYS.filter((m) => c.totals.byMode[m] > 0);
  const dayRows = c.days
    .map((d) => `<tr><td>${esc(d.date)}</td>${modeCols.map((m) => `<td class="r">${formatINR(d.byMode[m])}</td>`).join("")}<td class="r"><b>${formatINR(d.totalP)}</b></td></tr>`)
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>Report ${esc(monthLabel(ym))}</title>
<style>body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;margin:28px;font-size:12px}h1{font-size:18px;color:#1d4ed8;margin:0}
h2{font-size:14px;margin:22px 0 6px}.muted{color:#64748b}table{width:100%;border-collapse:collapse}td,th{padding:5px 6px;border-bottom:1px solid #e2e8f0;text-align:left}
th{background:#f1f5f9;font-size:11px}.r{text-align:right}@media print{body{margin:10mm}}</style></head><body>
<h1>${esc(profile.name || "Dental Clinic")}</h1><div class="muted">Collections and GST report · ${esc(monthLabel(ym))}</div>
${profile.gstin ? `<div class="muted">GSTIN: ${esc(profile.gstin)}</div>` : ""}
<h2>Money received</h2>
<table><tr><th>Date</th>${modeCols.map((m) => `<th class="r">${esc(m)}</th>`).join("")}<th class="r">Total</th></tr>
${dayRows || `<tr><td class="muted" colspan="${modeCols.length + 2}">No payments this month</td></tr>`}
<tr><td><b>Total</b></td>${modeCols.map((m) => `<td class="r"><b>${formatINR(c.totals.byMode[m])}</b></td>`).join("")}<td class="r"><b>₹${formatINR(c.totals.totalP)}</b></td></tr></table>
<h2>GST summary (invoices raised this month)</h2>
<table>
<tr><td>Invoices</td><td class="r">${g.sum.invoices}</td></tr>
<tr><td>Exempt services (therapeutic)</td><td class="r">₹${formatINR(g.sum.exemptP)}</td></tr>
<tr><td>Taxable services (cosmetic, 18%)</td><td class="r">₹${formatINR(g.sum.taxableAt18P)}</td></tr>
<tr><td>CGST collected</td><td class="r">₹${formatINR(g.sum.cgstP)}</td></tr>
<tr><td>SGST collected</td><td class="r">₹${formatINR(g.sum.sgstP)}</td></tr>
<tr><td><b>Total GST payable</b></td><td class="r"><b>₹${formatINR(g.sum.taxP)}</b></td></tr></table>
<p class="muted" style="margin-top:20px">Prepared from MeriDent records for your accountant. Please verify before filing.</p>
<script>window.onload=function(){window.print()}</script></body></html>`;
};
