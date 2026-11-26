// Cloudflare/Vercel function: GET /api/admin-overview. Founder only (FOUNDER_EMAILS). Everyone else gets 403 so the app hides it.
// Reads sign-in accounts, presence, plans and subscription requests. No patient or clinic records.
import { makeLimiter } from "./_lib/aiCore.js";
import { lookupUser } from "./_lib/loginAlertCore.js";
import { readServiceAccount } from "./_lib/blockCore.js";
import { isFounder, isAdminOnly, listAllUsers } from "./_lib/adminCore.js";
import { listPresence } from "./_lib/presenceCore.js";
import { listRequests } from "./_lib/requestCore.js";
import { listDocs } from "./_lib/fsLite.js";
import { buildOverview } from "./_lib/overviewCore.js";

const allow = makeLimiter(120, 60 * 60 * 1000);
const send = (res, status, body) => { res.statusCode = status; res.setHeader("Content-Type", "application/json"); res.setHeader("Cache-Control", "no-store"); res.end(JSON.stringify(body)); };

export default async function handler(req, res) {
  if (req.method !== "GET") return send(res, 405, { error: "Use GET." });
  const header = String(req.headers.authorization || "");
  const diag = {};
  const user = await lookupUser(header.startsWith("Bearer ") ? header.slice(7) : "", undefined, diag).catch((e) => { diag.why = `Could not reach Google: ${String((e && e.message) || e).slice(0, 100)}`; return null; });
  if (!user) return send(res, 401, { error: "Sign in again.", why: diag.why || "" });
  if (!isFounder(user.email)) return send(res, 403, { error: "Not available." });
  if (!allow(user.uid)) return send(res, 429, { error: "Too many requests. Try again later." });
  const sa = readServiceAccount();
  if (!sa) return send(res, 503, { error: "Add FIREBASE_SERVICE_ACCOUNT to use this screen." });
  try {
    const [users, presence, plans, requests] = await Promise.all([
      listAllUsers({ sa }), listPresence({ sa }).catch(() => []), listDocs({ sa, collection: "plans" }).catch(() => []), listRequests({ sa }).catch(() => []),
    ]);
    return send(res, 200, { ...buildOverview({ users, presence, plans, requests }), adminOnly: isAdminOnly(user.email) });
  } catch (e) {
    return send(res, 502, { error: "Could not read the numbers. Try again in a minute." });
  }
}
