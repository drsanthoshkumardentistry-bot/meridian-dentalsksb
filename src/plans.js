import { computeLineItemTotals, formatINR } from "./billing.js";
import { toothInfo, normalizeConditions } from "./odontogram.js";

export const PLAN_STATUS = ["Proposed", "Approved", "Declined", "Billed"];
export const MAX_PLAN_ITEMS = 20;

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const todayStr = (now) => now.toLocaleDateString("en-IN");

/** "16, 17 26" -> [16, 17, 26]; keeps order, drops blanks and duplicates. Invalid entries are kept as NaN-free numbers only if numeric. */
export const parseTeeth = (str) => {
  const out = [];
  String(str || "")
    .split(/[\s,;]+/)
    .filter(Boolean)
    .forEach((tok) => {
      const n = Number(tok);
      if (!out.includes(n)) out.push(n);
    });
  return out;
};

/** Validate a draft plan; returns an error message or "". */
export const validatePlan = ({ title, items = [] }) => {
  if (!String(title || "").trim()) return "Give the plan a title, for example 'Full mouth rehabilitation'";
  if (!items.length) return "Add at least one treatment to the plan";
  if (items.some((it) => !String(it.description || "").trim())) return "Describe the treatment for every item";
  if (items.some((it) => !(parseFloat(it.amount) > 0))) return "Enter an estimated amount greater than zero for every item";
  if (items.some((it) => parseTeeth(it.tooth).some((n) => !toothInfo(n)))) {
    return "Tooth numbers must be valid FDI numbers such as 16 or 46, separated by commas";
  }
  return "";
};

/** Teeth currently planned: items of plans that are Proposed or Approved. */
export const plannedTeeth = (plans = []) => {
  const set = new Set();
  plans
    .filter((p) => p.status === "Proposed" || p.status === "Approved")
    .forEach((p) => p.items.forEach((it) => parseTeeth(it.tooth).forEach((n) => toothInfo(n) && set.add(n))));
  return set;
};

const SUGGESTIONS = {
  CAR: "Restoration (filling)",
  FRC: "Repair of fractured tooth",
  SCL: "Scaling and polishing",
  MIS: "Replacement of missing tooth"
};

/** One blank-priced plan row per charted finding that usually needs treatment. */
export const suggestPlanItems = (conditions = {}, makeId) =>
  Object.entries(normalizeConditions(conditions))
    .filter(([tooth]) => toothInfo(tooth))
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .flatMap(([tooth, codes]) =>
      codes
        .filter((code) => SUGGESTIONS[code])
        .map((code) => ({
          id: makeId(),
          description: SUGGESTIONS[code],
          tooth: String(tooth),
          amount: "",
          taxCategory: "therapeutic"
        }))
    );

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
    description: it.tooth ? `${it.description} (${parseTeeth(it.tooth).length > 1 ? "teeth" : "tooth"} ${parseTeeth(it.tooth).join(", ")})` : it.description,
    amount: it.amount,
    taxCategory: it.taxCategory,
  }));

export const buildPlanMessage = (plan, patient, profile = {}) => {
  const t = planTotals(plan);
  const lines = t.lines.map((l, i) => {
    const it = plan.items[i];
    return `${i + 1}. ${l.description}${it.tooth ? ` (${parseTeeth(it.tooth).length > 1 ? "teeth" : "tooth"} ${parseTeeth(it.tooth).join(", ")})` : ""}: ₹${formatINR(l.amountP)}`;
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

/* ------------------------- Patient approval link ------------------------- */

export const SHARE_DAYS = 30;

/** 32 URL-safe characters from 24 random bytes (192 bits). Not guessable. */
export const newShareToken = (cryptoLike = globalThis.crypto) => {
  const bytes = new Uint8Array(24);
  cryptoLike.getRandomValues(bytes);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

export const shareUrl = (origin, token) => `${String(origin).replace(/\/$/, "")}/?plan=${encodeURIComponent(token)}`;

/** Only what the patient needs to decide: first name, clinic name and the priced plan. No phone, no records. */
export const buildShareDoc = ({ plan, patient, profile = {}, clinicId }, now = new Date()) => {
  const t = planTotals(plan);
  return {
    clinicId,
    patientId: String(patient?.id || ""),
    planId: plan.id,
    clinicName: String(profile.name || "Your dental clinic"),
    patientFirstName: String(patient?.name || "").trim().split(/\s+/)[0] || "",
    title: plan.title,
    notes: plan.notes || "",
    items: t.lines.map((l, i) => ({
      description: l.description,
      tooth: plan.items[i].tooth || "",
      amountP: l.amountP,
    })),
    subtotalP: t.subtotalP,
    discountP: t.discountP,
    taxP: t.taxP,
    totalP: t.totalP,
    decision: "pending",
    decidedAt: null,
    decidedName: "",
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SHARE_DAYS * 24 * 60 * 60 * 1000),
  };
};

const toDate = (v) => (v && typeof v.toDate === "function" ? v.toDate() : v instanceof Date ? v : new Date(v));

export const isShareExpired = (share, now = new Date()) => !share || !(toDate(share.expiresAt) > now);

/** Copy the patient's decision onto the clinic's plan. Only a Proposed plan can change this way. */
export const applyShareDecision = (plan, share, now = new Date()) => {
  if (!plan || !share || plan.status !== "Proposed") return plan;
  const name = String(share.decidedName || "").trim();
  if (share.decision === "approved") return approvePlan(plan, name ? `${name} (online)` : "Patient (online)", now);
  if (share.decision === "declined") return declinePlan(plan, now);
  return plan;
};

export const buildShareMessage = (plan, patient, profile, url) =>
  `Hello ${patient?.name || ""}, ${profile?.name || "our clinic"} has prepared a treatment estimate for you: ${plan.title}.\n\n` +
  `Please review it and let us know if you approve:\n${url}\n\n` +
  `The link works for ${SHARE_DAYS} days. This is an estimate, not a bill.`;
