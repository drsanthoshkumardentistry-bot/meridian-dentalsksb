import { describe, it, expect } from "vitest";
import { handleImg, usageOf, goodId, keyFor, MAX_BYTES } from "../api/_lib/imgCore.js";

const fakeBucket = () => {
  const m = new Map();
  return {
    m,
    put: async (k, b, o) => { m.set(k, { size: b.byteLength, body: b, httpMetadata: o.httpMetadata }); },
    get: async (k) => m.get(k) || null,
    head: async (k) => m.get(k) || null,
    delete: async (k) => { m.delete(k); },
    list: async ({ prefix }) => ({ objects: [...m].filter(([k]) => k.startsWith(prefix)).map(([k, v]) => ({ key: k, size: v.size })), truncated: false }),
  };
};
const lookup = async (t) => (t === "ta" ? { uid: "uidA" } : t === "tb" ? { uid: "uidB" } : null);
const bytes = (n) => new Uint8Array(n).buffer;
const call = (b, o) => handleImg({ bucket: b, lookup, ...o });

describe("R2 picture service", () => {
  it("needs a bucket and a valid sign-in", async () => {
    expect((await call(null, { method: "GET", id: "abcdef", token: "ta" })).status).toBe(503);
    expect((await call(fakeBucket(), { method: "GET", id: "abcdef", token: "" })).status).toBe(401);
    expect((await call(fakeBucket(), { method: "GET", id: "abcdef", token: "bad" })).status).toBe(401);
  });
  it("stores under the clinic's own folder and a clinic cannot read another's picture", async () => {
    const b = fakeBucket();
    expect((await call(b, { method: "PUT", id: "pic12345", token: "ta", contentType: "image/jpeg", body: bytes(100) })).status).toBe(200);
    expect(b.m.has(keyFor("uidA", "pic12345"))).toBe(true);
    expect((await call(b, { method: "GET", id: "pic12345", token: "ta" })).status).toBe(200);
    expect((await call(b, { method: "GET", id: "pic12345", token: "tb" })).status).toBe(404);
    expect((await call(b, { method: "DELETE", id: "pic12345", token: "tb" })).status).toBe(200);
    expect(b.m.has(keyFor("uidA", "pic12345"))).toBe(true); // B's delete did nothing to A's picture
  });
  it("rejects path tricks, wrong types, empty and oversize pictures", async () => {
    const b = fakeBucket();
    for (const id of ["../uidB/x", "a/b", "short", "x".repeat(80), "bad id!!"]) expect(goodId(id)).toBe(false);
    expect((await call(b, { method: "PUT", id: "../uidB/xx", token: "ta", contentType: "image/jpeg", body: bytes(5) })).status).toBe(400);
    expect((await call(b, { method: "PUT", id: "pic12345", token: "ta", contentType: "text/html", body: bytes(5) })).status).toBe(415);
    expect((await call(b, { method: "PUT", id: "pic12345", token: "ta", contentType: "image/png", body: bytes(0) })).status).toBe(400);
    expect((await call(b, { method: "PUT", id: "pic12345", token: "ta", contentType: "image/png", body: bytes(MAX_BYTES + 1) })).status).toBe(413);
  });
  it("stops at the clinic cap but lets a picture be replaced, and reports usage", async () => {
    const b = fakeBucket();
    const put = (id, n) => call(b, { method: "PUT", id, token: "ta", contentType: "image/jpeg", body: bytes(n), cap: 1000 });
    expect((await put("pic00001", 600)).status).toBe(200);
    expect((await put("pic00002", 600)).status).toBe(402);
    expect((await put("pic00001", 900)).status).toBe(200); // replacing counts only the difference
    expect(await usageOf(b, "uidA")).toEqual({ bytes: 900, count: 1 });
    expect(JSON.parse((await call(b, { method: "GET", token: "ta" })).body)).toEqual({ bytes: 900, count: 1 });
    expect(JSON.parse((await call(b, { method: "GET", token: "tb" })).body)).toEqual({ bytes: 0, count: 0 });
  });
});
