import { auth } from "./firebase.js";

const tokenOf = async () => { const u = auth && auth.currentUser; if (!u) throw new Error("Sign in again."); return u.getIdToken(); };

/** What this clinic has paid for: { plan, paidUntil } (empty when nothing). Never throws. `failed: true` means we could not find out, which must never be treated as unpaid. */
export const loadMyPlan = async ({ fetchFn = fetch, getToken = tokenOf } = {}) => {
  try {
    const res = await fetchFn("/api/my-plan", { headers: { Authorization: `Bearer ${await getToken()}` } });
    if (!res.ok) return { plan: "", paidUntil: 0, failed: true };
    const d = await res.json();
    const out = { plan: ["standard", "pro", "scale"].includes(d.plan) ? d.plan : "", paidUntil: Number(d.paidUntil) || 0 };
    return Number(d.pausedRemaining) > 0 ? { ...out, paused: true, pausedRemaining: Number(d.pausedRemaining) } : out;
  } catch (e) { return { plan: "", paidUntil: 0, failed: true }; }
};

/** Founder only: mark a clinic paid for `days` more days. */
export const markPaid = async ({ email, plan, days }, { fetchFn = fetch, getToken = tokenOf } = {}) => {
  const res = await fetchFn("/api/admin-plan", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getToken()}` }, body: JSON.stringify({ email, plan, days }) });
  let d = {}; try { d = await res.json(); } catch (e) { /* keep empty */ }
  if (!res.ok) throw new Error(d.error || "Could not save.");
  return d;
};

/** Ask for a plan. The founder approves it once payment has arrived. */
export const requestPlan = async ({ plan, yearly = false, clinic = "" }, { fetchFn = fetch, getToken = tokenOf } = {}) => {
  const res = await fetchFn("/api/plan-request", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getToken()}` }, body: JSON.stringify({ plan, yearly, clinic }) });
  let d = {}; try { d = await res.json(); } catch (e) { /* keep empty */ }
  if (!res.ok) throw new Error(d.error || "Could not send the request.");
  return d;
};

/** The state of this clinic's own request: { status: "" | "pending" | "approved" | "rejected" }. Never throws. */
export const loadMyRequest = async ({ fetchFn = fetch, getToken = tokenOf } = {}) => {
  try {
    const res = await fetchFn("/api/plan-request", { headers: { Authorization: `Bearer ${await getToken()}` } });
    if (!res.ok) return { status: "" };
    const d = await res.json();
    return { status: ["pending", "approved", "rejected"].includes(d.status) ? d.status : "", plan: ["standard", "pro", "scale"].includes(d.plan) ? d.plan : "" };
  } catch (e) { return { status: "" }; }
};
