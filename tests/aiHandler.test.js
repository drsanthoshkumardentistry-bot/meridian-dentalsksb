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
  delete process.env.GEMINI_API_KEY;
  process.env.VITE_FIREBASE_API_KEY = "fb-test";
  global.fetch = vi.fn(async (url, opts) => {
    if (String(url).includes("identitytoolkit")) {
      const ok = JSON.parse(opts.body).idToken === "good";
      return { ok, json: async () => ({ users: [{ localId: "u1" }] }) };
    }
    return { ok: true, json: async () => ({ content: [{ type: "text", text: JSON.stringify({ complaint: "Pain", findings: "", treatment: "", advice: "", nextVisit: "" }) }] }) };
  });
});
afterEach(() => { delete process.env.ANTHROPIC_API_KEY; delete process.env.GEMINI_API_KEY; });

describe("/api/ai", () => {
  it("rejects when not signed in", async () => {
    const res = await call({ task: "visit_note", notes: "pain lower left caries" }, "bad");
    expect(res.statusCode).toBe(401);
  });
  it("is off until the key is set", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GEMINI_API_KEY;
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
  it("uses the free Gemini key when set and sends no Firebase token", async () => {
    process.env.GEMINI_API_KEY = "gem-test";
    global.fetch = vi.fn(async (url) => {
      if (String(url).includes("identitytoolkit")) return { ok: true, json: async () => ({ users: [{ localId: "u1" }] }) };
      return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: "{\"complaint\":\"Pain\",\"findings\":\"\",\"treatment\":\"\",\"advice\":\"\",\"nextVisit\":\"\"}" }] } }] }) };
    });
    const res = await call({ task: "visit_note", notes: "pain lower left caries 36" });
    expect(res.statusCode).toBe(200);
    expect(res.body.note.complaint).toBe("Pain");
    const g = global.fetch.mock.calls.find((c) => String(c[0]).includes("generativelanguage"));
    expect(g[1].headers["x-goog-api-key"]).toBe("gem-test");
    expect(g[1].body).not.toContain("good");
  });
  it("falls back to the next Gemini model when one is retired", async () => {
    process.env.GEMINI_API_KEY = "gem-test";
    global.fetch = vi.fn(async (url) => {
      if (String(url).includes("identitytoolkit")) return { ok: true, json: async () => ({ users: [{ localId: "u4" }] }) };
      if (String(url).includes("gemini-3.8-flash:")) return { ok: false, status: 404, json: async () => ({}) };
      return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: "Open Billing." }] } }] }) };
    });
    const res = await call({ task: "help", messages: [{ role: "user", content: "how to bill" }] });
    expect(res.statusCode).toBe(200);
    const urls = global.fetch.mock.calls.map((c) => String(c[0])).filter((u) => u.includes("generativelanguage"));
    expect(urls[0]).toContain("gemini-3.8-flash");
    expect(urls[1]).toContain("gemini-flash-latest");
  });
  it("says busy when Gemini's free limit is reached", async () => {
    process.env.GEMINI_API_KEY = "gem-test";
    global.fetch = vi.fn(async (url) => String(url).includes("identitytoolkit")
      ? { ok: true, json: async () => ({ users: [{ localId: "u2" }] }) }
      : { ok: false, status: 429, json: async () => ({}) });
    const res = await call({ task: "visit_note", notes: "pain lower left caries 36" });
    expect(res.statusCode).toBe(429);
    expect(res.body.error).toMatch(/busy/i);
  });
  it("sends chat history to Gemini with model and user roles", async () => {
    process.env.GEMINI_API_KEY = "gem-test";
    global.fetch = vi.fn(async (url) => String(url).includes("identitytoolkit")
      ? { ok: true, json: async () => ({ users: [{ localId: "u3" }] }) }
      : { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: "Open Billing." }] } }] }) });
    const res = await call({ task: "help", messages: [{ role: "user", content: "how to bill" }, { role: "assistant", content: "ok" }, { role: "user", content: "and print?" }] });
    expect(res.statusCode).toBe(200);
    expect(res.body.text).toBe("Open Billing.");
    const g = global.fetch.mock.calls.find((c) => String(c[0]).includes("generativelanguage"));
    const sent = JSON.parse(g[1].body);
    expect(sent.contents.map((c) => c.role)).toEqual(["user", "model", "user"]);
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
