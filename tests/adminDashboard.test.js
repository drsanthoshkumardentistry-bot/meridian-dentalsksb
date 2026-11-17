import { describe, it, expect, vi, afterEach } from "vitest";
import crypto from "node:crypto";
import { nextPresence, summarisePresence, dayKey, recordBeat, ONLINE_MS } from "../api/_lib/presenceCore.js";
import { createRequest, getRequest, decideRequest, listRequests } from "../api/_lib/requestCore.js";
import { getPlan } from "../api/_lib/planCore.js";
import { buildOverview } from "../api/_lib/overviewCore.js";
import { enc, dec } from "../api/_lib/fsLite.js";
import overview from "../api/admin-overview.js";
import adminRequest from "../api/admin-request.js";
import planRequest from "../api/plan-request.js";
import heartbeat from "../api/heartbeat.js";

const { privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });
const sa = { client_email: "s@p.iam.gserviceaccount.com", private_key: privateKey, project_id: "proj" };
const NOW = Date.UTC(2026, 10, 18, 6, 30); // 12:00 in India
const MIN = 60000;

/** An in-memory Firestore plus token endpoint, reached through fetch. */
const fakeFirestore = (seed = {}) => {
  const docs = new Map(Object.entries(seed));
  const calls = [];
  const fetchFn = async (url, init = {}) => {
    const u = String(url);
    calls.push(u);
    if (u.includes("oauth2")) return { ok: true, json: async () => ({ access_token: "t" }) };
    const m = u.match(/documents\/([^?]+)(\?.*)?$/);
    if (!m) return { ok: false, status: 404, json: async () => ({}) };
    const path = decodeURIComponent(m[1]);
    const method = init.method || "GET";
    if (method === "PATCH") { docs.set(path, JSON.parse(init.body).fields); return { ok: true, status: 200, json: async () => ({}) }; }
    if (!path.includes("/")) {
      const documents = [...docs.entries()].filter(([k]) => k.startsWith(path + "/")).map(([k, f]) => ({ name: `projects/proj/databases/(default)/documents/${k}`, fields: f }));
      return { ok: true, status: 200, json: async () => ({ documents }) };
    }
    if (!docs.has(path)) return { ok: false, status: 404, json: async () => ({}) };
    return { ok: true, status: 200, json: async () => ({ fields: docs.get(path) }) };
  };
  return { docs, calls, fetchFn };
};

describe("Firestore value helpers", () => {
  it("round-trips strings, whole numbers and booleans, and drops anything else", () => {
    const f = enc({ a: "x", b: 5, c: true, d: NaN, e: undefined, f: { z: 1 } });
    expect(dec(f)).toEqual({ a: "x", b: 5, c: true });
  });
});

describe("online time", () => {
  it("counts the gap between two messages of one session, and nothing for the first", () => {
    const a = nextPresence(null, { sessionId: "s1xxxxxx", email: "a@x.com", now: NOW });
    expect(a).toMatchObject({ lastSeen: NOW, totalMs: 0, sessions: 1, startedAt: NOW });
    const b = nextPresence(a, { sessionId: "s1xxxxxx", email: "a@x.com", now: NOW + 5 * MIN });
    expect(b.totalMs).toBe(5 * MIN);
    expect(JSON.parse(b.daysJson)[dayKey(NOW)]).toBe(5 * MIN);
    expect(b.sessions).toBe(1);
  });
  it("does not count a long silence, or time between different sessions", () => {
    const a = nextPresence(null, { sessionId: "s1xxxxxx", email: "a@x.com", now: NOW });
    const later = nextPresence(a, { sessionId: "s1xxxxxx", email: "a@x.com", now: NOW + 3 * 60 * MIN });
    expect(later.totalMs).toBe(0);
    const other = nextPresence(a, { sessionId: "s2xxxxxx", email: "a@x.com", now: NOW + 5 * MIN });
    expect(other.totalMs).toBe(0);
    expect(other.sessions).toBe(2);
    expect(nextPresence(a, { sessionId: "s1xxxxxx", email: "a@x.com", now: NOW - 5 * MIN }).totalMs).toBe(0);
  });
  it("keeps only the last 14 days", () => {
    let p = null;
    for (let d = 0; d < 20; d++) {
      p = nextPresence(p, { sessionId: "s" + d + "xxxxxx", email: "a@x.com", now: NOW + d * 86400000 });
      p = nextPresence(p, { sessionId: "s" + d + "xxxxxx", email: "a@x.com", now: NOW + d * 86400000 + 5 * MIN });
    }
    expect(Object.keys(JSON.parse(p.daysJson))).toHaveLength(14);
  });
  it("summarises who is online, active today and hours", () => {
    let a = nextPresence(null, { sessionId: "aaaaaaaa", email: "a@x.com", now: NOW });
    for (let i = 1; i <= 6; i++) a = nextPresence(a, { sessionId: "aaaaaaaa", email: "a@x.com", now: NOW + i * 5 * MIN });
    const rows = [{ id: "uidA1234", ...a }, { id: "uidB1234", email: "b@x.com", lastSeen: NOW - 3 * 3600000, daysJson: "{}", sessions: 2, totalMs: 0 }, null, { id: "bad", daysJson: "{nope" }];
    const s = summarisePresence(rows, NOW + 31 * MIN);
    expect(s.onlineNow).toBe(1);
    expect(s.activeToday).toBe(1);
    expect(s.hoursToday).toBe(0.5);
    expect(s.dayTotals).toHaveLength(7);
    expect(s.dayTotals[6]).toEqual({ day: dayKey(NOW), hours: 0.5 });
    expect(s.rows.find((r) => r.uid === "uidA1234").online).toBe(true);
    expect(ONLINE_MS).toBe(10 * MIN);
    expect(() => summarisePresence(null)).not.toThrow();
  });
  it("saves a beat to presence/{uid} and rejects bad ids", async () => {
    const fs = fakeFirestore();
    await recordBeat({ sa, uid: "uidA1234", email: "a@x.com", sessionId: "sess1234", fetchFn: fs.fetchFn, now: NOW });
    await recordBeat({ sa, uid: "uidA1234", email: "a@x.com", sessionId: "sess1234", fetchFn: fs.fetchFn, now: NOW + 5 * MIN });
    expect(dec(fs.docs.get("presence/uidA1234")).totalMs).toBe(5 * MIN);
    await expect(recordBeat({ sa, uid: "../x", email: "", sessionId: "sess1234", fetchFn: fs.fetchFn })).rejects.toThrow("uid");
    await expect(recordBeat({ sa, uid: "uidA1234", email: "", sessionId: "no", fetchFn: fs.fetchFn })).rejects.toThrow("session");
  });
});

describe("subscription requests", () => {
  it("creates a pending request, lets the clinic read only its own, and sanitises input", async () => {
    const fs = fakeFirestore();
    const r = await createRequest({ sa, uid: "uidA1234", email: "a@x.com", plan: "pro", yearly: true, clinic: "x".repeat(200), fetchFn: fs.fetchFn, now: NOW });
    expect(r).toEqual({ status: "pending", plan: "pro", yearly: false }); // Pro has no yearly price
    expect(dec(fs.docs.get("planRequests/uidA1234")).clinic).toHaveLength(80);
    expect((await getRequest({ sa, uid: "uidA1234", fetchFn: fs.fetchFn })).status).toBe("pending");
    expect((await getRequest({ sa, uid: "uidZ9999", fetchFn: fs.fetchFn })).status).toBe("");
    await expect(createRequest({ sa, uid: "uidA1234", plan: "gold", fetchFn: fs.fetchFn })).rejects.toThrow("plan");
  });
  it("approve switches the plan on for 30 days (365 yearly), once only", async () => {
    const fs = fakeFirestore();
    await createRequest({ sa, uid: "uidA1234", email: "a@x.com", plan: "standard", yearly: false, fetchFn: fs.fetchFn, now: NOW });
    await createRequest({ sa, uid: "uidB1234", email: "b@x.com", plan: "standard", yearly: true, fetchFn: fs.fetchFn, now: NOW });
    const a = await decideRequest({ sa, uid: "uidA1234", action: "approve", fetchFn: fs.fetchFn, now: NOW });
    expect(a).toEqual({ status: "approved", paidUntil: NOW + 30 * 86400000 });
    expect((await getPlan({ sa, uid: "uidA1234", fetchFn: fs.fetchFn, now: NOW })).plan).toBe("standard");
    const b = await decideRequest({ sa, uid: "uidB1234", action: "approve", fetchFn: fs.fetchFn, now: NOW });
    expect(b.paidUntil).toBe(NOW + 365 * 86400000);
    await expect(decideRequest({ sa, uid: "uidA1234", action: "approve", fetchFn: fs.fetchFn, now: NOW })).rejects.toThrow("decided");
    expect((await getRequest({ sa, uid: "uidA1234", fetchFn: fs.fetchFn })).status).toBe("approved");
  });
  it("reject leaves the plan alone; unknown request or action is refused", async () => {
    const fs = fakeFirestore();
    await createRequest({ sa, uid: "uidA1234", email: "a@x.com", plan: "pro", fetchFn: fs.fetchFn, now: NOW });
    expect((await decideRequest({ sa, uid: "uidA1234", action: "reject", fetchFn: fs.fetchFn, now: NOW })).status).toBe("rejected");
    expect(fs.docs.has("plans/uidA1234")).toBe(false);
    await expect(decideRequest({ sa, uid: "uidQ1234", action: "approve", fetchFn: fs.fetchFn })).rejects.toThrow("missing");
    await expect(decideRequest({ sa, uid: "uidA1234", action: "delete", fetchFn: fs.fetchFn })).rejects.toThrow("action");
    expect(await listRequests({ sa, fetchFn: fs.fetchFn })).toHaveLength(1);
  });
});

describe("overview numbers", () => {
  const users = [
    { uid: "uidA1234", email: "a@x.com", createdAt: String(NOW - 40 * 86400000), lastLoginAt: String(NOW - MIN) },
    { uid: "uidB1234", email: "b@x.com", createdAt: String(NOW - 2 * 86400000), lastLoginAt: String(NOW - 86400000) },
    { uid: "uidC1234", email: "c@x.com", createdAt: String(NOW - 90 * 86400000), lastLoginAt: String(NOW - 80 * 86400000) },
  ];
  const presence = [{ id: "uidA1234", email: "a@x.com", lastSeen: NOW - MIN, daysJson: JSON.stringify({ [dayKey(NOW)]: 90 * MIN }), sessions: 3, totalMs: 90 * MIN }];
  const plans = [{ id: "uidA1234", plan: "pro", paidUntil: NOW + 10 * 86400000 }, { id: "uidC1234", plan: "standard", paidUntil: NOW - 86400000 }];
  const requests = [{ id: "uidB1234", email: "b@x.com", clinic: "Smile", plan: "standard", yearly: false, status: "pending", createdAt: NOW - MIN }, { id: "uidC1234", email: "c@x.com", plan: "standard", status: "approved", createdAt: NOW - 5 * 86400000 }];
  it("combines sign-ins, online time, plans and requests", () => {
    const o = buildOverview({ users, presence, plans, requests, now: NOW });
    expect(o.users.total).toBe(3);
    expect(o.presence).toMatchObject({ onlineNow: 1, activeToday: 1, hoursToday: 1.5 });
    expect(o.billing).toEqual({ paidActive: 1, expired: 1, pending: 1, monthlyValue: 999 });
    expect(o.clinics.map((c) => c.email)).toEqual(["a@x.com", "b@x.com", "c@x.com"]);
    expect(o.clinics[0]).toMatchObject({ online: true, todayMin: 90, plan: "pro", state: "paid" });
    expect(o.clinics[1]).toMatchObject({ state: "unpaid", request: "pending", online: false });
    expect(o.clinics[2].state).toBe("expired");
    expect(o.requests[0]).toMatchObject({ uid: "uidB1234", status: "pending", clinic: "Smile" });
  });
  it("copes with empty and broken inputs", () => {
    for (const v of [undefined, null, [], [null, 1, {}]]) expect(() => buildOverview({ users: v, presence: v, plans: v, requests: v, now: NOW })).not.toThrow();
    expect(buildOverview({}).billing.monthlyValue).toBe(0);
  });
});

const run = async (h, method, headers = {}, body, env = {}) => {
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = b ? JSON.parse(b) : null; } };
  await h({ method, headers, body }, res);
  return res;
};
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("endpoints keep strangers out", () => {
  const asUser = (email) => vi.fn(async () => ({ ok: true, json: async () => ({ users: [{ localId: "uidA1234", email, emailVerified: true }] }) }));
  it("admin endpoints: 405 wrong method, 401 signed out, 403 for non-founders, with no Firestore access", async () => {
    vi.stubEnv("VITE_FIREBASE_API_KEY", "k");
    expect((await run(overview, "POST")).statusCode).toBe(405);
    expect((await run(adminRequest, "GET")).statusCode).toBe(405);
    const f = asUser("clinic@x.com");
    vi.stubGlobal("fetch", f);
    for (const [h, m] of [[overview, "GET"], [adminRequest, "POST"]]) {
      expect((await run(h, m, {})).statusCode).toBe(401);
      expect((await run(h, m, { authorization: "Bearer t" }, { uid: "uidB1234", action: "approve" }, { FOUNDER_EMAILS: "boss@x.com" })).statusCode).toBe(403);
    }
    expect(f.mock.calls.every(([u]) => String(u).includes("accounts:lookup"))).toBe(true);
  });
  it("a founder gets the overview; a founder can approve over HTTP", async () => {
    const fs = fakeFirestore();
    await createRequest({ sa, uid: "uidB1234", email: "b@x.com", plan: "standard", fetchFn: fs.fetchFn, now: Date.now() });
    vi.stubEnv("VITE_FIREBASE_API_KEY", "k");
    vi.stubEnv("FOUNDER_EMAILS", "Boss@X.com");
    vi.stubEnv("FIREBASE_SERVICE_ACCOUNT", JSON.stringify({ ...sa, private_key: sa.private_key }));
    vi.stubGlobal("fetch", async (u, init) => {
      const s = String(u);
      if (s.includes("accounts:lookup")) return { ok: true, json: async () => ({ users: [{ localId: "uidF1234", email: "boss@x.com", emailVerified: true }] }) };
      if (s.includes("accounts:batchGet")) return { ok: true, json: async () => ({ users: [{ localId: "uidB1234", email: "b@x.com", createdAt: String(Date.now()), lastLoginAt: String(Date.now()) }] }) };
      return fs.fetchFn(u, init);
    });
    const o = await run(overview, "GET", { authorization: "Bearer t" });
    expect(o.statusCode).toBe(200);
    expect(o.body.billing.pending).toBe(1);
    const a = await run(adminRequest, "POST", { authorization: "Bearer t" }, { uid: "uidB1234", action: "approve" });
    expect(a.statusCode).toBe(200);
    expect(a.body.status).toBe("approved");
    expect((await run(adminRequest, "POST", { authorization: "Bearer t" }, { uid: "uidB1234", action: "approve" })).statusCode).toBe(409);
    expect((await run(adminRequest, "POST", { authorization: "Bearer t" }, { uid: "uidZ9999", action: "approve" })).statusCode).toBe(404);
  });
  it("a clinic can only request for itself and cannot approve", async () => {
    const fs = fakeFirestore();
    vi.stubEnv("VITE_FIREBASE_API_KEY", "k");
    vi.stubEnv("FIREBASE_SERVICE_ACCOUNT", JSON.stringify(sa));
    vi.stubGlobal("fetch", async (u, init) => (String(u).includes("accounts:lookup") ? { ok: true, json: async () => ({ users: [{ localId: "uidA1234", email: "a@x.com", emailVerified: true }] }) } : fs.fetchFn(u, init)));
    expect((await run(planRequest, "POST", { authorization: "Bearer t" }, { plan: "pro", uid: "uidVICTIM9", status: "approved" })).statusCode).toBe(200);
    expect(fs.docs.has("planRequests/uidA1234")).toBe(true);
    expect(fs.docs.has("planRequests/uidVICTIM9")).toBe(false);
    expect(dec(fs.docs.get("planRequests/uidA1234")).status).toBe("pending");
    expect((await run(planRequest, "POST", { authorization: "Bearer t" }, { plan: "gold" })).statusCode).toBe(400);
    expect((await run(planRequest, "GET", { authorization: "Bearer t" })).body.status).toBe("pending");
    expect((await run(adminRequest, "POST", { authorization: "Bearer t" }, { uid: "uidA1234", action: "approve" })).statusCode).toBe(403);
    expect(fs.docs.has("plans/uidA1234")).toBe(false);
  });
  it("heartbeat needs sign-in, is quiet when not configured, and records when configured", async () => {
    vi.stubEnv("VITE_FIREBASE_API_KEY", "k");
    expect((await run(heartbeat, "POST", {})).statusCode).toBe(401);
    const fs = fakeFirestore();
    vi.stubGlobal("fetch", async (u, init) => (String(u).includes("accounts:lookup") ? { ok: true, json: async () => ({ users: [{ localId: "uidA1234", email: "a@x.com", emailVerified: true }] }) } : fs.fetchFn(u, init)));
    expect((await run(heartbeat, "POST", { authorization: "Bearer t" }, { sessionId: "sess1234" })).statusCode).toBe(204);
    expect(fs.docs.size).toBe(0);
    vi.stubEnv("FIREBASE_SERVICE_ACCOUNT", JSON.stringify(sa));
    expect((await run(heartbeat, "POST", { authorization: "Bearer t" }, { sessionId: "sess1234" })).statusCode).toBe(204);
    expect(fs.docs.has("presence/uidA1234")).toBe(true);
    expect((await run(heartbeat, "POST", { authorization: "Bearer t" }, { sessionId: "!" })).statusCode).toBe(400);
  });
});
