import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "node:crypto";
import handler from "../api/block-login.js";
import loginAlert from "../api/login-alert.js";
import { readServiceAccount, signLink, verifyLink, buildLink, setBlocked } from "../api/_lib/blockCore.js";
import { buildAlert } from "../api/_lib/loginAlertCore.js";

const { privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });
const SA_JSON = JSON.stringify({ client_email: "svc@proj.iam.gserviceaccount.com", private_key: privateKey, project_id: "proj" });
const sa = readServiceAccount(SA_JSON);
const makeRes = () => { const r = { headers: {}, statusCode: 200, setHeader(k, v) { r.headers[k] = v; }, end(b) { r.raw = b; } }; return r; };
const run = async (method, url) => { const res = makeRes(); await handler({ method, url, headers: {} }, res); return res; };
const pathOf = (link) => link.replace("https://www.meridiandentalos.com", "");
let calls;
beforeEach(() => {
  process.env.FIREBASE_SERVICE_ACCOUNT = SA_JSON;
  calls = [];
  global.fetch = vi.fn(async (url, opts) => {
    calls.push({ url: String(url), body: opts && opts.body, headers: opts && opts.headers });
    if (String(url).includes("oauth2.googleapis.com")) return { ok: true, json: async () => ({ access_token: "tok123" }) };
    return { ok: true, json: async () => ({}) };
  });
});

describe("signed block link", () => {
  it("accepts its own link and refuses tampering, other actions and expired links", () => {
    const link = new URL(buildLink("https://x.test", sa, "uid1", "block", "A@b.com", 1000));
    const p = Object.fromEntries(link.searchParams);
    expect(verifyLink(sa, p, 2000)).toBe(true);
    expect(verifyLink(sa, { ...p, u: "uid2" }, 2000)).toBe(false);
    expect(verifyLink(sa, { ...p, a: "unblock" }, 2000)).toBe(false);
    expect(verifyLink(sa, { ...p, n: "evil@b.com" }, 2000)).toBe(false);
    expect(verifyLink(sa, { ...p, s: "00" + p.s.slice(2) }, 2000)).toBe(false);
    expect(verifyLink(sa, { ...p, s: "zz" }, 2000)).toBe(false);
    expect(verifyLink(sa, p, Number(p.e) + 1)).toBe(false);
    expect(verifyLink(sa, { ...p, a: "delete" }, 2000)).toBe(false);
    expect(verifyLink(null, p, 2000)).toBe(false);
  });
  it("a link made with a different key does not verify", () => {
    const other = readServiceAccount(JSON.stringify({ client_email: "a@b", project_id: "p", private_key: crypto.generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } }).privateKey }));
    const p = Object.fromEntries(new URL(buildLink("https://x.test", other, "u", "block", "a@b.com")).searchParams);
    expect(verifyLink(sa, p)).toBe(false);
  });
  it("reads the service account as JSON or base64 and rejects incomplete ones", () => {
    expect(readServiceAccount(Buffer.from(SA_JSON).toString("base64")).project_id).toBe("proj");
    expect(readServiceAccount("{}")).toBeNull();
    expect(readServiceAccount("nonsense")).toBeNull();
    expect(readServiceAccount(null)).toBeNull();
  });
});

describe("setBlocked", () => {
  it("asks Firebase to disable the account and end its sessions", async () => {
    await setBlocked(sa, "uid9", true, global.fetch, 1700000000000);
    expect(calls[0].url).toContain("oauth2.googleapis.com/token");
    expect(calls[0].body).toContain("jwt-bearer");
    expect(calls[1].url).toBe("https://identitytoolkit.googleapis.com/v1/projects/proj/accounts:update");
    expect(calls[1].headers.Authorization).toBe("Bearer tok123");
    expect(JSON.parse(calls[1].body)).toEqual({ localId: "uid9", disableUser: true, validSince: "1700000000" });
  });
  it("switches the account back on without touching sessions", async () => {
    await setBlocked(sa, "uid9", false);
    expect(JSON.parse(calls[1].body)).toEqual({ localId: "uid9", disableUser: false });
  });
  it("the sign-in token request is a real RS256 JWT signed with the service key", async () => {
    await setBlocked(sa, "u", true);
    const jwt = new URLSearchParams(calls[0].body).get("assertion").split(".");
    const ok = crypto.createVerify("RSA-SHA256").update(jwt[0] + "." + jwt[1]).verify(crypto.createPublicKey(privateKey), Buffer.from(jwt[2].replace(/-/g, "+").replace(/_/g, "/"), "base64"));
    expect(ok).toBe(true);
    expect(JSON.parse(Buffer.from(jwt[1], "base64").toString()).iss).toBe("svc@proj.iam.gserviceaccount.com");
  });
});

describe("/api/block-login", () => {
  const goodLink = () => pathOf(buildLink("https://www.meridiandentalos.com", sa, "uid1", "block", "asha@example.com"));
  it("opening the link only shows a confirmation and changes nothing", async () => {
    const res = await run("GET", goodLink());
    expect(res.statusCode).toBe(200);
    expect(res.raw).toContain("asha@example.com");
    expect(res.raw).toContain('method="post"');
    expect(calls.length).toBe(0);
  });
  it("pressing the button blocks the account and offers an undo link", async () => {
    const res = await run("POST", goodLink());
    expect(res.statusCode).toBe(200);
    expect(res.raw).toContain("Login blocked");
    expect(JSON.parse(calls[1].body).disableUser).toBe(true);
    const undo = /href="([^"]+)"/.exec(res.raw)[1].replace(/&amp;/g, "&");
    const un = await run("POST", pathOf(undo));
    expect(un.raw).toContain("Login allowed again");
    expect(JSON.parse(calls[3].body).disableUser).toBe(false);
  });
  it("refuses forged, edited and expired links", async () => {
    const p = goodLink();
    expect((await run("POST", p.replace("uid1", "uid2"))).statusCode).toBe(400);
    expect((await run("POST", "/api/block-login?u=uid1&a=block&e=1&n=x&s=ab")).statusCode).toBe(400);
    expect((await run("POST", "/api/block-login")).statusCode).toBe(400);
    expect(calls.length).toBe(0);
  });
  it("says it is not set up when there is no service account, and refuses other methods", async () => {
    delete process.env.FIREBASE_SERVICE_ACCOUNT;
    expect((await run("POST", goodLink())).statusCode).toBe(503);
    process.env.FIREBASE_SERVICE_ACCOUNT = SA_JSON;
    expect((await run("DELETE", goodLink())).statusCode).toBe(405);
  });
  it("escapes the e-mail address on the page", async () => {
    const link = pathOf(buildLink("https://www.meridiandentalos.com", sa, "u", "block", '<script>alert(1)</script>@x.com'));
    const res = await run("GET", link);
    expect(res.raw).not.toContain("<script>alert");
  });
  it("reports a Firebase failure instead of claiming success", async () => {
    global.fetch = vi.fn(async (url) => (String(url).includes("oauth2") ? { ok: true, json: async () => ({ access_token: "t" }) } : { ok: false, json: async () => ({}) }));
    const res = await run("POST", goodLink());
    expect(res.statusCode).toBe(502);
    expect(res.raw).not.toContain("Login blocked");
  });
});

describe("sign-in alert e-mail", () => {
  it("contains the block link when set up, and none when not", () => {
    expect(buildAlert({ email: "a@b.com", blockUrl: "https://x/api/block-login?u=1" }).text).toContain("https://x/api/block-login?u=1");
    expect(buildAlert({ email: "a@b.com", blockUrl: "https://x/?a=1&b=2" }).html).toContain("a=1&amp;b=2");
    expect(buildAlert({ email: "a@b.com" }).text).not.toContain("Block this login");
  });
  it("the alert endpoint adds a working signed link for the person who signed in", async () => {
    process.env.RESEND_API_KEY = "re"; process.env.LOGIN_ALERT_TO = "owner@example.com"; process.env.VITE_FIREBASE_API_KEY = "fb";
    const sent = [];
    global.fetch = vi.fn(async (url, opts) => {
      if (String(url).includes("identitytoolkit")) return { ok: true, json: async () => ({ users: [{ localId: "uid-77", email: "new@example.com", emailVerified: true, createdAt: "1", lastLoginAt: "2" }] }) };
      sent.push(JSON.parse(opts.body)); return { ok: true, json: async () => ({}) };
    });
    const res = makeRes(); await loginAlert({ method: "POST", headers: { authorization: "Bearer t" } }, res);
    const link = /(https:\/\/www\.meridiandentalos\.com\/api\/block-login\?[^\s]+)/.exec(sent[0].text)[1];
    const p = Object.fromEntries(new URL(link).searchParams);
    expect(p.u).toBe("uid-77");
    expect(verifyLink(sa, p)).toBe(true);
  });
});
