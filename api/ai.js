// Vercel function: POST /api/ai ("MeriDent AI"). Needs GEMINI_API_KEY (free Google AI Studio key) or ANTHROPIC_API_KEY, server only,
// plus the Firebase web API key.
import { MODEL, GEMINI_MODEL, buildRequest, parseVisitNote, makeLimiter } from "./_lib/aiCore.js";

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
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey && !process.env.ANTHROPIC_API_KEY) return send(res, 503, { error: "MeriDent AI is not switched on for this site yet." });

  let body;
  try { body = await readBody(req); } catch (e) { return send(res, 413, { error: "Request too large." }); }

  const header = String(req.headers.authorization || "");
  const uid = await verifyUser(header.startsWith("Bearer ") ? header.slice(7) : "").catch(() => null);
  if (!uid) return send(res, 401, { error: "Sign in again to use MeriDent AI." });
  if (!allow(uid)) return send(res, 429, { error: "Too many MeriDent AI requests this hour. Try again later." });

  const built = buildRequest(body);
  if (!built.ok) return send(res, 400, { error: built.error });

  try {
    let text = "";
    if (geminiKey) {
      const model = process.env.GEMINI_MODEL || GEMINI_MODEL;
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: built.system }] },
          contents: [{ role: "user", parts: [{ text: built.user }] }],
          generationConfig: { maxOutputTokens: 900, temperature: 0.3 },
        }),
      });
      if (r.status === 429) return send(res, 429, { error: "MeriDent AI is busy. Try again in a minute." });
      if (!r.ok) return send(res, 502, { error: "MeriDent AI could not answer. Try again." });
      const data = await r.json();
      const parts = (((data.candidates || [])[0] || {}).content || {}).parts || [];
      text = parts.map((x) => x.text || "").join("");
    } else {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: MODEL, max_tokens: 700, system: built.system, messages: [{ role: "user", content: built.user }] }),
      });
      if (r.status === 429) return send(res, 429, { error: "MeriDent AI is busy. Try again in a minute." });
      if (!r.ok) return send(res, 502, { error: "MeriDent AI could not answer. Try again." });
      const data = await r.json();
      text = ((data.content || []).find((b) => b.type === "text") || {}).text || "";
    }
    if (built.kind === "json") {
      const note = parseVisitNote(text);
      return note ? send(res, 200, { note }) : send(res, 502, { error: "MeriDent AI gave an unusable reply. Try again." });
    }
    return text.trim() ? send(res, 200, { text: text.trim() }) : send(res, 502, { error: "MeriDent AI gave an empty reply. Try again." });
  } catch (e) {
    return send(res, 502, { error: "Could not reach MeriDent AI." });
  }
}
