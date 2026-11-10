import { balancePaise, formatINR, normalizeInvoice, paidPaise, paymentStatus } from "./billing.js";
import { parseAnyDate } from "./reminders.js";
import { filterInvoices, invoiceAgeDays } from "./receivables.js";
import { toCsv } from "./reports.js";

const DAY = 24 * 60 * 60 * 1000;
const at = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12).getTime();
const ymOf = (d) => (d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` : "");

/** yyyy-mm-dd for a date input, `days` after today. */
export const dueDateIn = (days, now = new Date()) => {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days, 12);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Days past the due date (positive), or 0. Null when there is no usable due date. */
export const daysOverdue = (inv, now = new Date()) => {
  const due = parseAnyDate(inv?.dueDate);
  if (!due) return null;
  return Math.max(0, Math.round((at(now) - due.getTime()) / DAY));
};

/** Unpaid and past its due date. Invoices without a due date are never "overdue". */
export const isOverdue = (inv, now = new Date()) => {
  const n = normalizeInvoice(inv);
  return balancePaise(n) > 0 && (daysOverdue(n, now) || 0) > 0;
};

/** Billed, collected (by payment date) and outstanding, with this month's figures separated out. */
export const billingSummary = (invoices = [], now = new Date()) => {
  const ym = ymOf(now);
  let billedP = 0;
  let collectedP = 0;
  let outstandingP = 0;
  let overdueP = 0;
  let overdueCount = 0;
  for (const raw of invoices) {
    const inv = normalizeInvoice(raw);
    if (!inv) continue;
    if (ymOf(parseAnyDate(inv.date)) === ym) billedP += inv.totalP || 0;
    for (const p of inv.payments || []) if (ymOf(parseAnyDate(p.date)) === ym) collectedP += p.amountP || 0;
    const bal = balancePaise(inv);
    outstandingP += bal;
    if (isOverdue(inv, now)) {
      overdueP += bal;
      overdueCount += 1;
    }
  }
  return { billedP, collectedP, outstandingP, overdueP, overdueCount };
};

/** Case-insensitive match on invoice number, patient, treatment and payment mode. */
export const searchInvoices = (invoices = [], query = "") => {
  const q = String(query).trim().toLowerCase();
  if (!q) return invoices;
  return invoices.filter((i) =>
    [i.id, i.patient, i.treatment, i.paymentMode].some((f) => String(f || "").toLowerCase().includes(q))
  );
};

/** status: all | unpaid | part | paid | overdue | an ageing bucket id. */
export const invoiceView = (invoices = [], { status = "all", query = "" } = {}, now = new Date()) => {
  const found = searchInvoices(invoices, query);
  if (status === "all") return found;
  if (status === "paid") return found.filter((i) => paymentStatus(normalizeInvoice(i)) === "Paid");
  if (status === "part") return found.filter((i) => paymentStatus(normalizeInvoice(i)) === "Part paid");
  if (status === "overdue")
    return found.filter((i) => isOverdue(i, now)).sort((a, b) => (daysOverdue(normalizeInvoice(b), now) || 0) - (daysOverdue(normalizeInvoice(a), now) || 0));
  return filterInvoices(found, status, now);
};

/** One row per invoice for the clinic's own records or accountant. */
export const invoicesCsv = (invoices = [], now = new Date()) => {
  const rows = [["Invoice", "Date", "Due date", "Patient", "Treatment", "Payment mode", "Total (INR)", "Paid (INR)", "Balance (INR)", "Status", "Days old"]];
  for (const raw of invoices) {
    const inv = normalizeInvoice(raw);
    rows.push([
      inv.id,
      inv.date || "",
      inv.dueDate || "",
      inv.patient || "",
      inv.treatment || "",
      inv.paymentMode || "",
      formatINR(inv.totalP || 0).replace(/,/g, ""),
      formatINR(paidPaise(inv)).replace(/,/g, ""),
      formatINR(balancePaise(inv)).replace(/,/g, ""),
      isOverdue(inv, now) ? "Overdue" : paymentStatus(inv),
      balancePaise(inv) > 0 ? invoiceAgeDays(inv, now) ?? "" : ""
    ]);
  }
  return toCsv(rows);
};

/** WhatsApp text that sends the invoice itself (the reminder text is for unpaid balances). */
export const buildInvoiceMessage = ({ clinicName, inv, upiId }) => {
  const n = normalizeInvoice(inv);
  const bal = balancePaise(n);
  const due = parseAnyDate(n.dueDate);
  return (
    `Hello ${n.patient},\n\n` +
    `Your invoice ${n.id} from ${clinicName || "your dental clinic"}${n.treatment ? ` for ${n.treatment}` : ""}:\n` +
    `Total: ₹${formatINR(n.totalP)}\n` +
    (paidPaise(n) > 0 ? `Paid: ₹${formatINR(paidPaise(n))}\n` : "") +
    (bal > 0 ? `Balance: ₹${formatINR(bal)}${due ? ` (due ${due.toLocaleDateString("en-IN")})` : ""}\n` : "Fully paid. Thank you.\n") +
    (bal > 0 && upiId ? `\nYou can pay by UPI to ${upiId}.\n` : "") +
    `\nThank you.`
  );
};
