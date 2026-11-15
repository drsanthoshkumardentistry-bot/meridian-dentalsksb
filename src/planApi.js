import { auth } from "./firebase.js";

const tokenOf = async () => { const u = auth && auth.currentUser; if (!u) throw new Error("Sign in again."); return u.getIdToken(); };

/** What this clinic has paid for: { plan, paidUntil } (empty when nothing). Never throws; unknown means unpaid. */
export const loadMyPlan = async ({ fetchFn = fetch, getToken = tokenOf } = {}) => {
  try {
    const res = await fetchFn("/api/my-plan", { headers: { Authorization: `Bearer ${await getToken()}` } });
    if (!res.ok) return { plan: "", paidUntil: 0 };
    const d = await res.json();
    return { plan: d.plan === "pro" || d.plan === "standard" ? d.plan : "", paidUntil: Number(d.paidUntil) || 0 };
  } catch (e) { return { plan: "", paidUntil: 0 }; }
};

/** Founder only: mark a clinic paid for `days` more days. */
export const markPaid = async ({ email, plan, days }, { fetchFn = fetch, getToken = tokenOf } = {}) => {
  const res = await fetchFn("/api/admin-plan", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getToken()}` }, body: JSON.stringify({ email, plan, days }) });
  let d = {}; try { d = await res.json(); } catch (e) { /* keep empty */ }
  if (!res.ok) throw new Error(d.error || "Could not save.");
  return d;
};
