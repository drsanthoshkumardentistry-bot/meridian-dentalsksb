import { describe, it, expect } from "vitest";
import { adapt } from "../functions/_adapt.js";
import ai from "../api/ai.js";
import wa from "../api/whatsapp.js";
import alert from "../api/login-alert.js";

const call = (h, env, init) => adapt(h)({ request: new Request("https://x.test/api", init), env });
const post = (body, headers = {}) => ({ method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });

describe("Cloudflare Pages adapter", () => {
  it("answers 405 to GET", async () => {
    const r = await call(ai, {}, { method: "GET" });
    expect(r.status).toBe(405);
    expect(r.headers.get("content-type")).toBe("application/json");
  });
  it("AI says it is off without a key", async () => {
    const r = await call(ai, {}, post({}));
    expect(r.status).toBe(503);
  });
  it("WhatsApp and login alert answer 204 when not configured", async () => {
    expect((await call(wa, {}, post({}))).status).toBe(204);
    expect((await call(alert, {}, post({}))).status).toBe(204);
  });
  it("rejects a missing sign-in with 401 when configured", async () => {
    const r = await call(wa, { WHATSAPP_TOKEN: "t", WHATSAPP_PHONE_ID: "p" }, post({ check: true }));
    expect(r.status).toBe(401);
  });
  it("rejects oversized bodies", async () => {
    const r = await call(ai, { GEMINI_API_KEY: "k" }, post({ a: "x".repeat(70000) }));
    expect(r.status).toBe(413);
  });
  it("survives bad JSON", async () => {
    const r = await call(ai, { GEMINI_API_KEY: "k" }, { method: "POST", body: "{nope" });
    expect(r.status).toBe(401);
  });
});
