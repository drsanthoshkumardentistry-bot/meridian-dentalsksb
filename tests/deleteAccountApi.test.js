import { describe, it, expect, beforeEach, vi } from "vitest";
import crypto from "node:crypto";

const { privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });
const SA = JSON.stringify({ client_email: "s@p.iam.gserviceaccount.com", private_key: privateKey, project_id: "proj" });
const res = () => { const r = { statusCode: 0, body: "", setHeader() {}, end(b) { r.body = b == null ? "" : String(b); } }; return r; };
const user = (lastLoginAt) => ({ ok: true, status: 200, json: async () => ({ users: [{ localId: "uidA", email: "a@b.in", emailVerified: true, createdAt: "1600000000000", lastLoginAt: String(lastLoginAt) }] }) });

let handler, calls;
const run = async (body, { login = Date.now(), auth = "Bearer t", method = "POST" } = {}) => {
  calls = [];
  global.fetch = vi.fn(async (url) => {
    const u = String(url); calls.push(u);
    if (u.includes("accounts:lookup")) return user(login);
    if (u.includes("oauth2")) return { ok: true, status: 200, json: async () => ({ access_token: "t" }) };
    if (u.includes(":listCollectionIds")) return { ok: true, status: 200, json: async () => ({}) };
    if (u.includes(":runQuery")) return { ok: true, status: 200, json: async () => [{}] };
    return { ok: true, status: 200, json: async () => ({}) };
  });
  const r = res(); await handler({ method, headers: { authorization: auth }, body }, r); return r;
};
beforeEach(async () => { process.env.VITE_FIREBASE_API_KEY = "k"; process.env.FIREBASE_SERVICE_ACCOUNT = SA; vi.resetModules(); handler = (await import("../api/delete-account.js")).default; });

describe("POST /api/delete-account", () => {
  it("deletes after a recent sign-in with the typed confirmation", async () => {
    const r = await run({ confirm: "DELETE" });
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
  it("only ever deletes the caller's own clinic", async () => {
    await run({ confirm: "DELETE", uid: "someoneElse", clinicId: "someoneElse" });
    expect(calls.filter((u) => u.includes("someoneElse"))).toEqual([]);
  });
});
