// Is there any sign that this browser has (or is finishing) a MeriDent sign-in? Answered without loading Firebase.
// Only a clear "no" lets a first-time visitor see the landing page without downloading the whole clinic app.
// Anything unclear counts as "yes", so a signed-in clinic always goes straight to the app.
const readAuthKeys = () => new Promise((resolve) => {
  try {
    const idb = typeof indexedDB !== "undefined" ? indexedDB : null;
    if (!idb) return resolve(null);
    const req = idb.open("firebaseLocalStorageDb");
    req.onerror = () => resolve(null);
    req.onupgradeneeded = () => { try { req.transaction.abort(); } catch (e) { /* no database yet */ } resolve([]); };
    req.onsuccess = () => {
      try {
        const db = req.result;
        if (!db.objectStoreNames.contains("firebaseLocalStorage")) { db.close(); return resolve([]); }
        const keys = db.transaction("firebaseLocalStorage", "readonly").objectStore("firebaseLocalStorage").getAllKeys();
        keys.onsuccess = () => { db.close(); resolve(keys.result.map(String)); };
        keys.onerror = () => { db.close(); resolve(null); };
      } catch (e) { resolve(null); }
    };
  } catch (e) { resolve(null); }
});

export const hasSavedSession = async ({ read = readAuthKeys, session = typeof sessionStorage !== "undefined" ? sessionStorage : null, local = typeof localStorage !== "undefined" ? localStorage : null } = {}) => {
  try {
    // A Google sign-in that used a full-page redirect is about to finish on this very page load.
    if (session) for (let i = 0; i < session.length; i++) { if (String(session.key(i)).startsWith("firebase:pendingRedirect")) return true; }
    if (local) for (let i = 0; i < local.length; i++) { if (String(local.key(i)).startsWith("firebase:authUser")) return true; }
    const keys = await read();
    if (keys === null || keys === undefined) return true; // could not tell
    return keys.some((k) => k.startsWith("firebase:authUser"));
  } catch (e) { return true; }
};
