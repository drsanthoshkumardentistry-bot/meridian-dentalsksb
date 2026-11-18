// GET /api/announcement: the founder's banner for any signed-in clinic. POST { text, level }: founder only; empty text clears it.
import { makeLimiter } from "./_lib/aiCore.js";
import { lookupUser } from "./_lib/loginAlertCore.js";
import { readServiceAccount } from "./_lib/blockCore.js";
import { isFounder } from "./_lib/adminCore.js";
import { getAnnouncement, setAnnouncement } from "./_lib/announceCore.js";

const allowRead = makeLimiter(240, 60 * 60 * 1000);
const allowWrite = makeLimiter(60, 60 * 60 * 1000);
const send = (res, status, body) => { res.statusCode = status; res.setHeader("Content-Type", "application/json"); res.setHeader("Cache-Control", "no-store"); res.end(JSON.stringify(body)); };
const NONE = { active: false, id: "", text: "", level: "info", updatedAt: 0 };

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") return send(res, 405, { error: "Use GET or POST." });
  const header = String(req.headers.authorization || "");
  const user = await lookupUser(header.startsWith("Bearer ") ? header.slice(7) : "").catch(() => null);
  if (!user) return send(res, 401, { error: "Sign in again." });
  const sa = readServiceAccount();
  if (req.method === "GET") {
    if (!allowRead(user.uid)) return send(res, 429, { error: "Too many requests." });
    if (!sa) return send(res, 200, NONE);
    try { return send(res, 200, await getAnnouncement({ sa })); } catch (e) { return send(res, 200, NONE); }
  }
  if (!isFounder(user.email)) return send(res, 403, { error: "Not available." });
  if (!allowWrite(user.uid)) return send(res, 429, { error: "Too many requests." });
  if (!sa) return send(res, 503, { error: "Add FIREBASE_SERVICE_ACCOUNT first." });
  let body = req.body || {};
  if (typeof body === "string") { try { body = JSON.parse(body || "{}"); } catch (e) { return send(res, 400, { error: "Bad request." }); } }
  if (!body || typeof body !== "object") return send(res, 400, { error: "Bad request." });
  try {
    return send(res, 200, await setAnnouncement({ sa, text: body.text, level: body.level }));
  } catch (e) {
    if (e && e.message === "level") return send(res, 400, { error: "Choose info, success or warning." });
    return send(res, 502, { error: "Could not save. Try again in a minute." });
  }
}
