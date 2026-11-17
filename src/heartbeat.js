import { auth } from "./firebase.js";

const sessionId = () => {
  const mk = () => {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  };
  try { const k = "merident.sessionId"; let v = sessionStorage.getItem(k); if (!v) { v = mk(); sessionStorage.setItem(k, v); } return v; } catch { return mk(); }
};

/**
 * Tells the site "this tab is open" every few minutes while it is visible, so the founder can see who is online and for how long.
 * It sends only the session id (the sign-in token proves who). Failures are ignored. Returns a function that stops it.
 */
export function startHeartbeat({ fetchFn = fetch, getToken, intervalMs = 5 * 60 * 1000, doc = document, id = sessionId() } = {}) {
  const token = getToken || (async () => { const u = auth && auth.currentUser; if (!u) throw new Error("no user"); return u.getIdToken(); });
  let last = 0;
  const beat = async () => {
    if (doc.visibilityState !== "visible") return;
    last = Date.now();
    try {
      await fetchFn("/api/heartbeat", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` }, body: JSON.stringify({ sessionId: id }), keepalive: true });
    } catch { /* never disturb the app */ }
  };
  const onVisible = () => { if (doc.visibilityState === "visible" && Date.now() - last >= 60 * 1000) beat(); };
  doc.addEventListener("visibilitychange", onVisible);
  beat();
  const timer = setInterval(beat, intervalMs);
  return () => { clearInterval(timer); doc.removeEventListener("visibilitychange", onVisible); };
}
