// Vercel function: POST /api/delete-account { confirm: "DELETE" }. Deletes the signed-in clinic's account and all its
// data. Needs FIREBASE_SERVICE_ACCOUNT. The person must have signed in within the last 10 minutes, so a stolen
// open session cannot wipe a clinic. Answers { done: false } when it needs another round.
import { makeLimiter } from "./_lib/aiCore.js";
import { lookupUser } from "./_lib/loginAlertCore.js";
import { readServiceAccount } from "./_lib/blockCore.js";
import { eraseClinic } from "./_lib/eraseCore.js";

export const RECENT_MS = 10 * 60 * 1000;
const allow = makeLimiter(60, 24 * 60 * 60 * 1000); // many rounds are normal for a big clinic; this stops abuse

const send = (res, status, body) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
};

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Use POST." });
  const sa = readServiceAccount();
  if (!sa) return send(res, 503, { error: "Account deletion is not switched on for this site yet." });
  const header = String(req.headers.authorization || "");
  const user = await lookupUser(header.startsWith("Bearer ") ? header.slice(7) : "").catch(() => null);
  if (!user) return send(res, 401, { error: "Sign in again." });
  let body = req.body || {};
  if (typeof body === "string") { try { body = JSON.parse(body || "{}"); } catch (e) { return send(res, 400, { error: "Bad request." }); } }
  if (!body || typeof body !== "object" || body.confirm !== "DELETE") return send(res, 400, { error: "Type DELETE to confirm." });
  if (!user.lastLoginAt || Date.now() - user.lastLoginAt > RECENT_MS) {
    return send(res, 403, { error: "For safety, sign out and sign in again, then delete within 10 minutes.", code: "recent-login" });
  }
  if (!allow(user.uid)) return send(res, 429, { error: "Too many attempts. Try again tomorrow." });
  try {
    const r = await eraseClinic({ sa, uid: user.uid });
    return send(res, 200, { done: r.done });
  } catch (e) {
    return send(res, 502, { error: "Could not finish deleting. Try again in a minute; nothing is lost by retrying." });
  }
}
