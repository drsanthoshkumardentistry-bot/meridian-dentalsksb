// Sends a small, scrubbed report to the MeriDent owner when the app crashes, so problems are known before clinics call.
// Never includes patient data: personal-looking text (emails, phone and ID numbers, long digit runs, tokens, URL
// queries) is removed, only the page path is kept, and at most a few reports are sent per visit.
export const MAX_PER_VISIT = 5;
const NOISE = [
  /ResizeObserver loop/i,
  /^Script error\.?$/i,
  /Loading chunk .* failed|Failed to fetch dynamically imported module|Importing a module script failed/i, // stale tab after an update; the app reloads itself
  /network ?error|failed to fetch|load failed|networkerror|the operation was aborted/i, // flaky connection, not a bug
  /chrome-extension:|moz-extension:|safari-extension:/i,
  /ServiceWorker|Non-Error promise rejection captured/i,
];

export const scrub = (text, max = 1500) =>
  String(text == null ? "" : text)
    .slice(0, max * 3) // cut first: the e-mail pattern is quadratic on very long text
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, "[email]")
    .replace(/\bBearer\s+[\w.~+/=-]+/gi, "Bearer [token]")
    .replace(/\beyJ[\w-]{10,}\.[\w-]{10,}\.[\w-]{5,}\b/g, "[token]")
    .replace(/\b(?:\+?91[- ]?)?[6-9]\d{9}\b/g, "[phone]")
    .replace(/\d{6,}/g, "[number]")
    .replace(/\?[^\s)'"]*/g, "?[query]")
    .slice(0, max);

export const isNoise = (message) => NOISE.some((re) => re.test(String(message || "")));

export const buildReport = (error, source, loc = {}, ua = "") => {
  const e = error && typeof error === "object" ? error : { message: String(error || "") };
  const message = scrub(e.message || String(error || "Unknown error"), 300);
  return {
    name: scrub(e.name || "Error", 40),
    message,
    stack: scrub(e.stack || "", 1500),
    source: scrub(source || "error", 30),
    path: scrub(String(loc.pathname || "/"), 80),
    ua: scrub(ua, 120),
  };
};

export const createReporter = ({ send, max = MAX_PER_VISIT } = {}) => {
  const seen = new Set();
  let count = 0;
  return (error, source = "error", loc = {}, ua = "") => {
    try {
      const raw = error && typeof error === "object" ? error.message : error;
      if (isNoise(raw)) return false;
      const r = buildReport(error, source, loc, ua);
      const key = r.name + "|" + r.message;
      if (seen.has(key) || count >= max) return false;
      seen.add(key); count += 1;
      send(r);
      return true;
    } catch { return false; }
  };
};

const post = (report) => {
  try {
    fetch("/api/client-error", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(report), keepalive: true }).catch(() => {});
  } catch { /* reporting must never break the app */ }
};

let reporter = null;
export const reportError = (error, source) => {
  if (!reporter) return false;
  const w = typeof window !== "undefined" ? window : {};
  return reporter(error, source, w.location || {}, (w.navigator && w.navigator.userAgent) || "");
};

export const installErrorReporting = (win = typeof window !== "undefined" ? window : null, send = post) => {
  if (!win || reporter) return false;
  reporter = createReporter({ send });
  win.addEventListener("error", (ev) => reportError(ev.error || ev.message, "window"));
  win.addEventListener("unhandledrejection", (ev) => reportError(ev.reason, "promise"));
  return true;
};
