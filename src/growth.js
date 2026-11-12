// Membership packages and a simple lead list. Plain functions, no storage: the app keeps the records.
import { whatsappLink, dateKey } from "./reminders.js";
import { computeLineItemTotals, toPaise } from "./billing.js";

const clampText = (v, n) => String(v == null ? "" : v).trim().slice(0, n);
const digits = (v) => String(v || "").replace(/\D/g, "");
export const MAX_PLANS = 12;

// ---- Membership plans -------------------------------------------------------------------------------------

/** Checks one plan. Price is in rupees; stored in paise. */
export const buildPlan = ({ name, price, months, discountPct, perks } = {}, id) => {
  const n = clampText(name, 40);
  if (!n) return { ok: false, error: "Give the plan a name, for example Family Gold." };
  const rupees = Number(price);
  if (!Number.isFinite(rupees) || rupees < 0 || rupees > 1000000) return { ok: false, error: "Enter the plan price in rupees (0 or more)." };
  const m = Math.round(Number(months));
  if (!Number.isFinite(m) || m < 1 || m > 60) return { ok: false, error: "Validity must be between 1 and 60 months." };
  const d = Number(discountPct || 0);
  if (!Number.isFinite(d) || d < 0 || d > 100) return { ok: false, error: "Discount must be between 0 and 100 percent." };
  return { ok: true, plan: { id, name: n, priceP: Math.round(rupees * 100), months: m, discountPct: Math.round(d * 100) / 100, perks: clampText(perks, 200) } };
};

export const upsertPlans = (plans = [], plan) => {
  const list = Array.isArray(plans) ? plans : [];
  if (list.some((p) => p.id === plan.id)) return list.map((p) => (p.id === plan.id ? plan : p));
  return list.length >= MAX_PLANS ? list : [...list, plan];
};
export const removePlan = (plans = [], id) => (Array.isArray(plans) ? plans : []).filter((p) => p.id !== id);

// ---- Selling and tracking memberships ---------------------------------------------------------------------

/** yyyy-mm-dd plus whole months. Month ends are clamped (31 Jan + 1 month = 28/29 Feb). */
export const addMonthsISO = (iso, months) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
  if (!m) return "";
  const y = Number(m[1]), mo = Number(m[2]) - 1, d = Number(m[3]);
  const target = new Date(Date.UTC(y, mo + months, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, last));
  return target.toISOString().slice(0, 10);
};

export const sellMembership = ({ patient, plan, startOn, paidRupees, mode = "Cash" } = {}, id, now = new Date()) => {
  if (!patient || !patient.id) return { ok: false, error: "Choose the patient." };
  if (!plan) return { ok: false, error: "Choose a plan." };
  const start = /^\d{4}-\d{2}-\d{2}$/.test(startOn || "") ? startOn : dateKey(now);
  const paid = paidRupees === "" || paidRupees == null ? plan.priceP : Math.round(Number(paidRupees) * 100);
  if (!Number.isFinite(paid) || paid < 0) return { ok: false, error: "Enter the amount paid in rupees." };
  return {
    ok: true,
    membership: {
      id, patientId: patient.id, patientName: clampText(patient.name, 80), phone: clampText(patient.phone, 20),
      planId: plan.id, planName: plan.name, discountPct: plan.discountPct || 0, perks: plan.perks || "",
      startOn: start, endOn: addMonthsISO(start, plan.months), paidP: paid, mode: clampText(mode, 20), createdAt: now.toISOString(),
    },
  };
};

const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
/** active, expiring (30 days or fewer left) or expired. */
export const membershipStatus = (m, today = dateKey()) => {
  if (!m || !m.endOn) return "expired";
  const left = daysBetween(today, m.endOn);
  if (left < 0) return "expired";
  if (daysBetween(m.startOn, today) < 0) return "active";
  return left <= 30 ? "expiring" : "active";
};
export const daysLeft = (m, today = dateKey()) => Math.max(0, daysBetween(today, m.endOn));

/** The patient's current membership: latest end date that is not expired. */
export const activeMembershipFor = (memberships = [], patientId, today = dateKey()) =>
  memberships.filter((m) => m.patientId === patientId && membershipStatus(m, today) !== "expired").sort((a, b) => (a.endOn < b.endOn ? 1 : -1))[0] || null;

export const discountedAmountP = (amountP, discountPct) => Math.max(0, Math.round(amountP * (1 - (Number(discountPct) || 0) / 100)));

export const membershipSummary = (memberships = [], today = dateKey()) => {
  const out = { active: 0, expiring: 0, expired: 0, soldP: 0 };
  memberships.forEach((m) => { out[membershipStatus(m, today)] += 1; out.soldP += m.paidP || 0; });
  return out;
};

export const renewalMessage = ({ clinicName, m, today = dateKey() }) => {
  const left = daysLeft(m, today);
  const state = membershipStatus(m, today) === "expired" ? "has expired" : `ends in ${left} day${left === 1 ? "" : "s"}`;
  return `Hello ${m.patientName}, your ${m.planName} membership at ${clinicName || "our clinic"} ${state}.${m.discountPct ? ` You save ${m.discountPct}% on treatments while it is active.` : ""} Reply to this message to renew.`;
};

// ---- Leads ------------------------------------------------------------------------------------------------

export const LEAD_SOURCES = ["Walk-in", "Phone call", "Instagram", "Facebook", "Google", "Referral", "Camp", "Other"];
export const LEAD_STATUSES = ["New", "Contacted", "Booked", "Not interested"];

export const buildLead = ({ name, phone, source = "Walk-in", interest = "", note = "", followUpOn = "" } = {}, id, now = new Date()) => {
  const n = clampText(name, 80);
  if (!n) return { ok: false, error: "Enter the person's name." };
  const ph = digits(phone);
  if (ph.length < 10 || ph.length > 13) return { ok: false, error: "Enter a 10 digit mobile number." };
  const fu = /^\d{4}-\d{2}-\d{2}$/.test(followUpOn || "") ? followUpOn : "";
  return {
    ok: true,
    lead: {
      id, name: n, phone: ph.slice(-10), source: LEAD_SOURCES.includes(source) ? source : "Other", interest: clampText(interest, 60),
      note: clampText(note, 300), status: "New", followUpOn: fu, createdOn: dateKey(now), createdAt: now.toISOString(),
    },
  };
};

export const setLeadStatus = (lead, status, now = new Date()) =>
  LEAD_STATUSES.includes(status) ? { ...lead, status, updatedAt: now.toISOString(), followUpOn: status === "Booked" || status === "Not interested" ? "" : lead.followUpOn } : lead;

export const isOpenLead = (l) => l.status === "New" || l.status === "Contacted";
export const followUpDue = (l, today = dateKey()) => isOpenLead(l) && Boolean(l.followUpOn) && l.followUpOn <= today;

export const leadSummary = (leads = [], today = dateKey()) => {
  const by = { New: 0, Contacted: 0, Booked: 0, "Not interested": 0 };
  leads.forEach((l) => { if (by[l.status] != null) by[l.status] += 1; });
  const total = leads.length;
  return { ...by, total, due: leads.filter((l) => followUpDue(l, today)).length, bookedPct: total ? Math.round((by.Booked / total) * 100) : 0 };
};

/** Open leads first (follow-ups due on top), then the rest; newest first inside each group. */
export const sortLeads = (leads = [], today = dateKey()) =>
  [...leads].sort((a, b) => {
    const rank = (l) => (followUpDue(l, today) ? 0 : isOpenLead(l) ? 1 : 2);
    return rank(a) - rank(b) || (a.createdAt < b.createdAt ? 1 : -1);
  });

export const leadWhatsAppLink = (lead, clinicName) =>
  whatsappLink(lead.phone, `Hello ${lead.name}, this is ${clinicName || "our dental clinic"}. Thank you for your interest${lead.interest ? ` in ${lead.interest}` : ""}. Would you like to book a visit? Reply with a day and time that suits you.`);

// ---- Linking to billing and patients ------------------------------------------------------------------------

/** The discount in rupees (as text for the Discount field) for a member's percentage off the bill items. */
export const memberDiscountRupees = (items = [], pct) => {
  const subtotalP = items.reduce((sum, it) => sum + Math.max(0, toPaise(it.amount)), 0);
  const off = Math.round((subtotalP * (Number(pct) || 0)) / 100);
  return off > 0 ? String(off / 100) : "";
};

/** A fully paid invoice for a membership fee. Treated as GST exempt, like other clinic fees; change it on the bill if your accountant says otherwise. */
export const membershipInvoice = (m, invoiceId, paidOn) => {
  const totals = computeLineItemTotals({ items: [{ description: `${m.planName} membership (${m.startOn} to ${m.endOn})`, amount: m.paidP / 100, taxCategory: "therapeutic" }] });
  return {
    id: invoiceId, patientId: m.patientId, patient: m.patientName, paymentMode: m.mode || "Cash",
    treatment: totals.lines.map((l) => l.description).join(", "), taxCategory: "therapeutic", ...totals,
    payments: m.paidP > 0 ? [{ date: paidOn, mode: m.mode || "Cash", amountP: m.paidP }] : [],
    total: (totals.totalP / 100).toLocaleString("en-IN"), rawAmount: String(totals.totalP / 100), date: paidOn, membershipId: m.id,
  };
};

/** Starting values for the New patient form from a lead. */
export const leadPatientPrefill = (lead) => ({ name: lead.name, phone: lead.phone });
