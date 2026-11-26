// Subscription requests. A clinic asks for a plan; the founder approves after the payment arrives (UPI), which switches the plan on.
// Stored in planRequests/{uid}. Server-only collection: a clinic can neither approve itself nor read other clinics' requests.
import { getDoc, putDoc, listDocs, goodUid } from "./fsLite.js";
import { setPlan, PLAN_IDS } from "./planCore.js";

export const DAYS_FOR = (yearly) => (yearly ? 365 : 30);

export const createRequest = async ({ sa, uid, email, plan, yearly = false, clinic = "", fetchFn = fetch, now = Date.now() }) => {
  if (!goodUid(uid)) throw new Error("uid");
  if (!PLAN_IDS.includes(plan)) throw new Error("plan");
  const y = yearly === true; // every plan has a yearly price
  const data = { plan, yearly: y, clinic: String(clinic || "").slice(0, 80), email: String(email || "").slice(0, 120), status: "pending", createdAt: now, decidedAt: 0 };
  await putDoc({ sa, path: `planRequests/${encodeURIComponent(uid)}`, data, fetchFn, now });
  return { status: "pending", plan, yearly: y };
};

export const getRequest = async ({ sa, uid, fetchFn = fetch, now = Date.now() }) => {
  if (!goodUid(uid)) throw new Error("uid");
  const r = await getDoc({ sa, path: `planRequests/${encodeURIComponent(uid)}`, fetchFn, now });
  return r ? { status: r.status || "", plan: r.plan || "", yearly: !!r.yearly, createdAt: r.createdAt || 0, decidedAt: r.decidedAt || 0 } : { status: "" };
};

export const listRequests = (args) => listDocs({ ...args, collection: "planRequests" });

/** Founder decision. Approve switches the plan on for 30 days (365 for yearly) and marks the request approved. */
export const decideRequest = async ({ sa, uid, action, fetchFn = fetch, now = Date.now() }) => {
  if (!goodUid(uid)) throw new Error("uid");
  if (action !== "approve" && action !== "reject") throw new Error("action");
  const path = `planRequests/${encodeURIComponent(uid)}`;
  const req = await getDoc({ sa, path, fetchFn, now });
  if (!req) throw new Error("missing");
  if (req.status !== "pending") throw new Error("decided");
  let paidUntil = 0;
  if (action === "approve") {
    ({ paidUntil } = await setPlan({ sa, uid, plan: req.plan, days: DAYS_FOR(req.yearly), email: req.email, fetchFn, now }));
  }
  await putDoc({ sa, path, data: { ...req, status: action === "approve" ? "approved" : "rejected", decidedAt: now }, fetchFn, now });
  return { status: action === "approve" ? "approved" : "rejected", paidUntil };
};
