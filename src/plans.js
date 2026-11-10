import { computeLineItemTotals, formatINR } from "./billing.js";

export const PLAN_STATUS = ["Proposed", "Approved", "Declined", "Billed"];
export const MAX_PLAN_ITEMS = 20;

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const todayStr = (now) => now.toLocaleDateString("en-IN");

/** Validate a draft plan; returns an error message or "". */
export const validatePlan = ({ title, items = [] }) => {
  if (!String(title || "").trim()) return "Give the plan a title, for example 'Full mouth rehabilitation'";
  if (!items.length) return "Add at least one treatment to the plan";
  if (items.some((it) => !String(it.description || "").trim())) return "Describe the treatment for every item";
  if (items.some((it) => !(parseFloat(it.amount) > 0))) return "Enter an estimated amount greater than zero for every item";
  return "";
};

/** Build a stored plan from a draft. Amounts stay as entered; totals are derived on demand. */
export const createPlan = ({ id, title, items, discount = "", notes = "" }, now = new Date()) => ({
  id,
  title: String(title).trim(),
  items: items.map((it) => ({
    id: it.id,
    description: String(it.description).trim(),
    tooth: String(it.tooth || "").trim(),
    amount: String(it.amount),
    taxCategory: it.taxCategory || "therapeutic",
  })),
  discount: String(discount || ""),
  notes: String(notes || "").trim(),
  status: "Proposed",
  createdAt: todayStr(now),
  decidedAt: "",
  decidedBy: "",
  invoiceId: "",
});

export const planTotals = (plan) => computeLineItemTotals({ items: plan.items, discount: plan.discount });

const guard = (plan, from) => {
  if (!plan) return false;
  return from.includes(plan.status);
};

/** Patient agrees. `by` records who agreed (patient, guardian, etc). */
export const approvePlan = (plan, by = "", now = new Date()) =>
  guard(plan, ["Proposed", "Declined"])
    ? { ...plan, status: "Approved", decidedAt: todayStr(now), decidedBy: String(by).trim() }
    : plan;

export const declinePlan = (plan, now = new Date()) =>
  guard(plan, ["Proposed", "Approved"])
    ? { ...plan, status: "Declined", decidedAt: todayStr(now), decidedBy: "" }
    : plan;

/** Only an approved, not-yet-billed plan may be billed. */
export const canBill = (plan) => Boolean(plan) && plan.status === "Approved";

export const markPlanBilled = (plan, invoiceId) =>
  canBill(plan) ? { ...plan, status: "Billed", invoiceId } : plan;

/** Items shaped for the invoice form. `newId` makes fresh row ids. */
export const planToInvoiceItems = (plan, newId) =>
  plan.items.map((it) => ({
    id: newId(),
    description: it.tooth ? `${it.description} (tooth ${it.tooth})` : it.description,
    amount: it.amount,
    taxCategory: it.taxCategory,
  }));

export const buildPlanMessage = (plan, patient, profile = {}) => {
  const t = planTotals(plan);
  const lines = t.lines.map((l, i) => {
    const it = plan.items[i];
    return `${i + 1}. ${l.description}${it.tooth ? ` (tooth ${it.tooth})` : ""}: ₹${formatINR(l.amountP)}`;
  });
  return (
    `Hello ${patient?.name || ""}, here is your treatment estimate from ${profile.name || "our clinic"}.\n\n` +
    `*${plan.title}*\n${lines.join("\n")}\n` +
    (t.discountP > 0 ? `Discount: -₹${formatINR(t.discountP)}\n` : "") +
    (t.taxP > 0 ? `GST: ₹${formatINR(t.taxP)}\n` : "") +
    `*Estimated total: ₹${formatINR(t.totalP)}*\n\n` +
    `This is an estimate. The final bill is based on the treatment actually done. Reply to this message to approve or ask questions.`
  );
};

export const buildPlanHtml = (plan, patient, profile = {}) => {
  const t = planTotals(plan);
  const rows = t.lines
    .map((l, i) => {
      const it = plan.items[i];
      return `<tr><td>${esc(l.description)}</td><td>${esc(it.tooth)}</td><td class="r">₹${formatINR(l.amountP)}</td></tr>`;
    })
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>Treatment estimate</title>
<style>body{font-family:Arial,sans-serif;color:#0f172a;max-width:720px;margin:24px auto;padding:0 16px}
h1{color:#1d4ed8;font-size:20px;margin:0}table{width:100%;border-collapse:collapse;margin:12px 0}
th,td{border-bottom:1px solid #e2e8f0;padding:8px;text-align:left;font-size:14px}.r{text-align:right}
.muted{color:#64748b;font-size:12px}</style></head><body>
<h1>${esc(profile.name || "Dental Clinic")}</h1><div class="muted">${esc(profile.address || "")} ${esc(profile.phone || "")}</div>
<h2>Treatment estimate: ${esc(plan.title)}</h2>
<div>Patient: <b>${esc(patient?.name || "")}</b> · Date: ${esc(plan.createdAt)}</div>
<table><tr><th>Treatment</th><th>Tooth</th><th class="r">Estimate</th></tr>${rows}
${t.discountP > 0 ? `<tr><td colspan="2">Discount</td><td class="r">-₹${formatINR(t.discountP)}</td></tr>` : ""}
${t.taxP > 0 ? `<tr><td colspan="2">GST</td><td class="r">₹${formatINR(t.taxP)}</td></tr>` : ""}
<tr><td colspan="2"><b>Estimated total</b></td><td class="r"><b>₹${formatINR(t.totalP)}</b></td></tr></table>
${plan.notes ? `<p>${esc(plan.notes)}</p>` : ""}
<p class="muted">This is an estimate, not a bill. The final charge depends on the treatment actually carried out.</p>
<p style="margin-top:48px">Patient / guardian signature: ______________________ &nbsp; Date: ____________</p>
<script>window.onload=function(){window.print()}</script></body></html>`;
};
