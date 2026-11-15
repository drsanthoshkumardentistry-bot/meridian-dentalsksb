// Checks and cleans an error report sent by the app, and writes the owner's email. No patient data is kept.
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clean = (v, max) =>
  String(v == null ? "" : v)
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, "[email]")
    .replace(/\bBearer\s+[\w.~+/=-]+/gi, "Bearer [token]")
    .replace(/\d{6,}/g, "[number]")
    .slice(0, max);

export const sanitizeReport = (body) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const message = clean(body.message, 300);
  if (!message) return null;
  return {
    name: clean(body.name || "Error", 40),
    message,
    stack: clean(body.stack, 1500),
    source: clean(body.source || "error", 30),
    path: clean(body.path || "/", 80),
    ua: clean(body.ua, 120),
  };
};

export const buildErrorEmail = (r, when = "") => {
  const subject = `MeriDent error: ${r.name}: ${r.message}`.slice(0, 140);
  const text = `${r.name}: ${r.message}\nPage: ${r.path}\nFrom: ${r.source}\nDevice: ${r.ua}\n${when ? `Time: ${when}\n` : ""}\n${r.stack}\n`;
  const html = `<p><b>${esc(r.name)}: ${esc(r.message)}</b></p><p>Page: ${esc(r.path)}<br>From: ${esc(r.source)}<br>Device: ${esc(r.ua)}${when ? `<br>Time: ${esc(when)}` : ""}</p><pre style="white-space:pre-wrap;font-size:12px">${esc(r.stack)}</pre>`;
  return { subject, text, html };
};
