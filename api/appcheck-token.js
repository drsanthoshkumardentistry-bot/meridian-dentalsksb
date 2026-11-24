// POST /api/appcheck-token { turnstile }. Gives the real MeriDent site an App Check token after a Turnstile check.
// Needs TURNSTILE_SECRET_KEY, FIREBASE_SERVICE_ACCOUNT and APPCHECK_APP_ID (the Firebase web app id). Until they are
// set it answers 503 and the app keeps working, because App Check is only enforced once the owner switches it on.
import { makeLimiter } from "./_lib/aiCore.js";
import { visitorIp } from "./_lib/clientIp.js";
import { readServiceAccount } from "./_lib/blockCore.js";
import { verifyTurnstile, mintAppCheckToken } from "./_lib/appCheckCore.js";

const perVisitor = makeLimiter(40, 60 * 60 * 1000); // a real session asks about once an hour

const send = (res, status, obj) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(obj));
};

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Not allowed." });
  const ip = visitorIp(req.headers);
  if (!perVisitor(ip)) return send(res, 429, { error: "Too many requests." });
  const sa = readServiceAccount();
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const appId = process.env.APPCHECK_APP_ID || process.env.VITE_FIREBASE_APP_ID;
  if (!sa || !secret || !appId) return send(res, 503, { error: "Not set up." });
  if (!(await verifyTurnstile(req.body?.turnstile, secret, ip))) return send(res, 403, { error: "Check failed." });
  try {
    return send(res, 200, await mintAppCheckToken(sa, appId));
  } catch {
    return send(res, 502, { error: "Could not get a token." });
  }
}
