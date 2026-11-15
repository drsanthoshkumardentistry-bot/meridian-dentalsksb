// Attack-style checks on every /api handler: wrong method, no or bad sign-in, broken or oversized bodies, floods.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ai from "../api/ai.js";
import whatsapp from "../api/whatsapp.js";
import loginAlert from "../api/login-alert.js";
import clientError from "../api/client-error.js";

const makeRes = () => {
  const r = { headers: {}, statusCode: 200, setHeader(k, v) { r.headers[k] = v; }, end(b) { r.raw = b; try { r.body = b ? JSON.parse(b) : undefined; } catch (e) { r.body = undefined; } } };
  return r;
};
const run = async (handler, { method = "POST", body, token, headers = {} } = {}) => {
  const res = makeRes();
  await handler({ method, body, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers } }, res);
  return res;
};
let uidCounter = 0;
const stubFirebase = ({ verified = true } = {}) => {
  global.fetch = vi.fn(async (url, opts) => {
    if (String(url).includes("identitytoolkit")) {
      const tok = JSON.parse(opts.body).idToken;
      if (!tok.startsWith("good")) return { ok: false, json: async () => ({}) };
      return { ok: true, json: async () => ({ users: [{ localId: tok, email: `${tok}@x.com`, emailVerified: verified, createdAt: "1600000000000" }] }) };
    }
    return { ok: true, status: 200, json: async () => ({ content: [{ type: "text", text: "hello" }], messages: [{ id: "m1" }] }) };
  });
};
const newToken = () => `good${++uidCounter}`;

beforeEach(() => {
  process.env.VITE_FIREBASE_API_KEY = "fb";
  process.env.ANTHROPIC_API_KEY = "sk-test";
  process.env.WHATSAPP_TOKEN = "wa";
  process.env.WHATSAPP_PHONE_ID = "123";
  process.env.RESEND_API_KEY = "re";
  process.env.LOGIN_ALERT_TO = "owner@example.com";
  stubFirebase();
});
afterEach(() => {
  for (const k of ["ANTHROPIC_API_KEY", "WHATSAPP_TOKEN", "WHATSAPP_PHONE_ID", "RESEND_API_KEY", "LOGIN_ALERT_TO"]) delete process.env[k];
});

describe("wrong method", () => {
  it.each([["ai", ai], ["whatsapp", whatsapp], ["login-alert", loginAlert], ["client-error", clientError]])("%s refuses GET, PUT and DELETE", async (_n, h) => {
    for (const method of ["GET", "PUT", "DELETE"]) expect((await run(h, { method })).statusCode).toBe(405);
  });
});

describe("no or bad sign-in", () => {
  it.each([["ai", ai], ["whatsapp", whatsapp], ["login-alert", loginAlert]])("%s answers 401 without a token and with a forged one", async (_n, h) => {
    expect((await run(h, { body: {} })).statusCode).toBe(401);
    expect((await run(h, { body: {}, token: "forged" })).statusCode).toBe(401);
    expect((await run(h, { body: {}, headers: { authorization: "Basic abc" } })).statusCode).toBe(401);
  });
  it("login-alert and whatsapp refuse an unverified email address", async () => {
    stubFirebase({ verified: false });
    expect((await run(loginAlert, { token: newToken() })).statusCode).toBe(401);
    expect((await run(whatsapp, { body: { check: true }, token: newToken() })).statusCode).toBe(401);
  });
  it("a Firebase outage means 401, never a crash", async () => {
    global.fetch = vi.fn(async () => { throw new Error("down"); });
    expect((await run(ai, { body: {}, token: newToken() })).statusCode).toBe(401);
    expect((await run(whatsapp, { body: {}, token: newToken() })).statusCode).toBe(401);
  });
});

describe("broken and oversized bodies", () => {
  it("whatsapp answers 400 for malformed JSON text, arrays and numbers", async () => {
    for (const body of ["{not json", "[1,2]", "42"]) {
      const res = await run(whatsapp, { body, token: newToken() });
      expect(res.statusCode).toBe(400);
    }
  });
  it("whatsapp rejects unknown message kinds, bad numbers and wrong parameter counts", async () => {
    const t = newToken();
    expect((await run(whatsapp, { body: { kind: "free_text", to: "9876543210", params: ["a"] }, token: t })).statusCode).toBe(400);
    expect((await run(whatsapp, { body: { kind: "recall", to: "12345", params: ["a", "b", "c", "d"] }, token: t })).statusCode).toBe(400);
    expect((await run(whatsapp, { body: { kind: "recall", to: "9876543210", params: ["a"] }, token: t })).statusCode).toBe(400);
  });
  it("ai rejects empty and non-object bodies without crashing", async () => {
    for (const body of [undefined, null, "text", 5, [], {}]) {
      const res = await run(ai, { body, token: newToken() });
      expect([400, 413]).toContain(res.statusCode);
    }
  });
  it("ai cuts a huge note down before it reaches the model", async () => {
    await run(ai, { body: { task: "visit_note", notes: "x".repeat(200000) }, token: newToken() });
    const call = global.fetch.mock.calls.find((c) => String(c[0]).includes("anthropic"));
    expect(call).toBeTruthy();
    expect(call[1].body.length).toBeLessThan(6000);
  });
  it("client-error answers 400 for junk and 204 for a valid report, and trims huge fields", async () => {
    delete process.env.RESEND_API_KEY;
    for (const body of [undefined, null, "str", [], {}, { message: "" }]) expect((await run(clientError, { body, headers: { "x-forwarded-for": "9.9.9.1" } })).statusCode).toBe(400);
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const t0 = Date.now();
    const res = await run(clientError, { body: { message: "m".repeat(100000), stack: "s".repeat(100000), name: "n".repeat(1000) }, headers: { "x-forwarded-for": "9.9.9.2" } });
    expect(res.statusCode).toBe(204);
    expect(Date.now() - t0).toBeLessThan(500); // the e-mail pattern used to take about 12 seconds on this input
    expect(log.mock.calls[0][1].length).toBeLessThan(3000);
    log.mockRestore();
  });
  it("client-error email escapes HTML and hides emails, tokens and long numbers", async () => {
    const sent = [];
    global.fetch = vi.fn(async (url, opts) => { sent.push(JSON.parse(opts.body)); return { ok: true }; });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    await run(clientError, { body: { message: "<script>alert(1)</script> a@b.com Bearer abc.def 9876543210", name: "XSS-1" }, headers: { "x-forwarded-for": "9.9.9.3" } });
    log.mockRestore();
    expect(sent).toHaveLength(1);
    expect(sent[0].html).not.toContain("<script>");
    expect(sent[0].text).not.toMatch(/a@b\.com|9876543210|abc\.def/);
  });
});

describe("floods", () => {
  it("client-error stops one visitor after 10 reports an hour", async () => {
    delete process.env.RESEND_API_KEY;
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const codes = [];
    for (let i = 0; i < 100; i++) codes.push((await run(clientError, { body: { message: "boom" + i }, headers: { "x-forwarded-for": "7.7.7.7" } })).statusCode);
    log.mockRestore();
    expect(codes.filter((c) => c === 204)).toHaveLength(10);
    expect(codes.filter((c) => c === 429)).toHaveLength(90);
  });
  it("ai stops one user after 40 requests an hour and never calls the model after that", async () => {
    const t = newToken();
    const codes = [];
    for (let i = 0; i < 100; i++) codes.push((await run(ai, { body: { task: "visit_note", notes: "pain lower left caries 36" }, token: t })).statusCode);
    expect(codes.filter((c) => c === 429).length).toBeGreaterThanOrEqual(60);
    expect(global.fetch.mock.calls.filter((c) => String(c[0]).includes("anthropic")).length).toBeLessThanOrEqual(40);
  });
  it("login-alert allows 4 emails an hour per person", async () => {
    const t = newToken();
    const codes = [];
    for (let i = 0; i < 10; i++) codes.push((await run(loginAlert, { token: t })).statusCode);
    expect(codes.filter((c) => c === 200)).toHaveLength(4);
    expect(codes.filter((c) => c === 429)).toHaveLength(6);
  });
  it("login-alert never emails for the owner's own sign-in", async () => {
    global.fetch = vi.fn(async (url) => ({ ok: true, json: async () => ({ users: [{ localId: "own", email: "OWNER@example.com", emailVerified: true }] }) }));
    expect((await run(loginAlert, { token: "good-own" })).statusCode).toBe(204);
  });
});

describe("secrets", () => {
  it("error responses never echo the keys", async () => {
    global.fetch = vi.fn(async (url) => (String(url).includes("identitytoolkit") ? { ok: true, json: async () => ({ users: [{ localId: "z", email: "z@x.com", emailVerified: true }] }) } : { ok: false, status: 500, text: async () => "key sk-test leaked", json: async () => ({ error: { message: "bad" } }) }));
    const bodies = [];
    for (const [h, body] of [[ai, { task: "visit_note", notes: "pain lower left caries 36" }], [whatsapp, { kind: "recall", to: "9876543210", params: ["a", "2", "c", "1"] }]]) {
      const r = await run(h, { body, token: newToken() });
      bodies.push(r.raw || "");
    }
    for (const b of bodies) expect(b).not.toMatch(/sk-test|Bearer|fb\b|wa\b/);
  });
});
