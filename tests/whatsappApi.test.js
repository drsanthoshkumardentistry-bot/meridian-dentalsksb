import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import handler from "../api/whatsapp.js";
import { buildSend, toWaNumber, cleanVar, TEMPLATES } from "../api/_lib/whatsappCore.js";

const makeRes = () => { const r = { headers: {}, setHeader(k, v) { r.headers[k] = v; }, end(b) { r.body = b ? JSON.parse(b) : undefined; } }; return r; };
const call = async (body, token = "good") => {
  const res = makeRes();
  await handler({ method: "POST", body, headers: token ? { authorization: `Bearer ${token}` } : {} }, res);
  return res;
};

describe("WhatsApp template rules", () => {
  it("normalises Indian numbers", () => {
    expect(toWaNumber("90432 05927")).toBe("919043205927");
    expect(toWaNumber("+91 9043205927")).toBe("919043205927");
    expect(toWaNumber("12345")).toBe("");
  });
  it("cleans variables WhatsApp would reject", () => {
    expect(cleanVar("a\nb\t c   d")).toBe("a b c d");
    expect(cleanVar("x".repeat(500)).length).toBe(120);
  });
  it("builds only known templates with the right number of details", () => {
    const ok = buildSend({ kind: "recall", to: "9043205927", params: ["A", "6", "Smile", "9876543210"] });
    expect(ok.payload.template.name).toBe(TEMPLATES.recall.name);
    expect(ok.payload.template.components[0].parameters).toHaveLength(4);
    expect(buildSend({ kind: "hack", to: "9043205927", params: [] }).error).toBeTruthy();
    expect(buildSend({ kind: "recall", to: "123", params: ["A", "6", "S", "9"] }).error).toMatch(/number/);
    expect(buildSend({ kind: "recall", to: "9043205927", params: ["A"] }).error).toMatch(/Wrong number/);
    expect(buildSend({ kind: "recall", to: "9043205927", params: ["A", "6", "", "9"] }).error).toMatch(/empty/);
  });
  it("each template body uses exactly its variables", () => {
    Object.values(TEMPLATES).forEach((t) => {
      for (let i = 1; i <= t.vars; i += 1) expect(t.body).toContain(`{{${i}}}`);
      expect(t.body).not.toContain(`{{${t.vars + 1}}}`);
    });
  });
});

describe("/api/whatsapp", () => {
  beforeEach(() => {
    process.env.VITE_FIREBASE_API_KEY = "fb";
    global.fetch = vi.fn(async (url, opts) => {
      if (String(url).includes("identitytoolkit")) {
        const ok = JSON.parse(opts.body).idToken === "good";
        return { ok, json: async () => ({ users: [{ localId: "u-wa", email: "a@b.in", emailVerified: true }] }) };
      }
      return { ok: true, json: async () => ({ messages: [{ id: "wamid.1" }] }) };
    });
  });
  afterEach(() => { delete process.env.WHATSAPP_TOKEN; delete process.env.WHATSAPP_PHONE_ID; });

  it("is off until the keys are set", async () => {
    expect((await call({ check: true })).statusCode).toBe(204);
  });
  it("needs a signed-in user", async () => {
    process.env.WHATSAPP_TOKEN = "t"; process.env.WHATSAPP_PHONE_ID = "123";
    expect((await call({ check: true }, "bad")).statusCode).toBe(401);
  });
  it("reports that it is on, and sends a template", async () => {
    process.env.WHATSAPP_TOKEN = "t"; process.env.WHATSAPP_PHONE_ID = "123";
    expect((await call({ check: true })).body).toEqual({ enabled: true });
    const res = await call({ kind: "recall", to: "9043205927", params: ["A", "6", "Smile", "9876543210"] });
    expect(res.statusCode).toBe(200);
    const g = global.fetch.mock.calls.find((c) => String(c[0]).includes("graph.facebook.com"));
    expect(g[0]).toContain("/123/messages");
    expect(g[1].headers.Authorization).toBe("Bearer t");
    expect(JSON.parse(g[1].body).to).toBe("919043205927");
  });
  it("refuses bad requests without calling WhatsApp", async () => {
    process.env.WHATSAPP_TOKEN = "t"; process.env.WHATSAPP_PHONE_ID = "123";
    expect((await call({ kind: "free_text", to: "9043205927", params: ["hi"] })).statusCode).toBe(400);
    expect(global.fetch.mock.calls.some((c) => String(c[0]).includes("graph.facebook.com"))).toBe(false);
  });
  it("shows Meta's reason when it refuses", async () => {
    process.env.WHATSAPP_TOKEN = "t"; process.env.WHATSAPP_PHONE_ID = "123";
    global.fetch = vi.fn(async (url) => String(url).includes("identitytoolkit")
      ? { ok: true, json: async () => ({ users: [{ localId: "u-wa2", email: "a@b.in", emailVerified: true }] }) }
      : { ok: false, json: async () => ({ error: { message: "Template not approved" } }) });
    const res = await call({ kind: "recall", to: "9043205927", params: ["A", "6", "S", "9"] });
    expect(res.statusCode).toBe(502);
    expect(res.body.error).toBe("Template not approved");
  });
});
