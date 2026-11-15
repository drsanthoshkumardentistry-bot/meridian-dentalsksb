/* Plans and the 30-day trial. Pricing is NOT being charged yet (our trial run), so PRICING_LIVE is false and every clinic is
 * treated as having everything. When it is switched on, planStatus says whether a clinic is in its trial, paid, or past it.
 * Who has paid will be stored on the server by the founder, never writable by the clinic itself. */

export const PRICING_LIVE = false;
export const TRIAL_DAYS = 30;
export const DAY_MS = 24 * 60 * 60 * 1000;

export const PLANS = [
  { id: "standard", name: "Standard", monthly: 499, yearly: 4999, points: ["Patients, charting, appointments", "Billing and invoices", "Backups, import and export"] },
  { id: "pro", name: "Pro", monthly: 999, yearly: null, points: ["Everything in Standard", "WhatsApp sending", "Multiple branches", "AI features"] },
];

const ms = (v) => { const n = typeof v === "string" && /[A-Za-z]/.test(v) ? Date.parse(v) : Number(v); return Number.isFinite(n) && n > 0 ? n : 0; };

/**
 * state: "free" (trial run, nothing charged), "trial", "paid", or "ended".
 * `paidUntil` and `plan` come from the server later; bad or missing values never lock anyone out while pricing is off.
 */
export const planStatus = ({ createdAt, paidUntil, plan, now = Date.now(), live = PRICING_LIVE } = {}) => {
  if (!live) return { state: "free", plan: "all", daysLeft: null, allowed: true };
  const paid = ms(paidUntil);
  if (paid && paid > now) return { state: "paid", plan: plan === "pro" ? "pro" : "standard", daysLeft: Math.ceil((paid - now) / DAY_MS), allowed: true };
  const made = ms(createdAt);
  if (!made) return { state: "trial", plan: "all", daysLeft: TRIAL_DAYS, allowed: true }; // unknown sign-up date: never lock out
  const left = Math.ceil((made + TRIAL_DAYS * DAY_MS - now) / DAY_MS);
  return left > 0 ? { state: "trial", plan: "all", daysLeft: Math.min(left, TRIAL_DAYS), allowed: true } : { state: "ended", plan: "none", daysLeft: 0, allowed: false };
};

/** WhatsApp text for a clinic that wants to subscribe. Only the clinic name and chosen plan are included. */
export const subscribeText = ({ planId = "standard", yearly = false, clinic = "" } = {}) => {
  const p = PLANS.find((x) => x.id === planId) || PLANS[0];
  const price = yearly && p.yearly ? `₹${p.yearly.toLocaleString("en-IN")} per year` : `₹${p.monthly}/month`;
  return `MeriDent: I am interested in the ${p.name} plan (${price}).\nClinic: ${String(clinic || "-").slice(0, 80)}`;
};
