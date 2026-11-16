import { describe, it, expect, vi } from "vitest";
import crypto from "node:crypto";
import { crawl, encryptBackup, decryptBackup, summarise, restoreDocs } from "../scripts/backupCore.js";
import { readServiceAccount } from "../api/_lib/blockCore.js";

const { privateKey: saKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });
const sa = readServiceAccount(JSON.stringify({ client_email: "svc@proj.iam.gserviceaccount.com", private_key: saKey, project_id: "proj" }));
const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });

const docs = [
  { path: "clinics/c1", fields: { name: { stringValue: "Smile" } } },
  { path: "clinics/c1/patients/p1", fields: { name: { stringValue: "Asha" }, age: { integerValue: "34" } } },
  { path: "connectPosts/x", fields: {} },
];

// A tiny fake Firestore: clinics/c1 -> patients/p1, plus connectPosts/x.
const fakeDb = () => vi.fn(async (url, init = {}) => {
  const u = String(url);
  if (u.includes("oauth2")) return { ok: true, json: async () => ({ access_token: "t" }) };
  const doc = (path, fields = {}) => ({ name: `projects/proj/databases/(default)/documents/${path}`, fields });
  if (u.endsWith("/documents:listCollectionIds")) return { ok: true, json: async () => ({ collectionIds: ["clinics", "connectPosts"] }) };
  if (u.endsWith("/documents/clinics/c1:listCollectionIds")) return { ok: true, json: async () => ({ collectionIds: ["patients"] }) };
  if (u.includes(":listCollectionIds")) return { ok: true, json: async () => ({}) };
  if (u.includes("/documents/clinics?")) return { ok: true, json: async () => ({ documents: [doc("clinics/c1", { name: { stringValue: "Smile" } })] }) };
  if (u.includes("/documents/clinics/c1/patients?")) return { ok: true, json: async () => ({ documents: [doc("clinics/c1/patients/p1", { name: { stringValue: "Asha" } })] }) };
  if (u.includes("/documents/connectPosts?")) return { ok: true, json: async () => ({ documents: [doc("connectPosts/x")] }) };
  return { ok: false, status: 404 };
});

describe("backup encryption", () => {
  it("round-trips documents with the right private key", () => {
    const out = decryptBackup(encryptBackup(docs, publicKey, { project: "proj" }), privateKey);
    expect(out.docs).toEqual(docs);
    expect(out.count).toBe(3);
    expect(out.project).toBe("proj");
  });
  it("does not contain readable data and cannot be opened with another key", () => {
    const blob = encryptBackup(docs, publicKey);
    expect(blob.toString("utf8")).not.toContain("Asha");
    const other = crypto.generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });
    expect(() => decryptBackup(blob, other.privateKey)).toThrow();
  });
  it("detects any change to the file", () => {
    const env = JSON.parse(encryptBackup(docs, publicKey).toString());
    const bytes = Buffer.from(env.data, "base64"); bytes[5] ^= 1; env.data = bytes.toString("base64");
    expect(() => decryptBackup(Buffer.from(JSON.stringify(env)), privateKey)).toThrow();
  });
  it("refuses a file that is not a backup", () => {
    expect(() => decryptBackup(Buffer.from(JSON.stringify({ format: "other" })), privateKey)).toThrow(/Not a MeriDent backup/);
  });
});

describe("crawl", () => {
  it("visits every collection and sub-collection", async () => {
    const got = [];
    const n = await crawl({ sa, fetchFn: fakeDb(), onDoc: (d) => got.push(d.path) });
    expect(n).toBe(3);
    expect(got.sort()).toEqual(["clinics/c1", "clinics/c1/patients/p1", "connectPosts/x"]);
  });
  it("stops with an error past the safety limit", async () => {
    await expect(crawl({ sa, fetchFn: fakeDb(), maxDocs: 1, onDoc: () => {} })).rejects.toThrow(/Too many documents/);
  });
  it("fails loudly when Firestore refuses, so a broken backup is never silent", async () => {
    const f = vi.fn(async (u) => String(u).includes("oauth2") ? { ok: true, json: async () => ({ access_token: "t" }) } : { ok: false, status: 403 });
    await expect(crawl({ sa, fetchFn: f, onDoc: () => {} })).rejects.toThrow(/403/);
  });
});

describe("summarise and restore", () => {
  it("counts documents per top-level collection", () => { expect(summarise(docs)).toEqual({ clinics: 2, connectPosts: 1 }); });
  it("restores in batches into the target project", async () => {
    const many = Array.from({ length: 900 }, (_, i) => ({ path: `clinics/c${i}`, fields: {} }));
    const f = vi.fn(async (u) => String(u).includes("oauth2") ? { ok: true, json: async () => ({ access_token: "t" }) } : { ok: true, json: async () => ({}) });
    expect(await restoreDocs({ sa, docs: many, fetchFn: f })).toBe(900);
    expect(f.mock.calls.filter(([u]) => String(u).includes(":commit")).length).toBe(3);
  });
  it("stops on a failed restore batch", async () => {
    const f = vi.fn(async (u) => String(u).includes("oauth2") ? { ok: true, json: async () => ({ access_token: "t" }) } : { ok: false, status: 500 });
    await expect(restoreDocs({ sa, docs, fetchFn: f })).rejects.toThrow(/restore failed/);
  });
});

describe("repo safety", () => {
  it("backup-public.pem is a public key and no private key is in the repo", async () => {
    const fs = await import("node:fs");
    const pem = fs.readFileSync(new URL("../backup-public.pem", import.meta.url), "utf8");
    expect(pem).toContain("BEGIN PUBLIC KEY");
    expect(pem).not.toContain("PRIVATE");
    expect(() => crypto.createPublicKey(pem)).not.toThrow();
  });
  it("the weekly workflow encrypts before uploading and never prints the service account", async () => {
    const fs = await import("node:fs");
    const yml = fs.readFileSync(new URL("../.github/workflows/backup.yml", import.meta.url), "utf8");
    expect(yml).toContain("scripts/backup.mjs");
    expect(yml).toContain("path: backup.enc");
    expect(yml).not.toMatch(/echo[^\n]*SERVICE_ACCOUNT/);
  });
});
