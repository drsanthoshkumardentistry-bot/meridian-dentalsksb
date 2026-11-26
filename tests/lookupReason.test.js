import { describe, it, expect, afterEach } from "vitest";
import { lookupUser } from "../api/_lib/loginAlertCore.js";

const resp = (status, body) => ({ ok: status < 300, status, json: async () => body });
afterEach(() => { delete process.env.FIREBASE_API_KEY; delete process.env.VITE_FIREBASE_API_KEY; delete process.env.SITE_URL; });

describe("sign-in lookup says why it failed", () => {
  it("names a missing key, a missing token and Google's own answer", async () => {
    let d = {};
    expect(await lookupUser("t", async () => resp(200, {}), d)).toBeNull();
    expect(d.why).toMatch(/FIREBASE_API_KEY/);
    process.env.FIREBASE_API_KEY = "k";
    d = {}; await lookupUser("", async () => resp(200, {}), d); expect(d.why).toMatch(/No sign-in token/);
    d = {}; await lookupUser("t", async () => resp(403, { error: { message: "Requests from referer <empty> are blocked." } }), d);
    expect(d.why).toBe("Google answered 403: Requests from referer <empty> are blocked.");
    d = {}; await lookupUser("t", async () => resp(200, { users: [{ localId: "u", email: "a@x.com", emailVerified: false }] }), d);
    expect(d.why).toMatch(/not verified/);
  });
  it("sends the site as referrer and returns the user when all is well", async () => {
    process.env.FIREBASE_API_KEY = "k"; process.env.SITE_URL = "https://www.example.com/";
    let sent;
    const u = await lookupUser("t", async (_url, init) => { sent = init.headers; return resp(200, { users: [{ localId: "u1", email: "A@x.com", emailVerified: true }] }); });
    expect(sent.Referer).toBe("https://www.example.com/");
    expect(u).toMatchObject({ uid: "u1", email: "a@x.com" });
  });
});
