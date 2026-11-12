import { describe, it, expect, vi, beforeEach } from "vitest";
import handler from "../api/login-alert.js";
import { buildAlert } from "../api/_lib/loginAlertCore.js";

const makeRes = () => { const r = { headers: {}, setHeader(k, v) { r.headers[k] = v; }, end(b) { r.body = b ? JSON.parse(b) : null; } }; return r; };
const call = async (token = "good") => { const res = makeRes(); await handler({ method: "POST", headers: token ? { authorization: `Bearer ${token}` } : {} }, res); return res; };
let sent;
beforeEach(() => {
  process.env.RESEND_API_KEY = "re_test"; process.env.LOGIN_ALERT_TO = "owner@example.com"; process.env.VITE_FIREBASE_API_KEY = "fb";
  sent = [];
  global.fetch = vi.fn(async (url, opts) => {
    if (String(url).includes("identitytoolkit")) {
      const t = JSON.parse(opts.body).idToken;
      if (t === "bad") return { ok: false, json: async () => ({}) };
      const email = t === "owner" ? "owner@example.com" : t === "unverified" ? "x@example.com" : "asha@example.com";
      return { ok: true, json: async () => ({ users: [{ localId: t + "-uid", email, emailVerified: t !== "unverified", displayName: "Asha", createdAt: "1000", lastLoginAt: "2000" }] }) };
    }
    sent.push(JSON.parse(opts.body)); return { ok: true, json: async () => ({}) };
  });
});

describe("/api/login-alert", () => {
  it("does nothing until the email service is set up", async () => {
    delete process.env.RESEND_API_KEY;
    expect((await call()).statusCode).toBe(204);
    expect(sent.length).toBe(0);
  });
  it("rejects callers who are not signed in or not verified", async () => {
    expect((await call("bad")).statusCode).toBe(401);
    expect((await call("unverified")).statusCode).toBe(401);
    expect(sent.length).toBe(0);
  });
  it("emails the owner who signed in, not the owner's own sign-in", async () => {
    const res = await call("good");
    expect(res.statusCode).toBe(200);
    expect(sent[0]).toMatchObject({ to: ["owner@example.com"], subject: "asha@example.com logged in to MeriDent" });
    expect((await call("owner")).statusCode).toBe(204);
    expect(sent.length).toBe(1);
  });
  it("limits one person to a few alerts an hour", async () => {
    let last; for (let i = 0; i < 6; i++) last = await call("good");
    expect(last.statusCode).toBe(429);
  });
  it("escapes the name in the email and gives the time in IST", () => {
    const m = buildAlert({ email: "a@b.c", name: "<b>x</b>" }, new Date("2026-11-12T10:00:00Z"));
    expect(m.html).not.toContain("<b>x</b>");
    expect(m.text).toMatch(/3:30 pm IST|03:30 pm IST/i);
  });
});
