// Vercel function: POST /api/ai. Needs ANTHROPIC_API_KEY (server only) and the Firebase web API key.
import { MODEL, buildRequest, parseVisitNote, makeLimiter } from "./_lib/aiCore.js";

const allow = makeLimiter(40, 60 * 60 * 1000);

const send = (res, status, body) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
};

// Confirm the caller is a signed-in MeriDent user by asking Firebase to look up their token.
const verifyUser = async (idToken) => {
  const apiKey = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
  if (!apiKey || !idToken) return null;
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken }),
  });
  if (!r.ok) return null;
  const data = await r.json();
  const user = data && data.users && data.users[0];
  return user ? user.localId : null;
};

const readBody = async (req) => {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const c of req) { chunks.push(c); if (chunks.reduce((n, x) => n + x.length, 0) > 50000) throw new Error("too large"); }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"); } catch (e) { return {}; }
};

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Use POST." });
  if (!process.env.ANTHROPIC_API_KEY) return send(res, 503, { error: "AI help is not switched on for this site yet." });

  let body;
  try { body = await readBody(req); } catch (e) { return send(res, 413, { error: "Request too large." }); }

  const header = String(req.headers.authorization || "");
  const uid = await verifyUser(header.startsWith("Bearer ") ? header.slice(7) : "").catch(() => null);
  if (!uid) return send(res, 401, { error: "Sign in again to use AI help." });
  if (!allow(uid)) return send(res, 429, { error: "Too many AI requests this hour. Try again later." });

  const built = buildRequest(body);
  if (!built.ok) return send(res, 400, { error: built.error });

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 700, system: built.system, messages: [{ role: "user", content: built.user }] }),
    });
    if (!r.ok) return send(res, 502, { error: "The AI service could not answer. Try again." });
    const data = await r.json();
    const text = ((data.content || []).find((b) => b.type === "text") || {}).text || "";
    if (built.kind === "json") {
      const note = parseVisitNote(text);
      return note ? send(res, 200, { note }) : send(res, 502, { error: "The AI reply was not usable. Try again." });
    }
    return text.trim() ? send(res, 200, { text: text.trim() }) : send(res, 502, { error: "The AI reply was empty. Try again." });
  } catch (e) {
    return send(res, 502, { error: "Could not reach the AI service." });
  }
}
