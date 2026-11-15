import { auth } from "./firebase.js";

/** Asks the server to delete this clinic's account and data, round after round until it says done. */
export const requestDeleteCode = async ({ fetchFn = fetch, getToken } = {}) => {
  const token = getToken || (async () => { const u = auth && auth.currentUser; if (!u) throw new Error("Sign in again."); return u.getIdToken(true); });
  const res = await fetchFn("/api/delete-account", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` }, body: JSON.stringify({ confirm: "DELETE", step: "request" }) });
  let data = {}; try { data = await res.json(); } catch (e) { /* keep empty */ }
  if (!res.ok) { const err = new Error(data.error || "Could not send the code."); err.code = data.code || ""; throw err; }
  return { ticket: data.ticket, to: data.to || "your email" };
};

export const deleteMyAccount = async ({ onProgress, fetchFn = fetch, getToken, code = "", ticket = "" } = {}) => {
  const token = getToken || (async () => { const u = auth && auth.currentUser; if (!u) throw new Error("Sign in again."); return u.getIdToken(true); });
  for (let round = 1; round <= 60; round++) {
    const res = await fetchFn("/api/delete-account", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
      body: JSON.stringify({ confirm: "DELETE", code, ticket }),
    });
    let data = {};
    try { data = await res.json(); } catch (e) { /* keep empty */ }
    if (!res.ok) { const err = new Error(data.error || "Could not delete the account."); err.code = data.code || ""; throw err; }
    if (onProgress) onProgress(round);
    if (data.done) return true;
  }
  throw new Error("This is taking longer than expected. Try again in a minute; nothing is lost by retrying.");
};

/** Removes everything MeriDent keeps on this device. */
export const clearLocalData = (storage = globalThis.localStorage) => {
  try { for (const k of Object.keys(storage)) if (k.startsWith("merident")) storage.removeItem(k); } catch (e) { /* ignore */ }
};
