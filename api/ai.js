// Vercel function: POST /api/ai ("Meridee"). Needs GEMINI_API_KEY (free Google AI Studio key) or ANTHROPIC_API_KEY, server only,
// plus the Firebase web API key.
import { MODEL, GEMINI_MODELS, buildRequest, parseVisitNote, makeLimiter } from "./_lib/aiCore.js";
import { readServiceAccount } from "./_lib/blockCore.js";
import { featureOn } from "./_lib/featuresCore.js";
import { lookupUser } from "./_lib/loginAlertCore.js";
import { checkAccess, dailyCap, siteDailyHit } from "./_lib/gateCore.js";

export const config = { maxDuration: 30 };

const allow = makeLimiter(40, 60 * 60 * 1000);
const SITE_CAP = () => dailyCap(process.env.AI_SITE_DAILY, 3000);
const allowAllMemory = makeLimiter(SITE_CAP(), 24 * 60 * 60 * 1000); // backup if the shared counter cannot be reached

const send = (res, status, body) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
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
  if (!geminiKey && !process.env.ANTHROPIC_API_KEY) return send(res, 503, { error: "Meridee is not switched on for this site yet." });

  let body;
  try { body = await readBody(req); } catch (e) { return send(res, 413, { error: "Request too large." }); }

  const header = String(req.headers.authorization || "");
  const user = await lookupUser(header.startsWith("Bearer ") ? header.slice(7) : "").catch(() => null);
  if (!user) return send(res, 401, { error: "Sign in again to use Meridee." });
  const uid = user.uid;
  const sa = readServiceAccount();
  const gate = await checkAccess({ user, sa });
  if (!gate.ok) return send(res, gate.status, { error: gate.error });
  if (!(await featureOn({ sa }, "ai"))) return send(res, 503, { error: "Meridee is switched off for a short while. Please try again later." });
  if (!(await siteDailyHit({ sa, name: "ai", limit: SITE_CAP(), fallback: () => allowAllMemory("site") }))) return send(res, 429, { error: "Meridee is busy today. Try again tomorrow." });
  if (!allow(uid)) return send(res, 429, { error: "Too many Meridee requests this hour. Try again later." });

  const built = buildRequest(body);
  if (!built.ok) return send(res, 400, { error: built.error });

  try {
    let text = "";
    if (geminiKey) {
      const models = [process.env.GEMINI_MODEL, ...GEMINI_MODELS].filter(Boolean);
      const body = JSON.stringify({
        systemInstruction: { parts: [{ text: built.system }] },
        contents: (built.messages || [{ role: "user", content: built.user }]).map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
        generationConfig: { maxOutputTokens: 700, temperature: 0.3, thinkingConfig: { thinkingBudget: 0 } },
      });
      let r;
      let lastBody = "";
      const deadline = Date.now() + 26000;
      let lastReply = null;
      const withoutThinking = JSON.stringify({ ...JSON.parse(body), generationConfig: { maxOutputTokens: 700, temperature: 0.3 } });
      const attempt = async (model, payload) => {
        try {
          return await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
            body: payload,
            signal: AbortSignal.timeout(Math.max(3000, Math.min(9000, deadline - Date.now()))),
          });
        } catch (e) { console.error("meridee gemini", model, String(e && e.name)); return null; }
      };
      for (const model of models) {
        r = await attempt(model, body);
        // Some models reject the "no thinking" setting (400): ask again without it.
        if (r && r.status === 400) r = await attempt(model, withoutThinking);
        if (!r) { if (Date.now() > deadline - 3000) break; continue; }
        lastReply = r;
        if (r.ok) break;
        lastBody = typeof r.text === "function" ? (await r.text().catch(() => "")).slice(0, 300) : "";
        console.error("meridee gemini", model, r.status, lastBody);
        // Model retired (404), busy (429, 5xx) or still refusing (400): try the next one. A bad key (401/403) will not improve.
        if (![400, 404, 429, 500, 503].includes(r.status)) break;
      }
      if (!r) r = lastReply;
      if (!r) return send(res, 504, { error: "Meridee took too long. Try again." });
      if (r.status === 401 || r.status === 403) return send(res, 503, { error: "Meridee's access key was refused. The site owner needs to update it." });
      if (r.status === 429) return send(res, 429, { error: "Meridee is busy. Try again in a minute." });
      if (!r.ok) return send(res, 502, { error: "Meridee could not answer. Try again." });
      const data = await r.json();
      const parts = (((data.candidates || [])[0] || {}).content || {}).parts || [];
      text = parts.map((x) => x.text || "").join("");
    } else {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: MODEL, max_tokens: 700, system: built.system, messages: built.messages || [{ role: "user", content: built.user }] }),
      });
      if (r.status === 429) return send(res, 429, { error: "Meridee is busy. Try again in a minute." });
      if (!r.ok) return send(res, 502, { error: "Meridee could not answer. Try again." });
      const data = await r.json();
      text = ((data.content || []).find((b) => b.type === "text") || {}).text || "";
    }
    if (built.kind === "json") {
      const note = parseVisitNote(text);
      return note ? send(res, 200, { note }) : send(res, 502, { error: "Meridee gave an unusable reply. Try again." });
    }
    return text.trim() ? send(res, 200, { text: text.trim() }) : send(res, 502, { error: "Meridee gave an empty reply. Try again." });
  } catch (e) {
    return send(res, 502, { error: "Could not reach Meridee." });
  }
}
