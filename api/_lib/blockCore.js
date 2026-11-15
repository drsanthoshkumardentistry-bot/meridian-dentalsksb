// "Block this login" support for the sign-in alert e-mail.
// A link in the e-mail is signed with a key only the server knows, so nobody else can make one. Opening it shows a
// confirmation page; only pressing the button blocks the account (mail scanners that open links cannot block anyone).
// Blocking uses a Firebase service account (FIREBASE_SERVICE_ACCOUNT, server only) to switch the account off and
// end its sessions. The account can be switched back on with the "Undo" link on the result page.
import crypto from "node:crypto";

const b64url = (buf) => Buffer.from(buf).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
export const LINK_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

export const readServiceAccount = (raw = process.env.FIREBASE_SERVICE_ACCOUNT) => {
  if (!raw) return null;
  try {
    const text = String(raw).trim().startsWith("{") ? String(raw) : Buffer.from(String(raw), "base64").toString("utf8");
    const sa = JSON.parse(text);
    if (!sa.client_email || !sa.private_key || !sa.project_id) return null;
    return { client_email: sa.client_email, private_key: String(sa.private_key).replace(/\\n/g, "\n"), project_id: sa.project_id };
  } catch (e) { return null; }
};

const linkKey = (sa) => crypto.createHash("sha256").update("merident-block-link|" + sa.private_key).digest();

const payload = (uid, action, exp, email) => `${uid}|${action}|${exp}|${String(email || "").toLowerCase()}`;
export const signLink = (sa, uid, action, exp, email) => crypto.createHmac("sha256", linkKey(sa)).update(payload(uid, action, exp, email)).digest("hex");

export const verifyLink = (sa, { u, a, e, n, s }, now = Date.now()) => {
  if (!sa || !u || !s || !["block", "unblock"].includes(a)) return false;
  const exp = Number(e);
  if (!Number.isFinite(exp) || exp < now) return false;
  const want = Buffer.from(signLink(sa, u, a, exp, n), "hex");
  let got; try { got = Buffer.from(String(s), "hex"); } catch (err) { return false; }
  return got.length === want.length && crypto.timingSafeEqual(got, want);
};

export const buildLink = (base, sa, uid, action, email, now = Date.now()) => {
  const exp = now + LINK_LIFETIME_MS;
  const q = new URLSearchParams({ u: uid, a: action, e: String(exp), n: String(email || ""), s: signLink(sa, uid, action, exp, email) });
  return `${String(base).replace(/\/$/, "")}/api/block-login?${q.toString()}`;
};

export const getAccessToken = async (sa, fetchFn = fetch, now = Date.now(), scope = "https://www.googleapis.com/auth/identitytoolkit") => {
  const iat = Math.floor(now / 1000);
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({ iss: sa.client_email, scope, aud: "https://oauth2.googleapis.com/token", iat, exp: iat + 3000 }));
  const sig = b64url(crypto.createSign("RSA-SHA256").update(`${head}.${claim}`).sign(sa.private_key));
  const r = await fetchFn("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${head}.${claim}.${sig}` }).toString(),
  });
  if (!r.ok) throw new Error("token");
  const data = await r.json();
  if (!data.access_token) throw new Error("token");
  return data.access_token;
};

// Switches the account off (block) or on (unblock). Blocking also ends the person's existing sessions.
export const setBlocked = async (sa, uid, blocked, fetchFn = fetch, now = Date.now()) => {
  const token = await getAccessToken(sa, fetchFn, now);
  const body = { localId: uid, disableUser: !!blocked };
  if (blocked) body.validSince = String(Math.floor(now / 1000));
  const r = await fetchFn(`https://identitytoolkit.googleapis.com/v1/projects/${encodeURIComponent(sa.project_id)}/accounts:update`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error("update");
  return true;
};
