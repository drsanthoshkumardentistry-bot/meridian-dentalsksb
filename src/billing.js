/* ==============================================================================
 * MERIDENT OS - BILLING ENGINE (pure functions, no React)
 * All money is handled as integer paise to avoid floating point errors.
 * GST: therapeutic dental services are exempt; cosmetic services are 18% (CGST 9 + SGST 9).
 * ============================================================================== */

export const TAX_CATEGORIES = [
  { id: "therapeutic", label: "Therapeutic (GST exempt)", rate: 0 },
  { id: "cosmetic", label: "Cosmetic / aesthetic (GST 18%)", rate: 18 },
];

export const toPaise = (rupees) => {
  const n = typeof rupees === "number" ? rupees : parseFloat(String(rupees).replace(/,/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
};

export const formatINR = (paise) =>
  (paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const gstRateFor = (taxCategory) => {
  const found = TAX_CATEGORIES.find((c) => c.id === taxCategory);
  return found ? found.rate : 0;
};

export const MAX_LINE_ITEMS = 20;

/** Splits `total` paise across `weights` so the parts always add up exactly (largest remainder). */
export const allocateProportionally = (total, weights) => {
  const sum = weights.reduce((s, w) => s + w, 0);
  if (total <= 0 || sum <= 0) return weights.map(() => 0);
  const raw = weights.map((w) => (total * w) / sum);
  const parts = raw.map(Math.floor);
  let left = total - parts.reduce((s, v) => s + v, 0);
  const order = raw.map((r, i) => ({ i, frac: r - Math.floor(r) })).sort((x, y) => y.frac - x.frac || x.i - y.i);
  for (let k = 0; left > 0 && k < order.length; k += 1, left -= 1) parts[order[k].i] += 1;
  return parts;
};

/**
 * Multi-item invoice. items: [{ description, amount (rupees), taxCategory }].
 * The discount is shared across items in proportion to their amounts, then GST is worked out per item,
 * so a bill can mix therapeutic (exempt) and cosmetic (18%) work correctly.
 */
export const computeLineItemTotals = ({ items = [], discount = 0 }) => {
  const base = items.map((it) => ({
    description: String(it.description || "").trim(),
    taxCategory: it.taxCategory || "therapeutic",
    amountP: Math.max(0, toPaise(it.amount)),
  }));
  const subtotalP = base.reduce((s, l) => s + l.amountP, 0);
  const discountP = Math.min(subtotalP, Math.max(0, toPaise(discount)));
  const shares = allocateProportionally(discountP, base.map((l) => l.amountP));
  const lines = base.map((l, i) => {
    const taxableP = l.amountP - shares[i];
    const gstRate = gstRateFor(l.taxCategory);
    const taxP = Math.round((taxableP * gstRate) / 100);
    const cgstP = Math.floor(taxP / 2);
    return { ...l, discountP: shares[i], taxableP, gstRate, taxP, cgstP, sgstP: taxP - cgstP, totalP: taxableP + taxP };
  });
  const sum = (key) => lines.reduce((s, l) => s + l[key], 0);
  const taxableP = sum("taxableP");
  const taxableGstP = lines.filter((l) => l.gstRate > 0).reduce((s, l) => s + l.taxableP, 0);
  return {
    lines,
    subtotalP,
    discountP,
    taxableP,
    exemptP: taxableP - taxableGstP,
    taxableGstP,
    gstRate: lines.reduce((m, l) => Math.max(m, l.gstRate), 0),
    cgstP: sum("cgstP"),
    sgstP: sum("sgstP"),
    taxP: sum("taxP"),
    totalP: sum("totalP"),
  };
};

/** Single-amount invoice (kept for existing callers). */
export const computeInvoiceTotals = ({ amount, discount = 0, taxCategory = "therapeutic" }) => {
  const { lines, exemptP, taxableGstP, ...t } = computeLineItemTotals({ items: [{ amount, taxCategory }], discount });
  return t;
};

/** Lines of any invoice. Older single-amount invoices become one line. */
export const invoiceLines = (inv) => {
  if (Array.isArray(inv.lines) && inv.lines.length > 0) return inv.lines;
  return [
    {
      description: inv.treatment || "",
      taxCategory: inv.taxCategory || "therapeutic",
      amountP: inv.subtotalP || 0,
      discountP: inv.discountP || 0,
      taxableP: inv.taxableP || 0,
      gstRate: inv.gstRate || 0,
      taxP: inv.taxP || 0,
      cgstP: inv.cgstP || 0,
      sgstP: inv.sgstP || 0,
      totalP: inv.totalP || 0,
    },
  ];
};

export const financialYear = (date = new Date()) => {
  const y = date.getFullYear();
  const start = date.getMonth() >= 3 ? y : y - 1; // April starts the Indian financial year
  return `${start}-${String(start + 1).slice(-2)}`;
};

/** Sequential, gap-free per financial year: INV/2026-27/0001 */
export const nextInvoiceNumber = (existingInvoices = [], date = new Date()) => {
  const fy = financialYear(date);
  const prefix = `INV/${fy}/`;
  let max = 0;
  for (const inv of existingInvoices) {
    if (inv && typeof inv.id === "string" && inv.id.startsWith(prefix)) {
      const n = parseInt(inv.id.slice(prefix.length), 10);
      if (Number.isFinite(n) && n > max) max = n;
    }
  }
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
};

/** Brings old invoices (rawAmount/total strings) into the new shape without losing data. */
export const normalizeInvoice = (inv) => {
  if (!inv) return inv;
  if (typeof inv.totalP === "number") return { ...inv, payments: inv.payments || [] };
  const legacyP = toPaise(inv.rawAmount ?? inv.total ?? 0);
  const settled = inv.status === "Self-Pay Completed" || inv.status === "Claim Settled";
  return {
    ...inv,
    subtotalP: legacyP,
    discountP: 0,
    taxableP: legacyP,
    gstRate: 0,
    cgstP: 0,
    sgstP: 0,
    taxP: 0,
    totalP: legacyP,
    taxCategory: "therapeutic",
    payments: settled && legacyP > 0 ? [{ date: inv.date || "", mode: inv.paymentMode || "Cash", amountP: legacyP }] : [],
  };
};

export const paidPaise = (inv) => (inv.payments || []).reduce((s, p) => s + (p.amountP || 0), 0);
export const balancePaise = (inv) => Math.max(0, (inv.totalP || 0) - paidPaise(inv));

export const paymentStatus = (inv) => {
  const paid = paidPaise(inv);
  if ((inv.totalP || 0) > 0 && paid >= inv.totalP) return "Paid";
  if (paid > 0) return "Part paid";
  return "Unpaid";
};

/** Returns {ok, invoice, error}. Never lets a payment exceed the balance. */
export const addPayment = (inv, { amount, mode = "Cash", date = new Date().toLocaleDateString("en-IN") }) => {
  const amountP = toPaise(amount);
  if (amountP <= 0) return { ok: false, error: "Enter an amount greater than zero" };
  if (amountP > balancePaise(inv)) return { ok: false, error: "Payment is more than the balance due" };
  return { ok: true, invoice: { ...inv, payments: [...(inv.payments || []), { date, mode, amountP }] } };
};

export const isValidUpiId = (vpa) => /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/.test(String(vpa || "").trim());

/** Standard UPI deep link; every UPI app can scan or open it. */
export const buildUpiUri = ({ vpa, name, amountP, note }) => {
  const q = new URLSearchParams();
  q.set("pa", String(vpa).trim());
  if (name) q.set("pn", name);
  if (amountP > 0) q.set("am", (amountP / 100).toFixed(2));
  q.set("cu", "INR");
  if (note) q.set("tn", note);
  return `upi://pay?${q.toString()}`;
};

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/** Printable invoice (or receipt when receipt=true). Opens in a new window and prints to paper or PDF. */
export const buildInvoiceHtml = (inv, profile = {}, { receipt = false } = {}) => {
  const paid = paidPaise(inv);
  const balance = balancePaise(inv);
  const gstRows =
    inv.gstRate > 0
      ? `<tr><td>CGST @ ${inv.gstRate / 2}%</td><td class="r">₹${formatINR(inv.cgstP)}</td></tr>
         <tr><td>SGST @ ${inv.gstRate / 2}%</td><td class="r">₹${formatINR(inv.sgstP)}</td></tr>`
      : `<tr><td>GST</td><td class="r">Exempt (therapeutic dental service)</td></tr>`;
  const lines = invoiceLines(inv);
  const lineRows =
    lines.length > 1
      ? `<h2>Treatments</h2><table>${lines
          .map(
            (l) =>
              `<tr><td>${esc(l.description)}</td><td class="muted">${l.gstRate > 0 ? `GST ${l.gstRate}%` : "GST exempt"}</td><td class="r">₹${formatINR(l.amountP)}</td></tr>`
          )
          .join("")}</table>`
      : `<h2>Treatment</h2><div>${esc(inv.treatment)}</div>`;
  const payRows = (inv.payments || [])
    .map((p) => `<tr><td>${esc(p.date)} · ${esc(p.mode)}</td><td class="r">₹${formatINR(p.amountP)}</td></tr>`)
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${receipt ? "Receipt" : "Invoice"} ${esc(inv.id)}</title>
<style>
body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;margin:32px;font-size:13px}
h1{font-size:20px;margin:0;color:#1d4ed8}h2{font-size:15px;margin:20px 0 6px}
.muted{color:#64748b}.head{display:flex;justify-content:space-between;border-bottom:2px solid #1d4ed8;padding-bottom:12px}
table{width:100%;border-collapse:collapse;margin-top:8px}td{padding:6px 0;border-bottom:1px solid #e2e8f0}.r{text-align:right}
.total td{font-weight:bold;font-size:15px;border-top:2px solid #0f172a}.badge{display:inline-block;padding:2px 10px;border:1px solid #1d4ed8;color:#1d4ed8;border-radius:99px;font-size:11px}
@media print{body{margin:12mm}}
</style></head><body>
<div class="head"><div><h1>${esc(profile.name || "Dental Clinic")}</h1>
<div class="muted">${esc(profile.tagline || "")}</div><div class="muted">${esc(profile.address || "")}</div>
<div class="muted">${esc(profile.phone || "")} ${profile.email ? "· " + esc(profile.email) : ""}</div>
${profile.regNumber ? `<div class="muted">Reg: ${esc(profile.regNumber)}</div>` : ""}</div>
<div class="r"><div class="badge">${receipt ? "PAYMENT RECEIPT" : "TAX INVOICE"}</div>
<div><b>${esc(inv.id)}</b></div><div class="muted">${esc(inv.date)}</div></div></div>
<h2>Billed to</h2><div><b>${esc(inv.patient)}</b></div>
${lineRows}
<table>
<tr><td>Amount</td><td class="r">₹${formatINR(inv.subtotalP)}</td></tr>
${inv.discountP > 0 ? `<tr><td>Discount</td><td class="r">− ₹${formatINR(inv.discountP)}</td></tr>` : ""}
<tr><td>Taxable value</td><td class="r">₹${formatINR(inv.taxableP)}</td></tr>
${gstRows}
<tr class="total"><td>Total</td><td class="r">₹${formatINR(inv.totalP)}</td></tr>
</table>
<h2>Payments received</h2>
<table>${payRows || `<tr><td class="muted">No payments yet</td><td></td></tr>`}
<tr><td><b>Paid</b></td><td class="r"><b>₹${formatINR(paid)}</b></td></tr>
<tr><td><b>Balance due</b></td><td class="r"><b>₹${formatINR(balance)}</b></td></tr></table>
<p class="muted" style="margin-top:28px">Computer generated by MeriDent. Therapeutic dental services are exempt from GST; cosmetic services attract 18% GST.</p>
<script>window.onload=function(){window.print()}</script>
</body></html>`;
};
