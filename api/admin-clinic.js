// POST /api/admin-clinic { email, action: "suspend" | "resume" }. Founder only, and only with a recent sign-in.
// Suspending turns the clinic's sign-in off (they cannot log in and their open sessions end); their data is not touched or read.
// Pausing keeps the days left and starts them again on resume.
// A founder account can never be suspended here, so nobody can lock the founders out.
import { makeLimiter } from "./_lib/aiCore.js";
import { lookupUser } from "./_lib/loginAlertCore.js";
import { readServiceAccount, setBlocked } from "./_lib/blockCore.js";
import { isFounder, signedInRecently, FRESH_SIGNIN_MESSAGE } from "./_lib/adminCore.js";
import { uidByEmail, pausePlan, resumePlan } from "./_lib/planCore.js";

const allow = makeLimiter(60, 60 * 60 * 1000);
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
  if (!sa) return send(res, 503, { error: "Add FIREBASE_SERVICE_ACCOUNT first." });
  let body = req.body || {};
  if (typeof body === "string") { try { body = JSON.parse(body || "{}"); } catch (e) { return send(res, 400, { error: "Bad request." }); } }
  if (!body || typeof body !== "object") return send(res, 400, { error: "Bad request." });
  const action = body.action;
  const ACTIONS = ["suspend", "resume", "pause_subscription", "resume_subscription"];
  if (!ACTIONS.includes(action)) return send(res, 400, { error: "Choose suspend, resume, pause or start." });
  const email = String(body.email || "").trim().toLowerCase();
  if (isFounder(email)) return send(res, 400, { error: "A founder account cannot be suspended." });
  try {
    const uid = await uidByEmail({ sa, email });
    if (!uid) return send(res, 404, { error: "No clinic account with that email." });
    if (uid === user.uid) return send(res, 400, { error: "You cannot suspend your own account." });
    if (action === "pause_subscription") { const r = await pausePlan({ sa, uid, email }); return send(res, 200, { email, ...r }); }
    if (action === "resume_subscription") { const r = await resumePlan({ sa, uid, email }); return send(res, 200, { email, ...r }); }
    await setBlocked(sa, uid, action === "suspend");
    return send(res, 200, { email, suspended: action === "suspend" });
  } catch (e) {
    const known = { already_paused: "This subscription is already paused.", nothing_to_pause: "There is no paid time left to pause.", not_paused: "This subscription is not paused." }[e && e.message];
    if (known) return send(res, 400, { error: known });
    return send(res, 502, { error: "Could not save. Try again in a minute." });
  }
}
