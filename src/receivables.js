import { balancePaise, normalizeInvoice } from "./billing.js";
import { parseAnyDate } from "./reminders.js";

export const AGING_BUCKETS = [
  { id: "0-7", label: "Up to 7 days", min: 0, max: 7 },
  { id: "8-30", label: "8 to 30 days", min: 8, max: 30 },
  { id: "31-60", label: "31 to 60 days", min: 31, max: 60 },
  { id: "60+", label: "Over 60 days", min: 61, max: Infinity }
];

const DAY = 24 * 60 * 60 * 1000;

/** Whole days since the invoice date; null when the date can't be read. Never negative. */
export const invoiceAgeDays = (inv, now = new Date()) => {
  const d = parseAnyDate(inv?.date);
  if (!d) return null;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12).getTime();
  return Math.max(0, Math.round((start - d.getTime()) / DAY));
};

export const bucketFor = (days) => {
  if (days === null) return AGING_BUCKETS[0];
  return AGING_BUCKETS.find((b) => days >= b.min && days <= b.max) || AGING_BUCKETS[AGING_BUCKETS.length - 1];
};

/** Unpaid balance grouped by age. Invoices with an unreadable date count as the newest bucket. */
export const agingSummary = (invoices = [], now = new Date()) => {
  const buckets = AGING_BUCKETS.map((b) => ({ ...b, count: 0, totalP: 0 }));
  let totalP = 0;
  let count = 0;
  for (const raw of invoices) {
    const inv = normalizeInvoice(raw);
    const bal = balancePaise(inv);
    if (!inv || bal <= 0) continue;
    const b = buckets.find((x) => x.id === bucketFor(invoiceAgeDays(inv, now)).id);
    b.count += 1;
    b.totalP += bal;
    totalP += bal;
    count += 1;
  }
  return { buckets, totalP, count };
};

/** filter: "all", "unpaid", or a bucket id. Unpaid and bucket views list oldest first. */
export const filterInvoices = (invoices = [], filter = "all", now = new Date()) => {
  if (filter === "all") return invoices;
  const unpaid = invoices.filter((i) => balancePaise(normalizeInvoice(i)) > 0);
  const withAge = unpaid.map((i) => ({ i, age: invoiceAgeDays(i, now) ?? 0 }));
  const kept =
    filter === "unpaid" ? withAge : withAge.filter(({ age }) => bucketFor(age).id === filter);
  return kept.sort((a, b) => b.age - a.age).map((x) => x.i);
};
