import { useEffect, useState } from "react";

export const APK_URL = "https://github.com/drsanthoshkumardentistry-bot/meridian-dentalsksb/releases/download/android-latest/MeriDent.apk";

/** "ios", "android" or "desktop", from the user agent. */
export function detectPlatform(ua = typeof navigator !== "undefined" ? navigator.userAgent || "" : "") {
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

/** True when MeriDent is already running as an installed app (home-screen app or the Android wrapper). */
export function isInstalledApp() {
  try {
    if (typeof window === "undefined") return false;
    if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) return true;
    if (window.navigator && window.navigator.standalone === true) return true;
    if (window.Capacitor && typeof window.Capacitor.isNativePlatform === "function" && window.Capacitor.isNativePlatform()) return true;
  } catch { /* treat as not installed */ }
  return false;
}

/** Short instructions for adding the app from the browser when no install prompt is available. */
export function manualSteps(platform) {
  if (platform === "ios") return "Tap the Share button in Safari, then choose Add to Home Screen.";
  if (platform === "android") return "Open the browser menu (three dots), then choose Install app or Add to Home screen.";
  return "In Chrome or Edge, click the install icon at the right end of the address bar.";
}

/**
 * Captures the browser's install prompt (Chrome, Edge and Android browsers fire it; Safari does not).
 * Returns { canPrompt, install, installed }.
 */
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(() => isInstalledApp());
  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setDeferred(e); };
    const onInstalled = () => { setDeferred(null); setInstalled(true); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);
  const install = async () => {
    if (!deferred) return false;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      setDeferred(null);
      return choice && choice.outcome === "accepted";
    } catch { setDeferred(null); return false; }
  };
  return { canPrompt: !!deferred, install, installed };
}
