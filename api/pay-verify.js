// Vercel function: GET /api/pay-verify?u=&pa=&pn=&ks=. Public. Tells the patient's pay page whether the clinic's
// name and UPI ID in the link are the ones the clinic sealed. Reveals nothing else.
import { visitorIp } from "./_lib/clientIp.js";
import { makeLimiter } from "./_lib/aiCore.js";
import { readServiceAccount } from "./_lib/blockCore.js";
import { verifySeal } from "./_lib/payCore.js";

const allow = makeLimiter(120, 60 * 1000);

const send = (res, status, body) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
};

export default async function handler(req, res) {
  if (req.method !== "GET") return send(res, 405, { error: "Use GET." });
  const ip = visitorIp(req.headers);
  if (!allow(ip)) return send(res, 429, { ok: false, error: "Too many requests." });
  const sa = readServiceAccount();
  if (!sa) return send(res, 200, { ok: false, configured: false });
  let p = {};
  try { p = Object.fromEntries(new URL(req.url || "", "https://x.invalid").searchParams); } catch (e) { p = {}; }
  return send(res, 200, { ok: verifySeal(sa, p), configured: true });
}
