import { describe, it, expect, vi } from "vitest";
import { startAppCheck } from "../src/appCheck";

const mk = (throws) => {
  const init = vi.fn(() => { if (throws) throw new Error("x"); });
  class P { constructor(k) { this.k = k; } }
  return { init, deps: { initializeAppCheck: init, ReCaptchaV3Provider: P } };
};
describe("startAppCheck", () => {
  it("does nothing without a key", () => {
    const { init, deps } = mk();
    for (const k of [undefined, "", "   ", null, 5]) expect(startAppCheck({}, k, undefined, deps)).toBe(false);
    expect(init).not.toHaveBeenCalled();
  });
  it("does nothing without an app", () => {
    const { init, deps } = mk();
    expect(startAppCheck(null, "key", undefined, deps)).toBe(false);
    expect(init).not.toHaveBeenCalled();
  });
  it("starts with the key and refreshes tokens", () => {
    const { init, deps } = mk();
    expect(startAppCheck({ a: 1 }, " abc ", undefined, deps)).toBe(true);
    const [, opts] = init.mock.calls[0];
    expect(opts.provider.k).toBe("abc");
    expect(opts.isTokenAutoRefreshEnabled).toBe(true);
  });
  it("never throws if Firebase refuses", () => {
    const { deps } = mk(true);
    expect(startAppCheck({}, "abc", undefined, deps)).toBe(false);
  });
});

import { turnstileProvider, getTurnstileToken } from "../src/appCheck";
import { verifyTurnstile, buildCustomToken, mintAppCheckToken, EXCHANGE_AUD } from "../api/_lib/appCheckCore.js";
import handler from "../api/appcheck-token.js";
import crypto from "node:crypto";

describe("Turnstile App Check (browser)", () => {
  it("prefers Turnstile when its key is set", () => {
    const init = vi.fn();
    const mkp = vi.fn((k) => ({ ts: k }));
    expect(startAppCheck({ a: 1 }, "recaptcha", " tskey ", { initializeAppCheck: init, ReCaptchaV3Provider: class {}, turnstileProvider: mkp })).toBe(true);
    expect(mkp).toHaveBeenCalledWith("tskey");
    expect(init.mock.calls[0][1].provider).toEqual({ ts: "tskey" });
  });
  it("trades a Turnstile answer for an App Check token", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ token: "T", expireTimeMillis: 99 }) }));
    let opts;
    class CP { constructor(o) { opts = o; } }
    turnstileProvider("site", { fetch: fetchMock, CustomProvider: CP, getToken: async () => "answer" });
    expect(await opts.getToken()).toEqual({ token: "T", expireTimeMillis: 99 });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ turnstile: "answer" });
  });
  it("fails the provider when the server refuses", async () => {
    let opts;
    class CP { constructor(o) { opts = o; } }
    turnstileProvider("site", { fetch: async () => ({ ok: false }), CustomProvider: CP, getToken: async () => "a" });
    await expect(opts.getToken()).rejects.toThrow();
  });
  it("renders the widget in a hidden box and cleans it up", async () => {
    const ts = { render: vi.fn((el, o) => o.callback("tok")) };
    expect(await getTurnstileToken("site", { load: async () => ts })).toBe("tok");
    expect(ts.render.mock.calls[0][1].sitekey).toBe("site");
    expect(document.body.querySelectorAll("div[style*='fixed']").length).toBe(0);
  });
});

const { privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
const sa = { client_email: "svc@p.iam.gserviceaccount.com", project_id: "proj", private_key: privateKey.export({ type: "pkcs8", format: "pem" }) };

describe("Turnstile App Check (server)", () => {
  it("verifies the answer with Cloudflare", async () => {
    const f = vi.fn(async () => ({ ok: true, json: async () => ({ success: true }) }));
    expect(await verifyTurnstile("tok", "sec", "1.2.3.4", f)).toBe(true);
    expect(f.mock.calls[0][1].body).toContain("remoteip=1.2.3.4");
    expect(await verifyTurnstile("", "sec", "ip", f)).toBe(false);
    expect(await verifyTurnstile("tok", "", "ip", f)).toBe(false);
    expect(await verifyTurnstile("tok", "sec", "ip", async () => ({ ok: true, json: async () => ({ success: false }) }))).toBe(false);
    expect(await verifyTurnstile("tok", "sec", "ip", async () => { throw new Error("net"); })).toBe(false);
  });
  it("signs a custom token for the web app", async () => {
    const jwt = await buildCustomToken(sa, "1:2:web:3", 1_700_000_000_000);
    const [h, c, s] = jwt.split(".");
    const claim = JSON.parse(Buffer.from(c, "base64url").toString());
    expect(claim).toMatchObject({ iss: sa.client_email, aud: EXCHANGE_AUD, app_id: "1:2:web:3", exp: 1_700_000_300 });
    expect(crypto.verify("RSA-SHA256", Buffer.from(`${h}.${c}`), privateKey, Buffer.from(s, "base64url"))).toBe(true);
  });
  it("exchanges it for an App Check token", async () => {
    const calls = [];
    const f = async (url, init) => {
      calls.push(url);
      if (url.includes("oauth2")) return { ok: true, json: async () => ({ access_token: "acc" }) };
      return { ok: true, json: async () => ({ token: "AC", ttl: "1800s" }) };
    };
    const out = await mintAppCheckToken(sa, "appid", f, 1000);
    expect(out).toEqual({ token: "AC", expireTimeMillis: 1000 + 1_800_000 });
    expect(calls[1]).toContain("/projects/proj/apps/appid:exchangeCustomToken");
    await expect(mintAppCheckToken(sa, "appid", async (u) => (u.includes("oauth2") ? { ok: true, json: async () => ({ access_token: "a" }) } : { ok: false }))).rejects.toThrow();
  });
  it("the endpoint refuses safely when not set up or the check fails", async () => {
    const run = async (method = "POST", body = { turnstile: "x" }) => {
      const res = { statusCode: 0, headers: {}, setHeader() {}, end(d) { this.body = d; } };
      await handler({ method, headers: { "cf-connecting-ip": "9.9.9.9" }, body }, res);
      return res;
    };
    expect((await run("GET")).statusCode).toBe(405);
    delete process.env.TURNSTILE_SECRET_KEY; delete process.env.FIREBASE_SERVICE_ACCOUNT;
    expect((await run()).statusCode).toBe(503);
    process.env.TURNSTILE_SECRET_KEY = "s"; process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify(sa); process.env.APPCHECK_APP_ID = "app";
    const orig = globalThis.fetch;
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ success: false }) });
    expect((await run()).statusCode).toBe(403);
    globalThis.fetch = orig;
    delete process.env.TURNSTILE_SECRET_KEY; delete process.env.FIREBASE_SERVICE_ACCOUNT; delete process.env.APPCHECK_APP_ID;
  });
});
