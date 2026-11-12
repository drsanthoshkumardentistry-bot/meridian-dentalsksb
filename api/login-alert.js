// Vercel function: POST /api/login-alert. Emails the MeriDent owner when someone signs in.
// Needs RESEND_API_KEY (free Resend account) and LOGIN_ALERT_TO (the address that receives the alerts), server only,
// plus the Firebase web API key. Without them it does nothing and answers 204.
import { makeLimiter } from "./_lib/aiCore.js";
import { buildAlert, lookupUser } from "./_lib/loginAlertCore.js";

const allow = makeLimiter(4, 60 * 60 * 1000); // one person cannot make more than 4 alerts an hour

const send = (res, status, body) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(body === undefined ? "" : JSON.stringify(body));
};

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Use POST." });
  const key = process.env.RESEND_API_KEY;
  const to = process.env.LOGIN_ALERT_TO;
  if (!key || !to) return send(res, 204);

  const header = String(req.headers.authorization || "");
  const user = await lookupUser(header.startsWith("Bearer ") ? header.slice(7) : "").catch(() => null);
  if (!user) return send(res, 401, { error: "Sign in again." });
  if (user.email === String(to).trim().toLowerCase()) return send(res, 204); // no alert for your own sign-in
  if (!allow(user.uid)) return send(res, 429, { error: "Too many alerts." });

  const firstTime = user.createdAt > 0 && Math.abs(user.lastLoginAt - user.createdAt) < 2 * 60 * 1000;
  const msg = buildAlert({ email: user.email, name: user.name, firstTime });
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "MeriDent <onboarding@resend.dev>", to: [to], subject: msg.subject, text: msg.text, html: msg.html }),
    });
    return send(res, r.ok ? 200 : 502, r.ok ? { ok: true } : { error: "Email service refused the message." });
  } catch (e) {
    return send(res, 502, { error: "Could not reach the email service." });
  }
}
