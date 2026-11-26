import { auth } from "./firebase.js";

const tokenOf = async () => { const u = auth && auth.currentUser; if (!u) throw new Error("Sign in again."); return u.getIdToken(); };

/** Founder dashboard data. Returns null when this account is not a founder (or the screen is not switched on). */
export const loadOverview = async ({ fetchFn = fetch, getToken = tokenOf, onStatus } = {}) => {
  const res = await fetchFn("/api/admin-overview", { headers: { Authorization: `Bearer ${await getToken()}` } });
  let d = {};
  try { d = await res.json(); } catch { /* keep empty */ }
  if (typeof onStatus === "function") onStatus(res.status, d && d.error);
  if (res.status === 403 || res.status === 401 || res.status === 404) return null;
  if (!res.ok) throw new Error(d.error || "Could not load the dashboard.");
  return d;
};

/** Founder only: approve or reject one clinic's subscription request. */
export const decideRequest = async ({ uid, action }, { fetchFn = fetch, getToken = tokenOf } = {}) => {
  const res = await fetchFn("/api/admin-request", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getToken()}` }, body: JSON.stringify({ uid, action }) });
  let d = {};
  try { d = await res.json(); } catch { /* keep empty */ }
  if (!res.ok) throw new Error(d.error || "Could not save.");
  return d;
};
