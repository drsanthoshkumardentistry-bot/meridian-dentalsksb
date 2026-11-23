// Vercel function: POST /api/delete-account { confirm: "DELETE" }. Deletes the signed-in clinic's account and all its
// data. Needs FIREBASE_SERVICE_ACCOUNT. The person must have signed in within the last 10 minutes, so a stolen
// open session cannot wipe a clinic. Answers { done: false } when it needs another round.
import { makeLimiter } from "./_lib/aiCore.js";
import { lookupUser } from "./_lib/loginAlertCore.js";
import { readServiceAccount } from "./_lib/blockCore.js";
import { sharedHit } from "./_lib/gateCore.js";
import { eraseClinic } from "./_lib/eraseCore.js";
import { makeCode, sealTicket, verifyTicket, maskEmail } from "./_lib/codeCore.js";
import { sendMail, mailReady } from "./_lib/mailCore.js";

export const RECENT_MS = 10 * 60 * 1000;
const allow = makeLimiter(60, 24 * 60 * 60 * 1000); // many rounds are normal for a big clinic; this stops abuse
const allowCodeMail = makeLimiter(3, 60 * 60 * 1000); // at most 3 codes an hour
const allowWrongCode = makeLimiter(10, 60 * 60 * 1000); // wrong guesses are counted; the code is 8 digits and expires in 15 minutes

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
  // Second step: a code sent to the account's own email address.
  if (body.step === "request") {
    if (!mailReady()) return send(res, 503, { error: "Email codes are not switched on yet. Message us on WhatsApp and we will help you delete the account.", code: "no-mail" });
    if (!(await sharedHit({ sa, name: "delcode", key: user.uid, limit: 3, windowMs: 60 * 60 * 1000, fallback: allowCodeMail }))) return send(res, 429, { error: "Too many codes requested. Try again in an hour." });
    const code = makeCode();
    const sent = await sendMail({
      to: user.email,
      subject: "MeriDent: your code to delete your clinic account",
      text: `Your code is ${code}\n\nEnter it in MeriDent to permanently delete your clinic account and all its data. It works for 15 minutes.\n\nIf you did not ask for this, do not share the code. Someone may be signed in to your account: change your Google or MeriDent password now.`,
    });
    if (!sent) return send(res, 502, { error: "Could not send the email. Try again in a minute." });
    return send(res, 200, { sent: true, ticket: sealTicket(sa, "delete-account", user.uid, code), to: maskEmail(user.email) });
  }
  if (!verifyTicket(sa, "delete-account", user.uid, body.code, body.ticket)) {
    if (!(await sharedHit({ sa, name: "delwrong", key: user.uid, limit: 10, windowMs: 60 * 60 * 1000, fallback: allowWrongCode }))) return send(res, 429, { error: "Too many wrong codes. Try again in an hour." });
    return send(res, 400, { error: "That code is wrong or has expired. Ask for a new code.", code: "bad-code" });
  }
  if (!allow(user.uid)) return send(res, 429, { error: "Too many attempts. Try again tomorrow." });
  try {
    const r = await eraseClinic({ sa, uid: user.uid });
    return send(res, 200, { done: r.done });
  } catch (e) {
    return send(res, 502, { error: "Could not finish deleting. Try again in a minute; nothing is lost by retrying." });
  }
}
