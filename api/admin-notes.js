// POST /api/admin-notes { email, note? }: read (no note) or save (note) the founder's private note about one clinic. Founder only.
import { makeLimiter } from "./_lib/aiCore.js";
import { lookupUser } from "./_lib/loginAlertCore.js";
import { readServiceAccount } from "./_lib/blockCore.js";
import { isFounder } from "./_lib/adminCore.js";
import { uidByEmail } from "./_lib/planCore.js";
import { getNote, setNote, logAction } from "./_lib/auditCore.js";

const allow = makeLimiter(240, 60 * 60 * 1000);
const send = (res, status, body) => { res.statusCode = status; res.setHeader("Content-Type", "application/json"); res.setHeader("Cache-Control", "no-store"); res.end(JSON.stringify(body)); };

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Use POST." });
  const header = String(req.headers.authorization || "");
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const user = await lookupUser(token).catch(() => null);
  if (!user) return send(res, 401, { error: "Sign in again." });
  if (!isFounder(user.email)) return send(res, 403, { error: "Not available." });
  if (!allow(user.uid)) return send(res, 429, { error: "Too many requests." });
  const sa = readServiceAccount();
  if (!sa) return send(res, 503, { error: "Add FIREBASE_SERVICE_ACCOUNT first." });
  let body = req.body || {};
  if (typeof body === "string") { try { body = JSON.parse(body || "{}"); } catch { return send(res, 400, { error: "Bad request." }); } }
  if (!body || typeof body !== "object") return send(res, 400, { error: "Bad request." });
  const email = String(body.email || "").trim().toLowerCase();
  if (!email) return send(res, 400, { error: "Bad request." });
  try {
    const uid = await uidByEmail({ sa, email });
    if (!uid) return send(res, 404, { error: "No clinic account with that email." });
    if (typeof body.note !== "string") return send(res, 200, await getNote({ sa, uid }));
    const saved = await setNote({ sa, uid, note: body.note });
    await logAction({ sa, actor: user.email, action: "note", target: email, detail: `${saved.note.length} characters` });
    return send(res, 200, saved);
  } catch { return send(res, 502, { error: "Could not save. Try again in a minute." }); }
}
