// Vercel function: GET /api/admin-stats. Only for the founder(s) listed in the FOUNDER_EMAILS env var (comma separated).
// Anyone else gets 403, so the app can quietly hide the screen. Needs FIREBASE_SERVICE_ACCOUNT. No patient data is read.
import { makeLimiter } from "./_lib/aiCore.js";
import { lookupUser } from "./_lib/loginAlertCore.js";
import { readServiceAccount } from "./_lib/blockCore.js";
import { isFounder, listAllUsers, summarise } from "./_lib/adminCore.js";

const allow = makeLimiter(60, 60 * 60 * 1000);
const send = (res, status, body) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
};

export default async function handler(req, res) {
  if (req.method !== "GET") return send(res, 405, { error: "Use GET." });
  const header = String(req.headers.authorization || "");
  const user = await lookupUser(header.startsWith("Bearer ") ? header.slice(7) : "").catch(() => null);
  if (!user) return send(res, 401, { error: "Sign in again." });
  if (!isFounder(user.email)) return send(res, 403, { error: "Not available." });
  if (!allow(user.uid)) return send(res, 429, { error: "Too many requests. Try again later." });
  const sa = readServiceAccount();
  if (!sa) return send(res, 503, { error: "Add FIREBASE_SERVICE_ACCOUNT in Vercel to use this screen." });
  try {
    return send(res, 200, summarise(await listAllUsers({ sa })));
  } catch (e) {
    return send(res, 502, { error: "Could not read the sign-up list. Try again in a minute." });
  }
}
