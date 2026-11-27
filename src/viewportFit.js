// Keeps the app exactly as tall as the visible screen. Some Android WebViews leave 100vh stale after the keyboard closes,
// which shows as an empty band under the page. We measure the real height and re-measure whenever it can have changed.
export function measureAppHeight(win = window) {
  const vv = win.visualViewport;
  const h = Math.max(win.innerHeight || 0, vv ? Math.round(vv.height + (vv.offsetTop || 0)) : 0);
  return h > 0 ? h : 0;
}

export function installViewportFit(win = window, doc = document) {
  const apply = () => {
    const h = measureAppHeight(win);
    if (h) doc.documentElement.style.setProperty("--app-h", `${h}px`);
  };
  const later = () => { apply(); win.setTimeout(apply, 350); };
  apply();
  win.addEventListener("resize", apply);
  win.addEventListener("orientationchange", later);
  doc.addEventListener("focusout", later);
  doc.addEventListener("visibilitychange", apply);
  if (win.visualViewport) win.visualViewport.addEventListener("resize", apply);
  return () => {
    win.removeEventListener("resize", apply);
    win.removeEventListener("orientationchange", later);
    doc.removeEventListener("focusout", later);
    doc.removeEventListener("visibilitychange", apply);
    if (win.visualViewport) win.visualViewport.removeEventListener("resize", apply);
  };
}
