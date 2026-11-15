import { describe, it, expect, beforeEach, vi } from "vitest";
import crypto from "node:crypto";

const { privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });
const sa = { client_email: "s@p.iam.gserviceaccount.com", private_key: privateKey, project_id: "proj" };
const R = "projects/proj/databases/(default)/documents";

// A tiny fake Firestore: documents keyed by full name; supports the calls eraseClinic makes.
const makeFake = (docs, { failAt = null } = {}) => {
  const log = [];
  const fetchFn = vi.fn(async (url, init = {}) => {
    const u = String(url); log.push(u);
    if (u.includes("oauth2.googleapis.com")) return { ok: true, status: 200, json: async () => ({ access_token: "t" }) };
    if (failAt && u.includes(failAt)) return { ok: false, status: 500, json: async () => ({}) };
    if (u.includes(":listCollectionIds")) {
      const parent = u.split("/documents/")[1].replace(":listCollectionIds", "");
      const ids = new Set();
      for (const n of docs) { const rel = n.slice(R.length + 1); if (rel.startsWith(parent + "/")) ids.add(rel.slice(parent.length + 1).split("/")[0]); }
      return { ok: true, status: 200, json: async () => ({ collectionIds: [...ids] }) };
    }
    if (u.includes(":batchWrite")) { for (const w of JSON.parse(init.body).writes) docs.delete(w.delete); return { ok: true, status: 200, json: async () => ({}) }; }
    if (u.includes(":runQuery")) {
      const q = JSON.parse(init.body).structuredQuery; const coll = q.from[0].collectionId; const want = q.where.fieldFilter.value.stringValue;
      const hits = [...docs].filter((n) => n.startsWith(`${R}/${coll}/`) && docs.owner?.get(n) === want).slice(0, 300);
      return { ok: true, status: 200, json: async () => (hits.length ? hits.map((name) => ({ document: { name } })) : [{}]) };
    }
    if (u.includes("accounts:delete")) { log.push("AUTH-DELETED " + JSON.parse(init.body).localId); return { ok: true, status: 200, json: async () => ({}) }; }
    if (u.includes("/documents/")) { // list a collection
      const coll = decodeURI(u.split("/documents/")[1].split("?")[0]);
      const names = [...docs].filter((n) => n.slice(R.length + 1).startsWith(coll + "/")).slice(0, 300);
      return { ok: true, status: 200, json: async () => ({ documents: names.map((name) => ({ name })) }) };
    }
    return { ok: false, status: 404, json: async () => ({}) };
  });
  return { fetchFn, log };
};
const build = () => {
  const docs = new Set(); docs.owner = new Map();
  const add = (p, owner) => { const n = `${R}/${p}`; docs.add(n); if (owner) docs.owner.set(n, owner); };
  for (let i = 0; i < 700; i++) add(`clinics/uidA/patients/p${i}`);
  add("clinics/uidA/audit/a1"); add("clinics/uidA/invoices/i1"); add("clinics/uidA/store/profile");
  add("clinics/uidB/patients/keep1"); add("clinics/uidB/audit/keep2");
  add("bookingPages/uidA"); add("bookingPages/uidB"); add("connectDentists/uidA");
  add("planShares/t1", "uidA"); add("planShares/t2", "uidB"); add("portalPages/pp1", "uidA"); add("clinicStaff/x@y.in", "uidA"); add("bookingRequests/r1", "uidA");
  add("connectDocLog/uidA/visits/v1");
  return docs;
};

describe("eraseClinic", () => {
  let eraseClinic; beforeEach(async () => { ({ eraseClinic } = await import("../api/_lib/eraseCore.js")); });
  it("deletes everything of one clinic, nothing of another, and the sign-in account last", async () => {
    const docs = build(); const { fetchFn, log } = makeFake(docs);
    const r = await eraseClinic({ sa, uid: "uidA", fetchFn });
    expect(r.done).toBe(true);
    const left = [...docs].map((n) => n.slice(R.length + 1));
    expect(left.filter((n) => /uidA|pp1|t1|x@y|r1/.test(n))).toEqual([]);
    expect(left.sort()).toEqual(["bookingPages/uidB", "clinics/uidB/audit/keep2", "clinics/uidB/patients/keep1", "planShares/t2"]);
    expect(log[log.length - 1]).toBe("AUTH-DELETED uidA");
  });
  it("works in rounds when time runs out, and the next round finishes", async () => {
    const docs = build(); const { fetchFn } = makeFake(docs);
    const first = await eraseClinic({ sa, uid: "uidA", fetchFn, budgetMs: -1 });
    expect(first.done).toBe(false);
    const second = await eraseClinic({ sa, uid: "uidA", fetchFn });
    expect(second.done).toBe(true);
  });
  it("does not delete the sign-in account if Firestore fails part-way, so a retry is still authorised", async () => {
    const docs = build(); const { fetchFn, log } = makeFake(docs, { failAt: ":batchWrite" });
    await expect(eraseClinic({ sa, uid: "uidA", fetchFn })).rejects.toThrow();
    expect(log.some((l) => String(l).startsWith("AUTH-DELETED"))).toBe(false);
  });
  it("refuses a bad uid", async () => {
    for (const uid of ["", "a/b", null, 5]) await expect(eraseClinic({ sa, uid, fetchFn: vi.fn() })).rejects.toThrow();
  });
});
