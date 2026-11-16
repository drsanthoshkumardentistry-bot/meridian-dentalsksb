import { describe, it, expect, vi } from "vitest";
import crypto from "node:crypto";
import { checkAccess, dailyCap, siteDailyHit } from "../api/_lib/gateCore.js";
import { readServiceAccount } from "../api/_lib/blockCore.js";

const { privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });
const sa = readServiceAccount(JSON.stringify({ client_email: "svc@proj.iam.gserviceaccount.com", private_key: privateKey, project_id: "proj" }));
const DAY = 86400000, now = Date.now();
const user = (o = {}) => ({ uid: "u1", email: "a@b.com", createdAt: now - 5 * DAY, ...o });
const fakeFetch = ({ restrict = false, allowed = true, fail = false } = {}) => vi.fn(async (url) => {
  const u = String(url);
  if (u.includes("oauth2")) return { ok: true, json: async () => ({ access_token: "t" }) };
  if (fail) return { ok: false, status: 500 };
  if (u.includes("/config/access")) return restrict === null ? { ok: false, status: 404 } : { ok: true, status: 200, json: async () => ({ fields: { restrict: { booleanValue: restrict } } }) };
  if (u.includes("/allowedEmails/")) return allowed ? { ok: true, status: 200, json: async () => ({}) } : { ok: false, status: 404 };
  return { ok: false, status: 404 };
});

describe("checkAccess", () => {
  it("rejects no user", async () => { expect((await checkAccess({ user: null, sa: null })).status).toBe(401); });
  it("rejects accounts younger than the minimum age", async () => {
    const r = await checkAccess({ user: user({ createdAt: now - 3600000 }), sa: null, now, minAgeMs: DAY });
    expect(r).toMatchObject({ ok: false, status: 403 });
  });
  it("rejects an account with no creation time when an age is required", async () => {
    expect((await checkAccess({ user: user({ createdAt: 0 }), sa: null, now, minAgeMs: DAY })).ok).toBe(false);
  });
  it("lets an old account through without a service account", async () => {
    expect((await checkAccess({ user: user(), sa: null, now, minAgeMs: DAY })).ok).toBe(true);
  });
  it("lets anyone through when the closed-access switch is off or missing", async () => {
    expect((await checkAccess({ user: user(), sa, fetchFn: fakeFetch({ restrict: false }), now })).ok).toBe(true);
    expect((await checkAccess({ user: user(), sa, fetchFn: fakeFetch({ restrict: null }), now })).ok).toBe(true);
  });
  it("blocks an address that is not approved when the switch is on", async () => {
    expect(await checkAccess({ user: user(), sa, fetchFn: fakeFetch({ restrict: true, allowed: false }), now })).toMatchObject({ ok: false, status: 403 });
  });
  it("allows an approved address when the switch is on", async () => {
    expect((await checkAccess({ user: user(), sa, fetchFn: fakeFetch({ restrict: true, allowed: true }), now })).ok).toBe(true);
  });
  it("fails closed when Firestore cannot be read", async () => {
    expect(await checkAccess({ user: user(), sa, fetchFn: fakeFetch({ fail: true }), now })).toMatchObject({ ok: false, status: 503 });
  });
});

describe("dailyCap", () => {
  it("uses the value when valid, else the default", () => {
    expect(dailyCap("250", 1000)).toBe(250);
    expect(dailyCap(undefined, 1000)).toBe(1000);
    expect(dailyCap("abc", 1000)).toBe(1000);
    expect(dailyCap("-5", 1000)).toBe(1000);
  });
});

describe("/api/whatsapp uses the gate", () => {
  it("refuses an account made less than a day ago, without calling WhatsApp", async () => {
    process.env.WHATSAPP_TOKEN = "t"; process.env.WHATSAPP_PHONE_ID = "1"; process.env.VITE_FIREBASE_API_KEY = "k";
    const { default: handler } = await import("../api/whatsapp.js");
    const calls = [];
    global.fetch = vi.fn(async (url) => { calls.push(String(url)); return { ok: true, json: async () => ({ users: [{ localId: "n1", email: "n@x.in", emailVerified: true, createdAt: String(Date.now() - 3600000) }] }) }; });
    const res = { headers: {}, setHeader() {}, end(b) { res.raw = b; } };
    await handler({ method: "POST", headers: { authorization: "Bearer abc" }, body: { check: true } }, res);
    expect(res.statusCode).toBe(403);
    expect(calls.some((u) => u.includes("graph.facebook.com"))).toBe(false);
  });
});

describe("siteDailyHit (shared daily counter)", () => {
  const counterFetch = (n, ok = true) => vi.fn(async (url, init) => {
    const u = String(url);
    if (u.includes("oauth2")) return { ok: true, json: async () => ({ access_token: "t" }) };
    if (!ok) return { ok: false, status: 500 };
    return { ok: true, json: async () => ({ writeResults: [{ transformResults: [{ integerValue: String(n) }] }] }) };
  });
  const fb = () => vi.fn(() => "memory");
  it("allows while the shared count is within the limit and blocks above it", async () => {
    expect(await siteDailyHit({ sa, name: "ai", limit: 3, fallback: fb(), fetchFn: counterFetch(3), now })).toBe(true);
    expect(await siteDailyHit({ sa, name: "ai", limit: 3, fallback: fb(), fetchFn: counterFetch(4), now })).toBe(false);
  });
  it("increments one document per name and UTC day", async () => {
    const f = counterFetch(1);
    await siteDailyHit({ sa, name: "whatsapp", limit: 5, fallback: fb(), fetchFn: f, now: Date.UTC(2026, 10, 17, 3) });
    const call = f.mock.calls.find(([u]) => String(u).includes(":commit"));
    const body = JSON.parse(call[1].body);
    expect(body.writes[0].transform.document).toContain("/rateLimits/whatsapp_2026-11-17");
    expect(body.writes[0].transform.fieldTransforms[0].increment.integerValue).toBe("1");
  });
  it("falls back to the in-memory limiter when there is no service account", async () => {
    const f = fb();
    expect(await siteDailyHit({ sa: null, name: "ai", limit: 1, fallback: f, now })).toBe("memory");
    expect(f).toHaveBeenCalled();
  });
  it("falls back, and never throws, when Firestore fails or answers oddly", async () => {
    const f1 = fb(), f2 = fb();
    expect(await siteDailyHit({ sa, name: "ai", limit: 1, fallback: f1, fetchFn: counterFetch(0, false), now })).toBe("memory");
    const odd = vi.fn(async (u) => String(u).includes("oauth2") ? { ok: true, json: async () => ({ access_token: "t" }) } : { ok: true, json: async () => ({}) });
    expect(await siteDailyHit({ sa, name: "ai", limit: 1, fallback: f2, fetchFn: odd, now })).toBe("memory");
  });
});
