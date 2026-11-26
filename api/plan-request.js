// GET /api/plan-request: the signed-in clinic's own request status. POST { plan, yearly, clinic }: ask for a plan (founder approves).
import { makeLimiter } from "./_lib/aiCore.js";
import { lookupUser } from "./_lib/loginAlertCore.js";
import { readServiceAccount } from "./_lib/blockCore.js";
import { createRequest, getRequest } from "./_lib/requestCore.js";

const allow = makeLimiter(30, 60 * 60 * 1000);
const send = (res, status, body) => { res.statusCode = status; res.setHeader("Content-Type", "application/json"); res.setHeader("Cache-Control", "no-store"); res.end(JSON.stringify(body)); };

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") return send(res, 405, { error: "Use GET or POST." });
  const header = String(req.headers.authorization || "");
  const user = await lookupUser(header.startsWith("Bearer ") ? header.slice(7) : "").catch(() => null);
  if (!user) return send(res, 401, { error: "Sign in again." });
  if (!allow(user.uid)) return send(res, 429, { error: "Too many requests." });
  const sa = readServiceAccount();
  if (!sa) return send(res, req.method === "GET" ? 200 : 503, req.method === "GET" ? { status: "" } : { error: "Requests are not switched on yet. Use WhatsApp." });
  try {
    if (req.method === "GET") return send(res, 200, await getRequest({ sa, uid: user.uid }));
    let body = req.body || {};
    if (typeof body === "string") { try { body = JSON.parse(body || "{}"); } catch (e) { return send(res, 400, { error: "Bad request." }); } }
    if (!body || typeof body !== "object") return send(res, 400, { error: "Bad request." });
    return send(res, 200, await createRequest({ sa, uid: user.uid, email: user.email, plan: body.plan, yearly: body.yearly === true, clinic: body.clinic }));
  } catch (e) {
    if (e && e.message === "plan") return send(res, 400, { error: "Choose Starter, Growth or Scale." });
    return send(res, 502, { error: "Could not save. Try again in a minute." });
  }
}
