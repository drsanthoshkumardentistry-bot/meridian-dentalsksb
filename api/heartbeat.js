// POST /api/heartbeat { sessionId }: "this clinic's tab is open". Counts online time. Stores only the sign-in email and times.
import { makeLimiter } from "./_lib/aiCore.js";
import { lookupUser } from "./_lib/loginAlertCore.js";
import { readServiceAccount } from "./_lib/blockCore.js";
import { recordBeat } from "./_lib/presenceCore.js";

const allow = makeLimiter(40, 60 * 60 * 1000);
const send = (res, status, body) => { res.statusCode = status; res.setHeader("Content-Type", "application/json"); res.setHeader("Cache-Control", "no-store"); res.end(body === undefined ? "" : JSON.stringify(body)); };

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Use POST." });
  const header = String(req.headers.authorization || "");
  const user = await lookupUser(header.startsWith("Bearer ") ? header.slice(7) : "").catch(() => null);
  if (!user) return send(res, 401, { error: "Sign in again." });
  if (!allow(user.uid)) return send(res, 429, { error: "Too many requests." });
  const sa = readServiceAccount();
  if (!sa) return send(res, 204);
  let body = req.body || {};
  if (typeof body === "string") { try { body = JSON.parse(body || "{}"); } catch (e) { return send(res, 400, { error: "Bad request." }); } }
  try {
    await recordBeat({ sa, uid: user.uid, email: user.email, sessionId: body && body.sessionId });
    return send(res, 204);
  } catch (e) {
    return send(res, e && (e.message === "session" || e.message === "uid") ? 400 : 502, { error: "Not recorded." });
  }
}
