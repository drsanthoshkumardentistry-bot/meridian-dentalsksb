// Supabase Edge Function: AI external examiner for MeriDent Academy.
// Uses Google Gemini (free tier) when GEMINI_API_KEY is set, or Anthropic when ANTHROPIC_API_KEY is set.
// Without a key it returns 503 and the app falls back to its built-in examiner.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const SYSTEM = `You are a strict but fair EXTERNAL EXAMINER conducting a BDS (dental) university viva voce in India.
Rules:
- Ask ONE question at a time. Start from the case/spotter given, then go deeper: definition → classification → features → investigations → management → "why" questions.
- If the student's answer is weak, vague or hedged, challenge it with a probing follow-up before moving on. Do NOT give away the answer.
- Be terse and formal, like a real examiner. No praise inflation. Max 3 sentences per reply.
- Never invent facts. If the student says something wrong, say it is wrong.
Score ONLY the student's latest answer and reply with JSON exactly matching:
{"reply": string, "done": boolean,
 "evaluation": {"score": number 0-10, "accuracy": number 0-100, "terminology": number 0-100, "confidence": number 0-100,
   "hits": string[] (correct key concepts they used), "missed": string[] (key concepts missing, short labels), "hedges": string[] (hedging phrases they used)}}
Set "done": true after about 5-6 questions, or when told this is the final turn; then "reply" is a one-line verdict.`;

function buildContext(body: any) {
  const t = body.topic, s = body.spotter;
  if (s) return `SPOTTER (${s.category}). Correct identification: ${s.title}. Key findings: ${(s.key_findings || []).join("; ")}. Differentials: ${(s.differentials || []).join("; ")}. Uses: ${(s.uses || []).join("; ")}. Pearl: ${s.diagnostic_pearl || ""}. The student can see the image but NOT this answer key.`;
  return `TOPIC: ${t?.title}. CASE SHOWN TO STUDENT: ${t?.vignette}\nANSWER KEY (hidden from student): ${JSON.stringify(t?.content ?? {})}\nSUGGESTED QUESTIONS: ${(t?.viva || []).map((v: any) => v.q).join(" | ")}`;
}

async function callGemini(key: string, system: string, convo: string) {
  const model = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.0-flash";
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: convo }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.4, maxOutputTokens: 600 },
    }),
  });
  if (!r.ok) throw new Error(`Gemini ${r.status}: ${await r.text()}`);
  const d = await r.json();
  return d.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function callAnthropic(key: string, system: string, convo: string) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: Deno.env.get("ANTHROPIC_MODEL") ?? "claude-haiku-4-5",
      max_tokens: 600, system,
      messages: [{ role: "user", content: convo + "\n\nRespond with the JSON object only." }],
    }),
  });
  if (!r.ok) throw new Error(`Anthropic ${r.status}: ${await r.text()}`);
  const d = await r.json();
  return d.content?.[0]?.text ?? "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const gemini = Deno.env.get("GEMINI_API_KEY");
  const anthropic = Deno.env.get("ANTHROPIC_API_KEY");
  if (!gemini && !anthropic) return json({ error: "AI examiner not configured" }, 503);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const answer = String(body.answer ?? "").slice(0, 4000);
  if (!answer.trim()) return json({ error: "Empty answer" }, 400);
  const history = (Array.isArray(body.history) ? body.history : []).slice(-20)
    .map((m: any) => `${m.role === "student" ? "STUDENT" : "EXAMINER"}: ${String(m.content).slice(0, 2000)}`).join("\n");

  const convo = `${buildContext(body)}\n\nTRANSCRIPT SO FAR:\n${history}\nSTUDENT: ${answer}\n\n${body.finalTurn ? "This is the FINAL turn: set done=true." : ""}`;
  try {
    const raw = gemini ? await callGemini(gemini, SYSTEM, convo) : await callAnthropic(anthropic!, SYSTEM, convo);
    const parsed = JSON.parse(raw.replace(/^```(json)?|```$/g, "").trim());
    if (typeof parsed.reply !== "string") throw new Error("bad model output");
    return json(parsed);
  } catch (e) {
    console.error(e);
    return json({ error: "AI examiner failed" }, 502);
  }
});
