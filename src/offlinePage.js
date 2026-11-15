// Registers the tiny service worker that shows /offline.html when a page cannot load offline. Production web only.
export const registerOfflinePage = (nav = typeof navigator !== "undefined" ? navigator : null, prod = import.meta.env && import.meta.env.PROD, win = typeof window !== "undefined" ? window : null) => {
  try {
    if (!prod || !nav || !nav.serviceWorker || !win) return false;
    if (win.Capacitor && win.Capacitor.isNativePlatform && win.Capacitor.isNativePlatform()) return false;
    win.addEventListener("load", () => { nav.serviceWorker.register("/sw.js").catch(() => {}); });
    return true;
  } catch (e) { return false; }
};
