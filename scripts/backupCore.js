// Free backup of the whole Firestore database, encrypted before it leaves the machine.
// Reads every collection and sub-collection through the Firestore REST API with the Firebase service account, packs the
// documents as JSON, then encrypts: a random AES-256-GCM key encrypts the data, and that key is locked with an RSA public
// key. Only the owner of the matching PRIVATE key (kept offline, never in the repo) can open a backup.
import crypto from "node:crypto";
import zlib from "node:zlib";
import { getAccessToken } from "../api/_lib/blockCore.js";

const DATASTORE = "https://www.googleapis.com/auth/datastore";
export const BACKUP_FORMAT = "merident-backup-v1";

const base = (sa) => `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(sa.project_id)}/databases/(default)/documents`;

const jsonOrThrow = async (r, what) => {
  if (!r.ok) throw new Error(`${what} failed (${r.status})`);
  return r.json();
};

/** Walks the database. `parent` is "" for the root or a document path. Calls onDoc({ path, fields }) for every document. */
export const crawl = async ({ sa, fetchFn = fetch, maxDocs = 500000, onDoc, now = Date.now() }) => {
  const token = await getAccessToken(sa, fetchFn, now, DATASTORE);
  const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  let count = 0;

  const listIds = async (parent) => {
    const ids = [];
    let pageToken;
    do {
      const url = `${base(sa)}${parent ? "/" + parent : ""}:listCollectionIds`;
      const j = await jsonOrThrow(await fetchFn(url, { method: "POST", headers: auth, body: JSON.stringify({ pageSize: 300, ...(pageToken ? { pageToken } : {}) }) }), "listCollectionIds");
      ids.push(...(j.collectionIds || []));
      pageToken = j.nextPageToken;
    } while (pageToken);
    return ids;
  };

  const walkCollection = async (collPath) => {
    let pageToken;
    do {
      const q = new URLSearchParams({ pageSize: "300", ...(pageToken ? { pageToken } : {}) });
      const j = await jsonOrThrow(await fetchFn(`${base(sa)}/${collPath}?${q}`, { headers: auth }), `list ${collPath}`);
      for (const d of j.documents || []) {
        const path = String(d.name).split("/documents/")[1];
        if (++count > maxDocs) throw new Error("Too many documents for one backup run; raise the limit on purpose.");
        await onDoc({ path, fields: d.fields || {} });
        for (const sub of await listIds(path)) await walkCollection(`${path}/${sub}`);
      }
      pageToken = j.nextPageToken;
    } while (pageToken);
  };

  for (const id of await listIds("")) await walkCollection(id);
  return count;
};

/** Packs documents, compresses and encrypts. Returns a Buffer holding a small JSON envelope. */
export const encryptBackup = (docs, publicKeyPem, meta = {}) => {
  const plain = zlib.gzipSync(Buffer.from(JSON.stringify({ format: BACKUP_FORMAT, ...meta, count: docs.length, docs }), "utf8"));
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  const lockedKey = crypto.publicEncrypt({ key: publicKeyPem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" }, key);
  return Buffer.from(JSON.stringify({ format: BACKUP_FORMAT, alg: "RSA-OAEP-SHA256+AES-256-GCM", key: lockedKey.toString("base64"), iv: iv.toString("base64"), tag: tag.toString("base64"), data: data.toString("base64") }));
};

/** Opens a backup made by encryptBackup. Throws on a wrong key or any change to the file. */
export const decryptBackup = (envelopeBuffer, privateKeyPem) => {
  const env = JSON.parse(Buffer.from(envelopeBuffer).toString("utf8"));
  if (env.format !== BACKUP_FORMAT) throw new Error("Not a MeriDent backup file.");
  const key = crypto.privateDecrypt({ key: privateKeyPem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" }, Buffer.from(env.key, "base64"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(env.iv, "base64"));
  decipher.setAuthTag(Buffer.from(env.tag, "base64"));
  const plain = zlib.gunzipSync(Buffer.concat([decipher.update(Buffer.from(env.data, "base64")), decipher.final()]));
  const out = JSON.parse(plain.toString("utf8"));
  if (out.format !== BACKUP_FORMAT || !Array.isArray(out.docs) || out.count !== out.docs.length) throw new Error("Backup is damaged.");
  return out;
};

/** Counts documents per top-level collection, for a quick sanity check after a backup or restore test. */
export const summarise = (docs) => {
  const by = {};
  for (const d of docs) { const c = String(d.path).split("/")[0]; by[c] = (by[c] || 0) + 1; }
  return by;
};

/** Writes backed-up documents into a Firestore project (used for restore tests; never run against live by accident). */
export const restoreDocs = async ({ sa, docs, fetchFn = fetch, now = Date.now() }) => {
  const token = await getAccessToken(sa, fetchFn, now, DATASTORE);
  const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const root = `projects/${sa.project_id}/databases/(default)/documents`;
  let written = 0;
  for (let i = 0; i < docs.length; i += 400) {
    const writes = docs.slice(i, i + 400).map((d) => ({ update: { name: `${root}/${d.path}`, fields: d.fields } }));
    const r = await fetchFn(`https://firestore.googleapis.com/v1/${root}:commit`, { method: "POST", headers: auth, body: JSON.stringify({ writes }) });
    if (!r.ok) throw new Error(`restore failed (${r.status})`);
    written += writes.length;
  }
  return written;
};
