// Vercel function: POST /api/admin-plan { email, plan: "standard"|"pro"|"scale", days }. Founder only (FOUNDER_EMAILS).
// Marks a clinic as paid for that many more days. Paying again before expiry adds to the time left.
import { makeLimiter } from "./_lib/aiCore.js";
import { lookupUser } from "./_lib/loginAlertCore.js";
import { readServiceAccount } from "./_lib/blockCore.js";
import { isFounder, signedInRecently, FRESH_SIGNIN_MESSAGE } from "./_lib/adminCore.js";
import { setPlan, uidByEmail } from "./_lib/planCore.js";

const allow = makeLimiter(100, 60 * 60 * 1000);
const send = (res, status, body) => { res.statusCode = status; res.setHeader("Content-Type", "application/json"); res.setHeader("Cache-Control", "no-store"); res.end(JSON.stringify(body)); };

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Use POST." });
  const header = String(req.headers.authorization || "");
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const user = await lookupUser(token).catch(() => null);
  if (!user) return send(res, 401, { error: "Sign in again." });
  if (!isFounder(user.email)) return send(res, 403, { error: "Not available." });
  if (!signedInRecently(token)) return send(res, 401, { error: FRESH_SIGNIN_MESSAGE });
  if (!allow(user.uid)) return send(res, 429, { error: "Too many requests." });
  const sa = readServiceAccount();
  if (!sa) return send(res, 503, { error: "Add FIREBASE_SERVICE_ACCOUNT in Vercel first." });
  let body = req.body || {};
  if (typeof body === "string") { try { body = JSON.parse(body || "{}"); } catch (e) { return send(res, 400, { error: "Bad request." }); } }
  if (!body || typeof body !== "object") return send(res, 400, { error: "Bad request." });
  try {
    const uid = await uidByEmail({ sa, email: body.email });
    if (!uid) return send(res, 404, { error: "No clinic account with that email." });
    const r = await setPlan({ sa, uid, plan: body.plan, days: body.days, email: String(body.email).toLowerCase() });
    return send(res, 200, r);
  } catch (e) {
    if (e && (e.message === "plan" || e.message === "days")) return send(res, 400, { error: e.message === "plan" ? "Choose Starter, Growth or Scale." : "Days must be 1 to 800." });
    return send(res, 502, { error: "Could not save. Try again in a minute." });
  }
}
