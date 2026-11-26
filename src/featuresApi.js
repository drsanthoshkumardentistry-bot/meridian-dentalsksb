import { auth } from "./firebase.js";

const tokenOf = async () => { const u = auth && auth.currentUser; if (!u) throw new Error("Sign in again."); return u.getIdToken(); };
export const FEATURES = [["ai", "Meridee, the AI assistant"], ["whatsapp", "WhatsApp sending"]];

/** Which features are on. Any failure means all on, never an error on screen. */
export const loadFeatures = async ({ fetchFn = fetch, getToken = tokenOf } = {}) => {
  try {
    const res = await fetchFn("/api/features", { headers: { Authorization: `Bearer ${await getToken()}` } });
    if (!res.ok) return { ai: true, whatsapp: true };
    const d = await res.json();
    return { ai: d.ai !== false, whatsapp: d.whatsapp !== false };
  } catch { return { ai: true, whatsapp: true }; }
};

/** Founder only. */
export const saveFeature = async ({ key, on }, { fetchFn = fetch, getToken = tokenOf } = {}) => {
  const res = await fetchFn("/api/features", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getToken()}` }, body: JSON.stringify({ key, on }) });
  let d = {};
  try { d = await res.json(); } catch { /* keep empty */ }
  if (!res.ok) throw new Error(d.error || "Could not save.");
  return d;
};
