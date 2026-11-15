import { describe, it, expect, beforeEach, vi } from "vitest";
import crypto from "node:crypto";

const { privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });
const SA = JSON.stringify({ client_email: "s@p.iam.gserviceaccount.com", private_key: privateKey, project_id: "proj" });
const res = () => { const r = { statusCode: 0, body: "", setHeader() {}, end(b) { r.body = b == null ? "" : String(b); } }; return r; };
const user = (lastLoginAt) => ({ ok: true, status: 200, json: async () => ({ users: [{ localId: "uidA", email: "a@b.in", emailVerified: true, createdAt: "1600000000000", lastLoginAt: String(lastLoginAt) }] }) });

let handler, calls;
const run = async (body, { login = Date.now(), auth = "Bearer t", method = "POST" } = {}) => {
  calls = [];
  global.fetch = vi.fn(async (url, init = {}) => {
    const u = String(url); calls.push(u);
    if (u.includes("accounts:lookup")) return user(login);
    if (u.includes("api.resend.com")) { mails.push(JSON.parse(init.body)); return { ok: true, status: 200, json: async () => ({}) }; }
    if (u.includes("oauth2")) return { ok: true, status: 200, json: async () => ({ access_token: "t" }) };
    if (u.includes(":listCollectionIds")) return { ok: true, status: 200, json: async () => ({}) };
    if (u.includes(":runQuery")) return { ok: true, status: 200, json: async () => [{}] };
    return { ok: true, status: 200, json: async () => ({}) };
  });
  const r = res(); await handler({ method, headers: { authorization: auth }, body }, r); return r;
};
const mails = [];
const withMail = () => { process.env.RESEND_API_KEY = "rk"; };
beforeEach(async () => { mails.length = 0; delete process.env.RESEND_API_KEY; process.env.VITE_FIREBASE_API_KEY = "k"; process.env.FIREBASE_SERVICE_ACCOUNT = SA; vi.resetModules(); handler = (await import("../api/delete-account.js")).default; });

// Asks for a code, reads it from the "email" the fake mail service received, and returns what the browser would send.
const getCode = async () => {
  withMail();
  const r = await run({ confirm: "DELETE", step: "request" });
  const m = mails[mails.length - 1];
  return { r, code: m ? /Your code is (\d{8})/.exec(m.text)[1] : "", ticket: JSON.parse(r.body).ticket, mail: m };
};

describe("POST /api/delete-account", () => {
  it("deletes after a recent sign-in with the typed confirmation", async () => {
    const { code, ticket } = await getCode();
    const r = await run({ confirm: "DELETE", code, ticket });
    expect(r.statusCode).toBe(200); expect(JSON.parse(r.body)).toEqual({ done: true });
    expect(calls.some((u) => u.includes("accounts:delete"))).toBe(true);
  });
  it("asks for a fresh sign-in when the last one was long ago, and deletes nothing", async () => {
    const r = await run({ confirm: "DELETE" }, { login: Date.now() - 3600e3 });
    expect(r.statusCode).toBe(403); expect(JSON.parse(r.body).code).toBe("recent-login");
    expect(calls.some((u) => u.includes("batchWrite") || u.includes("accounts:delete"))).toBe(false);
  });
  it("needs the exact confirmation, a sign-in and the right method", async () => {
    for (const body of [{}, { confirm: "delete" }, { confirm: true }, "junk {", null]) expect((await run(body)).statusCode).toBe(400);
    expect((await run({ confirm: "DELETE" }, { method: "GET" })).statusCode).toBe(405);
    global.fetch = vi.fn(async () => ({ ok: false, status: 400, json: async () => ({}) }));
    const r = res(); await handler({ method: "POST", headers: { authorization: "Bearer bad" }, body: { confirm: "DELETE" } }, r); expect(r.statusCode).toBe(401);
  });
  it("is off (503) without the service account", async () => {
    delete process.env.FIREBASE_SERVICE_ACCOUNT; vi.resetModules(); handler = (await import("../api/delete-account.js")).default;
    expect((await run({ confirm: "DELETE" })).statusCode).toBe(503);
  });
  it("emails an 8-digit code to the account's own address and never returns the code", async () => {
    const { r, mail, code } = await getCode();
    expect(r.statusCode).toBe(200);
    expect(mail.to).toEqual(["a@b.in"]);
    expect(code).toMatch(/^\d{8}$/);
    expect(r.body).not.toContain(code);
    expect(JSON.parse(r.body).to).toBe("a**@b.in");
  });
  it("deletes nothing without a code, with a wrong code, with someone else's ticket, or after it expires", async () => {
    const { code, ticket } = await getCode();
    const wrong = code === "00000000" ? "11111111" : "00000000";
    for (const body of [{ confirm: "DELETE" }, { confirm: "DELETE", code, ticket: "" }, { confirm: "DELETE", code: wrong, ticket }, { confirm: "DELETE", code, ticket: ticket.replace(/.$/, (c) => (c === "0" ? "1" : "0")) }, { confirm: "DELETE", code: "abc", ticket }]) {
      const r = await run(body);
      expect(r.statusCode).toBe(400); expect(JSON.parse(r.body).code).toBe("bad-code");
    }
    const old = await run({ confirm: "DELETE", code, ticket: `${Date.now() - 1000}.${ticket.split(".")[1]}` });
    expect(old.statusCode).toBe(400);
    expect(calls.some((u) => u.includes("batchWrite") || u.includes("accounts:delete"))).toBe(false);
  });
  it("fails closed with a clear message when email is not set up, and sends nothing", async () => {
    const r = await run({ confirm: "DELETE", step: "request" });
    expect(r.statusCode).toBe(503); expect(JSON.parse(r.body).code).toBe("no-mail");
    expect(mails).toHaveLength(0);
    const d = await run({ confirm: "DELETE", code: "12345678", ticket: "1.2" });
    expect(d.statusCode).toBe(400);
  });
  it("needs a recent sign-in even to get a code, limits codes to 3 an hour, and counts wrong guesses", async () => {
    withMail();
    expect((await run({ confirm: "DELETE", step: "request" }, { login: Date.now() - 3600e3 })).statusCode).toBe(403);
    for (let i = 0; i < 3; i++) expect((await run({ confirm: "DELETE", step: "request" })).statusCode).toBe(200);
    expect((await run({ confirm: "DELETE", step: "request" })).statusCode).toBe(429);
    let last = 0; for (let i = 0; i < 14; i++) last = (await run({ confirm: "DELETE", code: "00000000", ticket: "1.2" })).statusCode;
    expect(last).toBe(429);
  });
  it("only ever deletes the caller's own clinic", async () => {
    const { code, ticket } = await getCode();
    await run({ confirm: "DELETE", uid: "someoneElse", clinicId: "someoneElse", code, ticket });
    expect(calls.filter((u) => u.includes("someoneElse"))).toEqual([]);
  });
});
