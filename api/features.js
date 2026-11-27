// GET /api/features: which features are on, for any signed-in clinic. POST { key, on }: founder only, recent sign-in.
import { makeLimiter } from "./_lib/aiCore.js";
import { lookupUser } from "./_lib/loginAlertCore.js";
import { readServiceAccount } from "./_lib/blockCore.js";
import { isFounder, signedInRecently, FRESH_SIGNIN_MESSAGE } from "./_lib/adminCore.js";
import { logAction } from "./_lib/auditCore.js";
import { getFeatures, setFeature, allOn } from "./_lib/featuresCore.js";

const allowRead = makeLimiter(240, 60 * 60 * 1000);
const allowWrite = makeLimiter(60, 60 * 60 * 1000);
const send = (res, status, body) => { res.statusCode = status; res.setHeader("Content-Type", "application/json"); res.setHeader("Cache-Control", "no-store"); res.end(JSON.stringify(body)); };

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") return send(res, 405, { error: "Use GET or POST." });
  const header = String(req.headers.authorization || "");
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const user = await lookupUser(token).catch(() => null);
  if (!user) return send(res, 401, { error: "Sign in again." });
  const sa = readServiceAccount();
  if (req.method === "GET") {
    if (!allowRead(user.uid)) return send(res, 429, { error: "Too many requests." });
    return send(res, 200, await getFeatures({ sa }).catch(() => allOn()));
  }
  if (!isFounder(user.email)) return send(res, 403, { error: "Not available." });
  if (!signedInRecently(token)) return send(res, 401, { error: FRESH_SIGNIN_MESSAGE });
  if (!allowWrite(user.uid)) return send(res, 429, { error: "Too many requests." });
  if (!sa) return send(res, 503, { error: "Add FIREBASE_SERVICE_ACCOUNT first." });
  let body = req.body || {};
  if (typeof body === "string") { try { body = JSON.parse(body || "{}"); } catch (e) { return send(res, 400, { error: "Bad request." }); } }
  if (!body || typeof body !== "object" || typeof body.on !== "boolean") return send(res, 400, { error: "Bad request." });
  try { const next = await setFeature({ sa, key: body.key, on: body.on }); await logAction({ sa, actor: user.email, action: "feature", target: String(body.key), detail: body.on ? "switched on" : "switched off" }); return send(res, 200, next); }
  catch (e) { return send(res, e && e.message === "key" ? 400 : 502, { error: e && e.message === "key" ? "Choose ai or whatsapp." : "Could not save. Try again in a minute." }); }
}
