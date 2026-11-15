// Verified payment links. The clinic asks the server once for a "seal" over its name + UPI ID and keeps it on the
// device; every pay link then carries it, and the patient's page checks it (see payLink.js, PayPage.jsx).
import { auth } from "./firebase.js";

const KEY = "merident_payseal";
const idOf = (vpa, name) => `${String(vpa || "").trim().toLowerCase()}|${String(name || "").trim().slice(0, 60)}`;

/** The saved seal for exactly this UPI ID and name, or null (older or changed details have no seal). */
export const readSeal = (vpa, name) => {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "null");
    return s && s.id === idOf(vpa, name) && typeof s.u === "string" && /^[0-9a-f]{64}$/.test(s.ks) ? { u: s.u, ks: s.ks } : null;
  } catch (e) { return null; }
};

/** Asks the server for the seal when we do not have it. Never throws; links just stay unsealed if it cannot. */
export const ensureSeal = async (vpa, name) => {
  try {
    if (!vpa || !String(name || "").trim() || readSeal(vpa, name)) return readSeal(vpa, name);
    const user = auth && auth.currentUser;
    if (!user) return null;
    const res = await fetch("/api/pay-seal", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` },
      body: JSON.stringify({ vpa: String(vpa).trim(), name: String(name).trim() }),
    });
    if (!res.ok || res.status === 204) return null;
    const d = await res.json();
    if (typeof d.u !== "string" || !/^[0-9a-f]{64}$/.test(d.ks)) return null;
    try { localStorage.setItem(KEY, JSON.stringify({ id: idOf(vpa, name), u: d.u, ks: d.ks })); } catch (e) { /* storage full: next time */ }
    return { u: d.u, ks: d.ks };
  } catch (e) { return null; }
};

/** Patient side: "ok" (genuine), "bad" (changed or not genuine), "unknown" (could not check). */
export const checkPayLink = async (req, fetchFn = fetch, timeoutMs = 5000) => {
  if (!req || !req.ks) return "unsigned";
  try {
    const q = new URLSearchParams({ u: req.u || "", pa: req.vpa, pn: req.name || "", ks: req.ks });
    const ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = setTimeout(() => ctl && ctl.abort(), timeoutMs);
    const res = await fetchFn(`/api/pay-verify?${q.toString()}`, ctl ? { signal: ctl.signal } : undefined);
    clearTimeout(timer);
    if (!res.ok) return "unknown";
    const d = await res.json();
    if (d && d.configured === false) return "unknown";
    return d && d.ok === true ? "ok" : "bad";
  } catch (e) { return "unknown"; }
};
