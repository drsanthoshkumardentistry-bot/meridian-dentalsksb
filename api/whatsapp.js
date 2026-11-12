// Vercel function: POST /api/whatsapp. Sends one pre-approved WhatsApp template message for a signed-in clinic user.
// Needs WHATSAPP_TOKEN and WHATSAPP_PHONE_ID (Meta WhatsApp Business Platform), server only, plus the Firebase web API key.
// Without them it does nothing and answers 204, so the app keeps using the tap-to-send WhatsApp buttons.
import { makeLimiter } from "./_lib/aiCore.js";
import { lookupUser } from "./_lib/loginAlertCore.js";
import { buildSend } from "./_lib/whatsappCore.js";

const allow = makeLimiter(150, 24 * 60 * 60 * 1000); // one login cannot send more than 150 a day

const send = (res, status, body) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(body === undefined ? "" : JSON.stringify(body));
};

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Use POST." });
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  if (!token || !phoneId) return send(res, 204);

  const header = String(req.headers.authorization || "");
  const user = await lookupUser(header.startsWith("Bearer ") ? header.slice(7) : "").catch(() => null);
  if (!user) return send(res, 401, { error: "Sign in again." });

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  if (body.check) return send(res, 200, { enabled: true });

  const built = buildSend({ ...body, lang: process.env.WHATSAPP_TEMPLATE_LANG || "en" });
  if (built.error) return send(res, 400, { error: built.error });
  if (!allow(user.uid)) return send(res, 429, { error: "Daily WhatsApp limit reached. Try again tomorrow." });

  try {
    const r = await fetch(`https://graph.facebook.com/v21.0/${encodeURIComponent(phoneId)}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(built.payload),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return send(res, 502, { error: (data.error && data.error.message) || "WhatsApp refused the message." });
    return send(res, 200, { ok: true, id: data.messages && data.messages[0] && data.messages[0].id });
  } catch (e) {
    return send(res, 502, { error: "Could not reach WhatsApp." });
  }
}
