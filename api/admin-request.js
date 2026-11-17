// POST /api/admin-request { uid, action: "approve" | "reject" }. Founder only. Approve switches the requested plan on.
import { makeLimiter } from "./_lib/aiCore.js";
import { lookupUser } from "./_lib/loginAlertCore.js";
import { readServiceAccount } from "./_lib/blockCore.js";
import { isFounder } from "./_lib/adminCore.js";
import { decideRequest } from "./_lib/requestCore.js";

const allow = makeLimiter(100, 60 * 60 * 1000);
const send = (res, status, body) => { res.statusCode = status; res.setHeader("Content-Type", "application/json"); res.setHeader("Cache-Control", "no-store"); res.end(JSON.stringify(body)); };
const MSG = { missing: [404, "That request no longer exists."], decided: [409, "That request was already decided."], action: [400, "Choose approve or reject."], uid: [400, "Bad request."] };

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Use POST." });
  const header = String(req.headers.authorization || "");
  const user = await lookupUser(header.startsWith("Bearer ") ? header.slice(7) : "").catch(() => null);
  if (!user) return send(res, 401, { error: "Sign in again." });
  if (!isFounder(user.email)) return send(res, 403, { error: "Not available." });
  if (!allow(user.uid)) return send(res, 429, { error: "Too many requests." });
  const sa = readServiceAccount();
  if (!sa) return send(res, 503, { error: "Add FIREBASE_SERVICE_ACCOUNT first." });
  let body = req.body || {};
  if (typeof body === "string") { try { body = JSON.parse(body || "{}"); } catch (e) { return send(res, 400, { error: "Bad request." }); } }
  if (!body || typeof body !== "object") return send(res, 400, { error: "Bad request." });
  try {
    return send(res, 200, await decideRequest({ sa, uid: body.uid, action: body.action }));
  } catch (e) {
    const m = MSG[e && e.message];
    return m ? send(res, m[0], { error: m[1] }) : send(res, 502, { error: "Could not save. Try again in a minute." });
  }
}
