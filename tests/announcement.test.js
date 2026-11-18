import { describe, it, expect, vi, afterEach } from "vitest";
import crypto from "node:crypto";
import { getAnnouncement, setAnnouncement, cleanText } from "../api/_lib/announceCore.js";
import { dec } from "../api/_lib/fsLite.js";
import handler from "../api/announcement.js";

const { privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });
const sa = { client_email: "s@p.iam.gserviceaccount.com", private_key: privateKey, project_id: "proj" };
const fakeFirestore = () => {
  const docs = new Map();
  const fetchFn = async (url, init = {}) => {
    const u = String(url);
    if (u.includes("oauth2")) return { ok: true, json: async () => ({ access_token: "t" }) };
    const m = u.match(/documents\/([^?]+)(\?.*)?$/);
    const path = decodeURIComponent(m[1]);
    if ((init.method || "GET") === "PATCH") { docs.set(path, JSON.parse(init.body).fields); return { ok: true, status: 200, json: async () => ({}) }; }
    if (!docs.has(path)) return { ok: false, status: 404, json: async () => ({}) };
    return { ok: true, status: 200, json: async () => ({ fields: docs.get(path) }) };
  };
  return { docs, fetchFn };
};
const run = async (method, headers = {}, body) => {
  const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = b ? JSON.parse(b) : null; } };
  await handler({ method, headers, body }, res);
  return res;
};
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("announcement core", () => {
  it("cleans text to plain, short text", () => {
    expect(cleanText("  Hello\n\n  world\u0000  ")).toBe("Hello world");
    expect(cleanText("x".repeat(500)).length).toBe(240);
    expect(cleanText(null)).toBe("");
  });
  it("publishes, reads, and clears", async () => {
    const fs = fakeFirestore();
    expect((await getAnnouncement({ sa, fetchFn: fs.fetchFn })).active).toBe(false);
    const a = await setAnnouncement({ sa, text: "Update tonight", level: "warning", fetchFn: fs.fetchFn, now: 1000 });
    expect(a).toMatchObject({ active: true, id: "1000", level: "warning" });
    expect(await getAnnouncement({ sa, fetchFn: fs.fetchFn })).toMatchObject({ active: true, text: "Update tonight", level: "warning", id: "1000" });
    const b = await setAnnouncement({ sa, text: "Again", fetchFn: fs.fetchFn, now: 2000 });
    expect(b.id).toBe("2000"); // a new id so earlier dismissals do not hide it
    await setAnnouncement({ sa, text: "   ", fetchFn: fs.fetchFn, now: 3000 });
    expect((await getAnnouncement({ sa, fetchFn: fs.fetchFn })).active).toBe(false);
    await expect(setAnnouncement({ sa, text: "x", level: "loud", fetchFn: fs.fetchFn })).rejects.toThrow("level");
    expect(dec(fs.docs.get("announcements/current")).active).toBe(false);
  });
});

describe("announcement endpoint", () => {
  const user = (email) => async (u, init) => (String(u).includes("accounts:lookup") ? { ok: true, json: async () => ({ users: [{ localId: "uidA1234", email, emailVerified: true }] }) } : null);
  const wire = (email, fs) => {
    vi.stubEnv("VITE_FIREBASE_API_KEY", "k");
    vi.stubEnv("FIREBASE_SERVICE_ACCOUNT", JSON.stringify(sa));
    vi.stubEnv("FOUNDER_EMAILS", "boss@x.com");
    vi.stubGlobal("fetch", async (u, init) => (await user(email)(u, init)) || fs.fetchFn(u, init));
  };
  it("needs sign-in and the right method", async () => {
    vi.stubEnv("VITE_FIREBASE_API_KEY", "k");
    expect((await run("PUT")).statusCode).toBe(405);
    vi.stubGlobal("fetch", async () => ({ ok: false, status: 400, json: async () => ({}) }));
    expect((await run("GET", {})).statusCode).toBe(401);
  });
  it("any clinic can read it but only the founder can write", async () => {
    const fs = fakeFirestore();
    await setAnnouncement({ sa, text: "Hello clinics", fetchFn: fs.fetchFn, now: 5 });
    wire("clinic@x.com", fs);
    const g = await run("GET", { authorization: "Bearer t" });
    expect(g.statusCode).toBe(200);
    expect(g.body).toMatchObject({ active: true, text: "Hello clinics" });
    const w = await run("POST", { authorization: "Bearer t" }, { text: "Hacked" });
    expect(w.statusCode).toBe(403);
    expect((await getAnnouncement({ sa, fetchFn: fs.fetchFn })).text).toBe("Hello clinics");
  });
  it("the founder publishes and clears; bad input is refused", async () => {
    const fs = fakeFirestore();
    wire("boss@x.com", fs);
    const p = await run("POST", { authorization: "Bearer t" }, { text: "<b>Maintenance</b> at 11 pm", level: "warning" });
    expect(p.statusCode).toBe(200);
    expect(p.body.text).toBe("<b>Maintenance</b> at 11 pm"); // stored as plain text; the page shows it as text, never as markup
    expect((await run("POST", { authorization: "Bearer t" }, { text: "x", level: "loud" })).statusCode).toBe(400);
    expect((await run("POST", { authorization: "Bearer t" }, "{oops")).statusCode).toBe(400);
    const c = await run("POST", { authorization: "Bearer t" }, { text: "" });
    expect(c.body.active).toBe(false);
    expect((await run("GET", { authorization: "Bearer t" })).body.active).toBe(false);
  });
  it("is quiet when the server is not set up", async () => {
    vi.stubEnv("VITE_FIREBASE_API_KEY", "k");
    vi.stubEnv("FOUNDER_EMAILS", "boss@x.com");
    vi.stubGlobal("fetch", async (u) => (String(u).includes("accounts:lookup") ? { ok: true, json: async () => ({ users: [{ localId: "uidA1234", email: "boss@x.com", emailVerified: true }] }) } : { ok: false, status: 500, json: async () => ({}) }));
    expect((await run("GET", { authorization: "Bearer t" })).body.active).toBe(false);
    expect((await run("POST", { authorization: "Bearer t" }, { text: "x" })).statusCode).toBe(503);
  });
});
