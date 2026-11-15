// Vercel function: POST /api/pay-seal. Gives a signed-in clinic the seal for its payment details, so patients' pay
// links can be checked. Needs FIREBASE_SERVICE_ACCOUNT (server only); without it, answers 204 and links stay unsealed.
import { makeLimiter } from "./_lib/aiCore.js";
import { lookupUser } from "./_lib/loginAlertCore.js";
import { readServiceAccount } from "./_lib/blockCore.js";
import { checkAccess } from "./_lib/gateCore.js";
import { signSeal, UPI_RE, cleanName } from "./_lib/payCore.js";

const DAY = 24 * 60 * 60 * 1000;
const allow = makeLimiter(30, DAY); // a login changes its payment details only now and then

const send = (res, status, body) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(body === undefined ? "" : JSON.stringify(body));
};

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Use POST." });
  const sa = readServiceAccount();
  if (!sa) return send(res, 204);
  const header = String(req.headers.authorization || "");
  const user = await lookupUser(header.startsWith("Bearer ") ? header.slice(7) : "").catch(() => null);
  if (!user) return send(res, 401, { error: "Sign in again." });
  let body = req.body || {};
  if (typeof body === "string") { try { body = JSON.parse(body || "{}"); } catch (e) { return send(res, 400, { error: "Bad request." }); } }
  if (!body || typeof body !== "object" || Array.isArray(body)) return send(res, 400, { error: "Bad request." });
  const vpa = typeof body.vpa === "string" ? body.vpa.trim() : "";
  const name = typeof body.name === "string" ? cleanName(body.name) : "";
  if (!UPI_RE.test(vpa) || !name) return send(res, 400, { error: "Add the clinic name and a valid UPI ID first." });
  const gate = await checkAccess({ user, sa, minAgeMs: 0 });
  if (!gate.ok) return send(res, gate.status, { error: gate.error });
  if (!allow(user.uid)) return send(res, 429, { error: "Too many requests. Try again tomorrow." });
  return send(res, 200, { u: user.uid, ks: signSeal(sa, user.uid, vpa, name) });
}
