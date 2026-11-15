import { describe, it, expect, beforeEach, vi } from "vitest";
import crypto from "node:crypto";

const { privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });
const SA = JSON.stringify({ client_email: "s@p.iam.gserviceaccount.com", private_key: privateKey, project_id: "p" });
const res = () => { const r = { statusCode: 0, headers: {}, body: "", setHeader(k, v) { r.headers[k] = v; }, end(b) { r.body = b == null ? "" : String(b); } }; return r; };
const json = (r) => (r.body ? JSON.parse(r.body) : null);
const lookup = (email = "a@b.in") => ({ ok: true, status: 200, json: async () => ({ users: [{ localId: "uidA", email, emailVerified: true, createdAt: "1600000000000" }] }), text: async () => "{}" });

let seal, verify;
beforeEach(async () => {
  process.env.VITE_FIREBASE_API_KEY = "k";
  process.env.FIREBASE_SERVICE_ACCOUNT = SA;
  vi.resetModules();
  seal = (await import("../api/pay-seal.js")).default;
  verify = (await import("../api/pay-verify.js")).default;
  global.fetch = vi.fn(async (url) => {
    const u = String(url);
    if (u.includes("accounts:lookup")) return lookup();
    if (u.includes("oauth2.googleapis.com")) return { ok: true, status: 200, json: async () => ({ access_token: "t", expires_in: 3600 }) };
    return { ok: false, status: 404, json: async () => ({}) }; // no access restriction configured
  });
});
const post = (body, auth = "Bearer t") => { const r = res(); return seal({ method: "POST", headers: { authorization: auth }, body }, r).then(() => r); };
const get = (qs, ip = "1.1.1." + Math.floor(Math.random() * 250)) => { const r = res(); return verify({ method: "GET", url: "/api/pay-verify?" + qs, headers: { "x-forwarded-for": ip } }, r).then(() => r); };

describe("/api/pay-seal and /api/pay-verify", () => {
  it("a signed-in clinic gets a seal that the public check accepts", async () => {
    const r = await post({ vpa: "smile@okhdfc", name: "Smile Dental" });
    expect(r.statusCode).toBe(200);
    const { u, ks } = json(r);
    const ok = await get(new URLSearchParams({ u, pa: "smile@okhdfc", pn: "Smile Dental", ks }).toString());
    expect(json(ok)).toEqual({ ok: true, configured: true });
  });
  it("a swapped UPI ID or renamed clinic fails the check", async () => {
    const { u, ks } = json(await post({ vpa: "smile@okhdfc", name: "Smile Dental" }));
    for (const change of [{ pa: "thief@okhdfc" }, { pn: "Other Clinic" }]) {
      const q = new URLSearchParams({ u, pa: "smile@okhdfc", pn: "Smile Dental", ks, ...change }).toString();
      expect(json(await get(q))).toEqual({ ok: false, configured: true });
    }
  });
  it("seal needs sign-in, valid details and the right method", async () => {
    global.fetch = vi.fn(async () => ({ ok: false, status: 400, json: async () => ({}) }));
    expect((await post({ vpa: "smile@okhdfc", name: "S" })).statusCode).toBe(401);
    global.fetch = vi.fn(async (u) => (String(u).includes("accounts:lookup") ? lookup() : { ok: false, status: 404, json: async () => ({}) }));
    expect((await post({ vpa: "not upi", name: "S" })).statusCode).toBe(400);
    expect((await post({ vpa: "smile@okhdfc", name: "   " })).statusCode).toBe(400);
    expect((await post("not json {")).statusCode).toBe(400);
    const r = res(); await seal({ method: "GET", headers: {} }, r); expect(r.statusCode).toBe(405);
  });
  it("without the server key, seals are off (204) and the check says it cannot verify", async () => {
    delete process.env.FIREBASE_SERVICE_ACCOUNT; vi.resetModules();
    const s2 = (await import("../api/pay-seal.js")).default, v2 = (await import("../api/pay-verify.js")).default;
    const r = res(); await s2({ method: "POST", headers: {}, body: {} }, r); expect(r.statusCode).toBe(204);
    const g = res(); await v2({ method: "GET", url: "/api/pay-verify?u=a&pa=ab@upi&ks=" + "a".repeat(64), headers: {} }, g);
    expect(json(g)).toEqual({ ok: false, configured: false });
  });
  it("the public check is rate limited per address and survives junk", async () => {
    for (let i = 0; i < 120; i++) await get("u=x&pa=ab@upi&ks=zz", "9.9.9.9");
    expect((await get("u=x", "9.9.9.9")).statusCode).toBe(429);
    expect(json(await get("%E0%A4%A&&&=&ks=" + "f".repeat(5000)))).toMatchObject({ ok: false });
  });
});
