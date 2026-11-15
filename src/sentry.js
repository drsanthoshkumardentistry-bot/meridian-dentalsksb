import { scrub } from "./errorReport.js";

// Optional Sentry error dashboard. Off unless VITE_SENTRY_DSN is set. The SDK is loaded only then, after the page is up,
// so clinics without it download nothing extra. Personal-looking text is removed before anything leaves the device.
export const scrubEvent = (event) => {
  if (!event || typeof event !== "object") return null;
  const e = { ...event };
  delete e.user; delete e.breadcrumbs; delete e.contexts; delete e.extra;
  if (e.message) e.message = scrub(e.message, 300);
  if (e.request) e.request = { url: scrub(String(e.request.url || "").split("?")[0], 120) };
  if (e.exception && Array.isArray(e.exception.values)) {
    e.exception = { values: e.exception.values.map((v) => ({ ...v, value: scrub(v && v.value, 300) })) };
  }
  return e;
};

export const startSentry = async (dsn, load = () => import("@sentry/browser")) => {
  const key = typeof dsn === "string" ? dsn.trim() : "";
  if (!key) return false;
  try {
    const Sentry = await load();
    Sentry.init({
      dsn: key,
      environment: "production",
      sendDefaultPii: false,
      tracesSampleRate: 0,
      maxBreadcrumbs: 0,
      beforeSend: scrubEvent,
      integrations: (defaults) => defaults.filter((i) => i.name !== "Breadcrumbs"),
    });
    return true;
  } catch {
    return false; // blocked or failed to load: the app keeps working
  }
};
