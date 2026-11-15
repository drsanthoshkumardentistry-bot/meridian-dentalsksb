import { auth } from "./firebase.js";

/** Founder-only numbers. Returns null when this account is not a founder (or the screen is not switched on). */
export const loadAdminStats = async ({ fetchFn = fetch, getToken } = {}) => {
  const token = getToken || (async () => { const u = auth && auth.currentUser; if (!u) throw new Error("Sign in again."); return u.getIdToken(); });
  const res = await fetchFn("/api/admin-stats", { headers: { Authorization: `Bearer ${await token()}` } });
  if (res.status === 403 || res.status === 401 || res.status === 404) return null;
  let data = {};
  try { data = await res.json(); } catch (e) { /* keep empty */ }
  if (!res.ok) throw new Error(data.error || "Could not load the numbers.");
  return data;
};
