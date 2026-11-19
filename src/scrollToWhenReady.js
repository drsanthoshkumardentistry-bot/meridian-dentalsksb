// Scroll to an element that may not be on screen yet (a screen opening, a lazy section loading).
// Tries every 100 ms for up to `ms`, then gives up quietly. Returns a cancel function.
export function scrollToWhenReady(id, ms = 3000, doc = typeof document !== "undefined" ? document : null, focus = false) {
  if (!doc) return () => {};
  const t0 = Date.now();
  let timer = null;
  let stopped = false;
  const tick = () => {
    if (stopped) return;
    const el = doc.getElementById(id);
    if (el) {
      if (typeof el.scrollIntoView === "function") el.scrollIntoView({ behavior: "smooth", block: "start" });
      if (focus && typeof el.focus === "function") el.focus({ preventScroll: true });
      return;
    }
    if (Date.now() - t0 < ms) timer = setTimeout(tick, 100);
  };
  timer = setTimeout(tick, 50);
  return () => { stopped = true; if (timer) clearTimeout(timer); };
}
