// POST /api/csp-report. Browsers send a note here when a page loads something the report-only security policy would
// block. Each note goes to the server log (trimmed), so the policy can be tightened without breaking the app.
// Public on purpose (browsers send it without sign-in), so it is rate-limited and keeps nothing but short text.
import { makeLimiter } from "./_lib/aiCore.js";
import { visitorIp } from "./_lib/clientIp.js";

const perVisitor = makeLimiter(30, 60 * 60 * 1000);
const done = (res, status = 204) => { res.statusCode = status; res.setHeader("Cache-Control", "no-store"); res.end(); };
const short = (v) => String(v == null ? "" : v).replace(/[\r\n\t]+/g, " ").slice(0, 200);

export const sanitizeCspReport = (body) => {
  const r = body && typeof body === "object" ? body["csp-report"] : null;
  if (!r || typeof r !== "object") return null;
  const out = {};
  for (const k of ["document-uri", "blocked-uri", "violated-directive", "effective-directive", "source-file", "line-number", "disposition"]) {
    if (r[k] !== undefined) out[k] = short(r[k]);
  }
  // A page address can carry a private link token (?plan=, ?portal=): never log the query string or fragment.
  for (const k of ["document-uri", "blocked-uri", "source-file"]) if (out[k]) out[k] = out[k].split(/[?#]/)[0];
  return Object.keys(out).length ? out : null;
};

export default async function handler(req, res) {
  if (req.method !== "POST") return done(res, 405);
  if (!perVisitor(visitorIp(req.headers))) return done(res, 429);
  const report = sanitizeCspReport(req.body);
  if (!report) return done(res, 400);
  console.warn("csp-violation", JSON.stringify(report));
  return done(res);
}
