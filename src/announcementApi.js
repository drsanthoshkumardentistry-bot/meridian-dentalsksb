import { auth } from "./firebase.js";

const tokenOf = async () => { const u = auth && auth.currentUser; if (!u) throw new Error("Sign in again."); return u.getIdToken(); };
const NONE = { active: false, id: "", text: "", level: "info", updatedAt: 0 };

/** The current banner for this clinic. Any failure means no banner, never an error on screen. */
export const loadAnnouncement = async ({ fetchFn = fetch, getToken = tokenOf } = {}) => {
  try {
    const res = await fetchFn("/api/announcement", { headers: { Authorization: `Bearer ${await getToken()}` } });
    if (!res.ok) return NONE;
    const d = await res.json();
    return d && d.active && typeof d.text === "string" && d.text ? { active: true, id: String(d.id || ""), text: d.text.slice(0, 240), level: ["info", "success", "warning"].includes(d.level) ? d.level : "info", updatedAt: d.updatedAt || 0 } : NONE;
  } catch { return NONE; }
};

/** Founder only. Empty text clears the banner. */
export const saveAnnouncement = async ({ text, level }, { fetchFn = fetch, getToken = tokenOf } = {}) => {
  const res = await fetchFn("/api/announcement", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getToken()}` }, body: JSON.stringify({ text, level }) });
  let d = {};
  try { d = await res.json(); } catch { /* keep empty */ }
  if (!res.ok) throw new Error(d.error || "Could not save.");
  return d;
};
