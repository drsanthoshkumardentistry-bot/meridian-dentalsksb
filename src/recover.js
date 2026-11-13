// Recovery from a stale page after a new release (pure helpers). When MeriDent is updated, a tab that was left open
// can ask for a file that no longer exists. Reloading once fetches the new version.
const KEY = "merident_autoreload_at";

export const isChunkError = (error) => {
  const msg = String((error && (error.message || error)) || "");
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError|Loading chunk [\w-]+ failed|Unable to preload CSS/i.test(msg);
};

/** True at most once per window, so a real outage cannot cause a reload loop. Records the time when it says yes. */
export const shouldAutoReload = (storage = globalThis.sessionStorage, now = Date.now(), windowMs = 60000) => {
  try {
    const last = Number(storage.getItem(KEY) || 0);
    if (last && now - last < windowMs) return false;
    storage.setItem(KEY, String(now));
    return true;
  } catch {
    return false;
  }
};

/** A short code to quote to support. Technical type only, never patient data. */
export const crashCode = (error, now = new Date()) => {
  const kind = String((error && error.name) || "Error").replace(/[^A-Za-z]/g, "").slice(0, 16) || "Error";
  const d = now.toISOString().slice(0, 16).replace(/[-:T]/g, "");
  return `${kind}-${d}`;
};
