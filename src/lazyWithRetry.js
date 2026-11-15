// A lazily loaded screen sometimes comes back empty on phones (an old page asking for a file from a previous release,
// a flaky connection, or an iPhone browser quirk). React then crashes with "Cannot read properties of undefined (reading 'default')".
// This wrapper checks what came back. If the screen did not load, it reloads the page once to fetch a fresh copy; if that
// does not help within a minute, it shows the normal error screen instead of reloading in a loop.
import { lazy } from "react";

const KEY = "merident_chunk_reload";

export const loadWithRetry = async (load, deps = {}) => {
  const now = deps.now || Date.now;
  const reload = deps.reload || (() => window.location.reload());
  const storage = deps.storage || (typeof sessionStorage !== "undefined" ? sessionStorage : null);
  try {
    const mod = await load();
    if (mod && mod.default) return mod;
    throw new Error("Screen file loaded empty");
  } catch (e) {
    let last = 0;
    try { last = Number(storage && storage.getItem(KEY)) || 0; } catch (err) { /* storage blocked */ }
    if (now() - last > 60000) {
      try { if (storage) storage.setItem(KEY, String(now())); } catch (err) { /* storage blocked */ }
      reload();
      return new Promise(() => {}); // stay on the loading screen while the page reloads
    }
    throw e;
  }
};

export const lazyWithRetry = (load) => lazy(() => loadWithRetry(load));
