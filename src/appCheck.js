import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// Firebase App Check proves a request comes from the real MeriDent site, not a script. It switches on only when the
// free reCAPTCHA v3 site key is set in VITE_RECAPTCHA_SITE_KEY. Without the key nothing changes. Never throws.
export const startAppCheck = (app, key, deps = { initializeAppCheck, ReCaptchaV3Provider }) => {
  const siteKey = typeof key === "string" ? key.trim() : "";
  if (!app || !siteKey) return false;
  try {
    deps.initializeAppCheck(app, { provider: new deps.ReCaptchaV3Provider(siteKey), isTokenAutoRefreshEnabled: true });
    return true;
  } catch {
    return false; // already started, or the browser blocks it: the app keeps working
  }
};
