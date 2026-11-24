// App Check with Cloudflare Turnstile (free). The browser solves a Turnstile check, this server confirms it with
// Cloudflare, then asks Firebase for an App Check token for the real MeriDent web app and hands it back.
// Nothing here is used until TURNSTILE_SECRET_KEY, FIREBASE_SERVICE_ACCOUNT and the app id are set.
import { signRS256, getAccessToken } from "./blockCore.js";

const b64url = (s) => Buffer.from(s).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
export const EXCHANGE_AUD = "https://firebaseappcheck.googleapis.com/google.firebase.appcheck.v1.TokenExchangeService";
export const TURNSTILE_VERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Asks Cloudflare whether this Turnstile answer is genuine. */
export const verifyTurnstile = async (token, secret, ip, fetchFn = fetch) => {
  if (!token || typeof token !== "string" || token.length > 4096 || !secret) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip && ip !== "unknown") body.set("remoteip", ip);
    const r = await fetchFn(TURNSTILE_VERIFY, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString() });
    if (!r.ok) return false;
    const data = await r.json();
    return data.success === true;
  } catch { return false; }
};

/** Signs the short-lived custom token Firebase exchanges for an App Check token. */
export const buildCustomToken = async (sa, appId, now = Date.now()) => {
  const iat = Math.floor(now / 1000);
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({ iss: sa.client_email, sub: sa.client_email, aud: EXCHANGE_AUD, app_id: appId, iat, exp: iat + 300 }));
  return `${head}.${claim}.${await signRS256(sa.private_key, `${head}.${claim}`)}`;
};

/** Returns { token, expireTimeMillis } for the web app, or throws. */
export const mintAppCheckToken = async (sa, appId, fetchFn = fetch, now = Date.now()) => {
  const access = await getAccessToken(sa, fetchFn, now, "https://www.googleapis.com/auth/cloud-platform");
  const customToken = await buildCustomToken(sa, appId, now);
  const r = await fetchFn(`https://firebaseappcheck.googleapis.com/v1/projects/${encodeURIComponent(sa.project_id)}/apps/${encodeURIComponent(appId)}:exchangeCustomToken`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${access}` }, body: JSON.stringify({ customToken }),
  });
  if (!r.ok) throw new Error("exchange");
  const data = await r.json();
  if (!data.token) throw new Error("exchange");
  const seconds = parseInt(String(data.ttl || "3600s"), 10) || 3600;
  return { token: data.token, expireTimeMillis: now + seconds * 1000 };
};
