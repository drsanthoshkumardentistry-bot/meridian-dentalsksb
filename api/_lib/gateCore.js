// Extra checks for the paid endpoints (/api/whatsapp, /api/ai), on top of "signed in with a verified e-mail":
//  - the closed-access switch (config/access) is honoured: when it is on, only addresses in allowedEmails get through;
//  - optionally the account must be older than a minimum age, so a freshly made throwaway account cannot spend the quota;
//  - one shared daily cap across all accounts, so many accounts cannot add up to an unlimited bill.
import { getAccessToken } from "./blockCore.js";

const DATASTORE = "https://www.googleapis.com/auth/datastore";
const docUrl = (sa, path) => `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(sa.project_id)}/databases/(default)/documents/${path}`;

const readDoc = async (sa, token, path, fetchFn) => {
  const r = await fetchFn(docUrl(sa, path), { headers: { Authorization: `Bearer ${token}` } });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error("firestore");
  return r.json();
};

/** Returns { ok: true } or { ok: false, status, error }. `sa` may be null (service account not set): then only age is checked. */
export const checkAccess = async ({ user, sa, fetchFn = fetch, now = Date.now(), minAgeMs = 0 }) => {
  if (!user || !user.email) return { ok: false, status: 401, error: "Sign in again." };
  if (minAgeMs > 0 && (!user.createdAt || now - user.createdAt < minAgeMs)) {
    return { ok: false, status: 403, error: "New accounts can use this after 24 hours." };
  }
  if (!sa) return { ok: true };
  try {
    const token = await getAccessToken(sa, fetchFn, now, DATASTORE);
    const cfg = await readDoc(sa, token, "config/access", fetchFn);
    const restrict = cfg && cfg.fields && cfg.fields.restrict && cfg.fields.restrict.booleanValue === true;
    if (restrict) {
      const allowed = await readDoc(sa, token, `allowedEmails/${encodeURIComponent(user.email)}`, fetchFn);
      if (!allowed) return { ok: false, status: 403, error: "This account is not approved yet." };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, status: 503, error: "Could not check access right now. Try again." };
  }
};

/** Shared cap, read from an environment value (default when unset or not a positive number). */
export const dailyCap = (raw, fallback) => { const n = Number(raw); return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback; };

/**
 * Site-wide daily counter kept in Firestore (rateLimits/<name>_<UTC day>), so every server instance shares one count.
 * An in-memory counter only counts inside one instance, which on Cloudflare/Vercel lets the "daily cap" multiply.
 * Returns true while the count is within `limit`. If the service account is missing or Firestore cannot be reached it
 * falls back to `fallback(name)` (the old in-memory limiter), so the feature never breaks because of the counter.
 */
export const siteDailyHit = async ({ sa, name, limit, fallback, fetchFn = fetch, now = Date.now() }) => {
  if (!sa) return fallback(name);
  try {
    const token = await getAccessToken(sa, fetchFn, now, DATASTORE);
    const day = new Date(now).toISOString().slice(0, 10);
    const root = `projects/${sa.project_id}/databases/(default)/documents`;
    const r = await fetchFn(`https://firestore.googleapis.com/v1/${root}:commit`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ writes: [{ transform: { document: `${root}/rateLimits/${name}_${day}`, fieldTransforms: [{ fieldPath: "n", increment: { integerValue: "1" } }] } }] }),
    });
    if (!r.ok) throw new Error("firestore");
    const j = await r.json();
    const n = Number(j && j.writeResults && j.writeResults[0] && j.writeResults[0].transformResults && j.writeResults[0].transformResults[0] && j.writeResults[0].transformResults[0].integerValue);
    if (!Number.isFinite(n)) throw new Error("shape");
    return n <= limit;
  } catch (e) {
    return fallback(name);
  }
};
