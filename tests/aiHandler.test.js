import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import handler from "../api/ai.js";

const makeRes = () => { const r = { headers: {}, setHeader(k, v) { r.headers[k] = v; }, end(b) { r.body = JSON.parse(b); } }; return r; };
const call = async (body, token = "good") => {
  const res = makeRes();
  await handler({ method: "POST", body, headers: token ? { authorization: `Bearer ${token}` } : {} }, res);
  return res;
};

beforeEach(() => {
  process.env.ANTHROPIC_API_KEY = "sk-test";
  process.env.VITE_FIREBASE_API_KEY = "fb-test";
  global.fetch = vi.fn(async (url, opts) => {
    if (String(url).includes("identitytoolkit")) {
      const ok = JSON.parse(opts.body).idToken === "good";
      return { ok, json: async () => ({ users: [{ localId: "u1" }] }) };
    }
    return { ok: true, json: async () => ({ content: [{ type: "text", text: JSON.stringify({ complaint: "Pain", findings: "", treatment: "", advice: "", nextVisit: "" }) }] }) };
  });
});
afterEach(() => { delete process.env.ANTHROPIC_API_KEY; });

describe("/api/ai", () => {
  it("rejects when not signed in", async () => {
    const res = await call({ task: "visit_note", notes: "pain lower left caries" }, "bad");
    expect(res.statusCode).toBe(401);
  });
  it("is off until the key is set", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    expect((await call({ task: "visit_note", notes: "pain lower left caries" })).statusCode).toBe(503);
  });
  it("returns a visit note for a signed-in user and never sends the Firebase token onward", async () => {
    const res = await call({ task: "visit_note", notes: "pain lower left caries 36" });
    expect(res.statusCode).toBe(200);
    expect(res.body.note.complaint).toBe("Pain");
    const anthropic = global.fetch.mock.calls.find((c) => String(c[0]).includes("anthropic"));
    expect(anthropic[1].headers["x-api-key"]).toBe("sk-test");
    expect(anthropic[1].body).not.toContain("good");
  });
  it("answers 400 for bad input", async () => {
    expect((await call({ task: "plan_explain", items: [] })).statusCode).toBe(400);
  });
  it("only accepts POST", async () => {
    const res = makeRes();
    await handler({ method: "GET", headers: {} }, res);
    expect(res.statusCode).toBe(405);
  });
});
