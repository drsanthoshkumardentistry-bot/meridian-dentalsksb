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
