import { initializeAppCheck, ReCaptchaV3Provider, CustomProvider } from "firebase/app-check";

// Firebase App Check proves a request comes from the real MeriDent site, not a script.
// It switches on with a free Cloudflare Turnstile site key (VITE_TURNSTILE_SITE_KEY), or the older reCAPTCHA v3 key
// (VITE_RECAPTCHA_SITE_KEY). Without a key nothing changes. Never throws.
const TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

const loadTurnstile = (doc = document, win = window) => new Promise((resolve, reject) => {
  if (win.turnstile) return resolve(win.turnstile);
  const s = doc.createElement("script");
  s.src = TURNSTILE_SRC; s.async = true;
  s.onload = () => (win.turnstile ? resolve(win.turnstile) : reject(new Error("turnstile")));
  s.onerror = () => reject(new Error("turnstile"));
  doc.head.appendChild(s);
});

/** Runs one Turnstile check in a hidden spot on the page and returns its answer. */
export const getTurnstileToken = async (siteKey, deps = {}) => {
  const doc = deps.document || document;
  const ts = await (deps.load ? deps.load() : loadTurnstile(doc, deps.window || window));
  const box = doc.createElement("div");
  box.style.cssText = "position:fixed;bottom:12px;right:12px;z-index:2147483000";
  doc.body.appendChild(box);
  try {
    return await new Promise((resolve, reject) => {
      ts.render(box, { sitekey: siteKey, appearance: "interaction-only", callback: resolve, "error-callback": () => reject(new Error("turnstile")), "timeout-callback": () => reject(new Error("turnstile")) });
    });
  } finally {
    box.remove();
  }
};

/** The App Check provider: Turnstile answer in, App Check token out. */
export const turnstileProvider = (siteKey, deps = {}) => {
  const doFetch = deps.fetch || ((...a) => fetch(...a));
  return new (deps.CustomProvider || CustomProvider)({
    getToken: async () => {
      const turnstile = await (deps.getToken || getTurnstileToken)(siteKey, deps);
      const r = await doFetch("/api/appcheck-token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ turnstile }) });
      if (!r.ok) throw new Error("appcheck");
      const data = await r.json();
      return { token: data.token, expireTimeMillis: data.expireTimeMillis };
    },
  });
};

export const startAppCheck = (app, key, turnstileKey, deps = { initializeAppCheck, ReCaptchaV3Provider, turnstileProvider }) => {
  const siteKey = typeof key === "string" ? key.trim() : "";
  const tsKey = typeof turnstileKey === "string" ? turnstileKey.trim() : "";
  if (!app || (!siteKey && !tsKey)) return false;
  try {
    const provider = tsKey ? (deps.turnstileProvider || turnstileProvider)(tsKey) : new deps.ReCaptchaV3Provider(siteKey);
    deps.initializeAppCheck(app, { provider, isTokenAutoRefreshEnabled: true });
    return true;
  } catch {
    return false; // already started, or the browser blocks it: the app keeps working
  }
};
