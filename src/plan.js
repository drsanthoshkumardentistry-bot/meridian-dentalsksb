/* Plans and the 30-day trial. Pricing is NOT being charged yet (our trial run), so PRICING_LIVE is false and every clinic is
 * treated as having everything. When it is switched on, planStatus says whether a clinic is in its trial, paid, or past it.
 * Who has paid will be stored on the server by the founder, never writable by the clinic itself. */

export const PRICING_LIVE = false;
export const TRIAL_DAYS = 30;

/* Where clinics send plan payments. One place to change. A UPI ID is public by design (it is what a QR code carries). The name is
 * shown next to it so a clinic can check it before paying. The founder still approves every plan by hand once the money arrives. */
export const PAY_TO = { vpa: "sabari2005g@okicici", name: "siva sabari" };
export const DAY_MS = 24 * 60 * 60 * 1000;

/* Plans are priced by image storage (X-rays and photos), which is what costs us money. Ids stay "standard" and "pro" so clinics
 * already recorded on the server keep working; the names the clinic sees are Starter, Growth and Scale. Prices are before GST. */
export const PLANS = [
  { id: "standard", name: "Starter", monthly: 499, yearly: 4999, storageGb: 5, points: ["5 GB for X-rays and photos", "Patients, charting, appointments", "Billing, backups, import and export"] },
  { id: "pro", name: "Growth", monthly: 999, yearly: 9999, storageGb: 25, points: ["25 GB for X-rays and photos", "Everything in Starter", "Multiple branches", "AI features"] },
  { id: "scale", name: "Scale", monthly: 1999, yearly: 19999, storageGb: 100, points: ["100 GB for X-rays and photos", "Everything in Growth", "Built for several doctors and branches"] },
];
export const EXTRA_STORAGE = { gb: 10, monthly: 99, yearly: 990 };
export const planName = (id) => (PLANS.find((p) => p.id === id) || { name: "Starter" }).name;
export const planIdOr = (id) => (PLANS.some((p) => p.id === id) ? id : "standard");

const ms = (v) => { const n = typeof v === "string" && /[A-Za-z]/.test(v) ? Date.parse(v) : Number(v); return Number.isFinite(n) && n > 0 ? n : 0; };

/**
 * state: "free" (trial run, nothing charged), "trial", "paid", or "ended".
 * `paidUntil` and `plan` come from the server later; bad or missing values never lock anyone out while pricing is off.
 */
export const planStatus = ({ createdAt, paidUntil, plan, paused, pausedRemaining, now = Date.now(), live = PRICING_LIVE } = {}) => {
  if (!live) return { state: "free", plan: "all", daysLeft: null, allowed: true };
  const kept = Number(pausedRemaining) || 0;
  if (paused && kept > 0) return { state: "paused", plan: planIdOr(plan), daysLeft: Math.ceil(kept / DAY_MS), allowed: false };
  const paid = ms(paidUntil);
  if (paid && paid > now) return { state: "paid", plan: planIdOr(plan), daysLeft: Math.ceil((paid - now) / DAY_MS), allowed: true };
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
