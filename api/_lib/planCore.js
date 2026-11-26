// Who has paid, kept on the server only. Documents live at plans/{uid} in Firestore. The app's security rules give browsers
// no access to this collection, so a clinic cannot mark itself paid; only the founder-only endpoint below writes it.
import { getAccessToken } from "./blockCore.js";

const SCOPE = "https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/identitytoolkit";
export const PLAN_IDS = ["standard", "pro", "scale"];
export const MAX_DAYS = 800;
const DAY = 86400000;

const root = (sa) => `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(sa.project_id)}/databases/(default)/documents`;
const goodUid = (uid) => typeof uid === "string" && /^[A-Za-z0-9_-]{6,128}$/.test(uid);

/** Pure: the new paid-until time. Paying again before expiry adds to the remaining time. */
export const extendPaidUntil = (currentMs, days, now = Date.now()) => {
  const d = Math.floor(Number(days));
  if (!Number.isFinite(d) || d < 1 || d > MAX_DAYS) throw new Error("days");
  const base = Number(currentMs) > now ? Number(currentMs) : now;
  return base + d * DAY;
};

export const getPlan = async ({ sa, uid, fetchFn = fetch, now = Date.now() }) => {
  if (!goodUid(uid)) throw new Error("uid");
  const token = await getAccessToken(sa, fetchFn, now, SCOPE);
  const r = await fetchFn(`${root(sa)}/plans/${encodeURIComponent(uid)}`, { headers: { Authorization: `Bearer ${token}` } });
  if (r.status === 404) return { plan: "", paidUntil: 0 };
  if (!r.ok) throw new Error("firestore " + r.status);
  const f = (await r.json()).fields || {};
  const paidUntil = Number(f.paidUntil && (f.paidUntil.integerValue ?? f.paidUntil.doubleValue)) || 0;
  const plan = f.plan && PLAN_IDS.includes(f.plan.stringValue) ? f.plan.stringValue : "";
  const pausedRemaining = Number(f.pausedRemaining && (f.pausedRemaining.integerValue ?? f.pausedRemaining.doubleValue)) || 0;
  return pausedRemaining > 0 ? { plan, paidUntil, paused: true, pausedRemaining } : { plan, paidUntil };
};

const patchPlan = async ({ sa, uid, fields, fetchFn, now }) => {
  const token = await getAccessToken(sa, fetchFn, now, SCOPE);
  const r = await fetchFn(`${root(sa)}/plans/${encodeURIComponent(uid)}`, {
    method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ fields }),
  });
  if (!r.ok) throw new Error("firestore " + r.status);
};
const int = (n) => ({ integerValue: String(Math.round(n)) });

/** Pause: the days still left are set aside and the plan stops running. Needs time left and must not already be paused. */
export const pausePlan = async ({ sa, uid, email = "", fetchFn = fetch, now = Date.now() }) => {
  if (!goodUid(uid)) throw new Error("uid");
  const cur = await getPlan({ sa, uid, fetchFn, now });
  if (cur.paused) throw new Error("already_paused");
  if (!(cur.paidUntil > now)) throw new Error("nothing_to_pause");
  const remaining = cur.paidUntil - now;
  await patchPlan({ sa, uid, fetchFn, now, fields: { plan: { stringValue: cur.plan }, paidUntil: int(now), pausedRemaining: int(remaining), pausedAt: int(now), email: { stringValue: String(email).slice(0, 120) }, updatedAt: int(now) } });
  return { plan: cur.plan, paidUntil: now, paused: true, pausedRemaining: remaining };
};

/** Start again: the saved days run from today. */
export const resumePlan = async ({ sa, uid, email = "", fetchFn = fetch, now = Date.now() }) => {
  if (!goodUid(uid)) throw new Error("uid");
  const cur = await getPlan({ sa, uid, fetchFn, now });
  if (!cur.paused) throw new Error("not_paused");
  const paidUntil = now + cur.pausedRemaining;
  await patchPlan({ sa, uid, fetchFn, now, fields: { plan: { stringValue: cur.plan }, paidUntil: int(paidUntil), email: { stringValue: String(email).slice(0, 120) }, updatedAt: int(now) } });
  return { plan: cur.plan, paidUntil };
};

export const setPlan = async ({ sa, uid, plan, days, email = "", fetchFn = fetch, now = Date.now() }) => {
  if (!goodUid(uid)) throw new Error("uid");
  if (!PLAN_IDS.includes(plan)) throw new Error("plan");
  const current = await getPlan({ sa, uid, fetchFn, now });
  if (current.paused) throw new Error("paused");
  const paidUntil = extendPaidUntil(current.paidUntil, days, now);
  const token = await getAccessToken(sa, fetchFn, now, SCOPE);
  const r = await fetchFn(`${root(sa)}/plans/${encodeURIComponent(uid)}`, {
    method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: { plan: { stringValue: plan }, paidUntil: { integerValue: String(paidUntil) }, email: { stringValue: String(email).slice(0, 120) }, updatedAt: { integerValue: String(now) } } }),
  });
  if (!r.ok) throw new Error("firestore " + r.status);
  return { plan, paidUntil };
};

/** Finds a sign-in account by email, with the service account. Returns the uid or "". */
export const uidByEmail = async ({ sa, email, fetchFn = fetch, now = Date.now() }) => {
  const e = String(email || "").trim().toLowerCase();
  if (!/^[^@\s]{1,64}@[^@\s]{1,255}$/.test(e)) return "";
  const token = await getAccessToken(sa, fetchFn, now, SCOPE);
  const r = await fetchFn(`https://identitytoolkit.googleapis.com/v1/projects/${encodeURIComponent(sa.project_id)}/accounts:lookup`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ email: [e] }),
  });
  if (!r.ok) throw new Error("identity " + r.status);
  const u = ((await r.json()).users || [])[0];
  return u && u.localId ? u.localId : "";
};
