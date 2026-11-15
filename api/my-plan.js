// Vercel function: GET /api/my-plan. Tells the signed-in clinic what it has paid for. Read only.
import { makeLimiter } from "./_lib/aiCore.js";
import { lookupUser } from "./_lib/loginAlertCore.js";
import { readServiceAccount } from "./_lib/blockCore.js";
import { getPlan } from "./_lib/planCore.js";

const allow = makeLimiter(120, 60 * 60 * 1000);
const send = (res, status, body) => { res.statusCode = status; res.setHeader("Content-Type", "application/json"); res.setHeader("Cache-Control", "no-store"); res.end(JSON.stringify(body)); };

export default async function handler(req, res) {
  if (req.method !== "GET") return send(res, 405, { error: "Use GET." });
  const header = String(req.headers.authorization || "");
  const user = await lookupUser(header.startsWith("Bearer ") ? header.slice(7) : "").catch(() => null);
  if (!user) return send(res, 401, { error: "Sign in again." });
  if (!allow(user.uid)) return send(res, 429, { error: "Too many requests." });
  const sa = readServiceAccount();
  if (!sa) return send(res, 200, { plan: "", paidUntil: 0 }); // not switched on yet: treated as unpaid, and pricing is off anyway
  try { return send(res, 200, await getPlan({ sa, uid: user.uid })); } catch (e) { return send(res, 502, { error: "Could not read your plan." }); }
}
