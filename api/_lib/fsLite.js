// Tiny Firestore REST helpers for server-only collections (presence, planRequests). Written with the service account,
// which skips the app's security rules; the rules give browsers no access to these collections.
import { getAccessToken } from "./blockCore.js";

export const SCOPE = "https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/identitytoolkit";
export const goodUid = (uid) => typeof uid === "string" && /^[A-Za-z0-9_-]{6,128}$/.test(uid);
const root = (sa) => `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(sa.project_id)}/databases/(default)/documents`;

/** JS values to Firestore fields: strings, whole numbers, booleans. */
export const enc = (obj) => {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string") fields[k] = { stringValue: v };
    else if (typeof v === "boolean") fields[k] = { booleanValue: v };
    else if (typeof v === "number" && Number.isFinite(v)) fields[k] = { integerValue: String(Math.round(v)) };
  }
  return fields;
};
export const dec = (fields = {}) => {
  const out = {};
  for (const [k, v] of Object.entries(fields || {})) {
    if (v == null || typeof v !== "object") continue;
    if ("stringValue" in v) out[k] = v.stringValue;
    else if ("booleanValue" in v) out[k] = !!v.booleanValue;
    else if ("integerValue" in v) out[k] = Number(v.integerValue) || 0;
    else if ("doubleValue" in v) out[k] = Number(v.doubleValue) || 0;
  }
  return out;
};

export const getDoc = async ({ sa, path, fetchFn = fetch, now = Date.now(), token }) => {
  const t = token || (await getAccessToken(sa, fetchFn, now, SCOPE));
  const r = await fetchFn(`${root(sa)}/${path}`, { headers: { Authorization: `Bearer ${t}` } });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error("firestore " + r.status);
  return dec((await r.json()).fields);
};

export const putDoc = async ({ sa, path, data, fetchFn = fetch, now = Date.now(), token }) => {
  const t = token || (await getAccessToken(sa, fetchFn, now, SCOPE));
  const r = await fetchFn(`${root(sa)}/${path}`, { method: "PATCH", headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }, body: JSON.stringify({ fields: enc(data) }) });
  if (!r.ok) throw new Error("firestore " + r.status);
};

/** Lists up to `max` documents of a top-level collection as { id, ...fields }. */
export const listDocs = async ({ sa, collection, max = 900, fetchFn = fetch, now = Date.now() }) => {
  const token = await getAccessToken(sa, fetchFn, now, SCOPE);
  const out = [];
  let pageToken = "";
  for (let i = 0; i < 6 && out.length < max; i++) {
    const r = await fetchFn(`${root(sa)}/${collection}?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) throw new Error("firestore " + r.status);
    const d = await r.json();
    for (const doc of d.documents || []) out.push({ id: String(doc.name).split("/").pop(), ...dec(doc.fields) });
    if (!d.nextPageToken) break;
    pageToken = d.nextPageToken;
  }
  return out.slice(0, max);
};
