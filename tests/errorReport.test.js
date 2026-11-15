import { describe, it, expect, vi } from "vitest";
import { scrub, isNoise, buildReport, createReporter } from "../src/errorReport.js";
import { sanitizeReport, buildErrorEmail } from "../api/_lib/clientErrorCore.js";
import handler from "../api/client-error.js";

const res = () => { const r = { statusCode: 0, headers: {}, setHeader(k, v) { r.headers[k] = v; }, end() { r.ended = true; } }; return r; };

describe("scrub", () => {
  it("removes personal-looking text", () => {
    const s = scrub("Failed for asha@example.com phone 9043205927 id 123456789 at /p?token=abc Bearer abc.def.ghi");
    expect(s).not.toMatch(/asha@|9043205927|123456789|token=abc|abc\.def/);
    expect(s).toContain("[email]");
  });
  it("handles junk and caps length", () => {
    expect(scrub(null)).toBe("");
    expect(scrub("x".repeat(5000), 100).length).toBe(100);
  });
});
describe("noise filter", () => {
  it("ignores harmless browser and network errors", () => {
    for (const m of ["ResizeObserver loop limit exceeded", "Script error.", "Failed to fetch", "Loading chunk 5 failed", "NetworkError when attempting"]) expect(isNoise(m)).toBe(true);
    expect(isNoise("Cannot read properties of undefined (reading 'name')")).toBe(false);
  });
});
describe("reporter", () => {
  it("sends once per distinct error and stops after the cap", () => {
    const send = vi.fn(); const r = createReporter({ send, max: 3 });
    expect(r(new Error("boom"))).toBe(true);
    expect(r(new Error("boom"))).toBe(false);
    expect(r(new Error("two"))).toBe(true);
    expect(r(new Error("three"))).toBe(true);
    expect(r(new Error("four"))).toBe(false);
    expect(send).toHaveBeenCalledTimes(3);
  });
  it("skips noise and never throws", () => {
    const send = vi.fn(() => { throw new Error("x"); }); const r = createReporter({ send });
    expect(r(new Error("Failed to fetch"))).toBe(false);
    expect(r(new Error("real bug"))).toBe(false);
  });
  it("keeps only the page path", () => {
    const rep = buildReport(new Error("x"), "screen", { pathname: "/app", search: "?plan=SECRET" }, "UA");
    expect(JSON.stringify(rep)).not.toContain("SECRET");
    expect(rep.path).toBe("/app");
  });
});
describe("server side", () => {
  it("rejects bad bodies and cleans good ones", () => {
    for (const b of [null, [], "x", {}, { message: "" }]) expect(sanitizeReport(b)).toBeNull();
    const r = sanitizeReport({ message: "bad for a@b.com", name: "TypeError", stack: "x".repeat(9000) });
    expect(r.message).not.toContain("a@b.com");
    expect(r.stack.length).toBe(1500);
  });
  it("escapes html in the email", () => {
    const e = buildErrorEmail({ name: "E", message: "<script>x</script>", stack: "", source: "w", path: "/", ua: "" });
    expect(e.html).not.toContain("<script>");
  });
  it("handler: 405, 400, 204 and never emails without keys", async () => {
    const get = res(); await handler({ method: "GET", headers: {} }, get); expect(get.statusCode).toBe(405);
    const bad = res(); await handler({ method: "POST", headers: {}, body: {} }, bad); expect(bad.statusCode).toBe(400);
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true });
    const old = { ...process.env }; delete process.env.RESEND_API_KEY; delete process.env.LOGIN_ALERT_TO;
    vi.spyOn(console, "error").mockImplementation(() => {});
    const ok = res(); await handler({ method: "POST", headers: { "x-forwarded-for": "1.1.1.1" }, body: { message: "boom", name: "Error" } }, ok);
    expect(ok.statusCode).toBe(204); expect(spy).not.toHaveBeenCalled();
    Object.assign(process.env, old); spy.mockRestore();
  });
  it("handler: rate limits one visitor", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    let last = 0;
    for (let i = 0; i < 12; i++) { const r = res(); await handler({ method: "POST", headers: { "x-forwarded-for": "9.9.9.9" }, body: { message: "m" + i } }, r); last = r.statusCode; }
    expect(last).toBe(429);
  });
});

describe("scrub speed", () => {
  it("handles a huge stack trace in well under a second", async () => {
    const { scrub } = await import("../src/errorReport.js");
    const t0 = Date.now();
    const out = scrub("a".repeat(200000) + " x@y.com", 1500);
    expect(Date.now() - t0).toBeLessThan(500);
    expect(out.length).toBeLessThanOrEqual(1500);
  });
});

describe("/api/client-error rate limit comes before parsing", () => {
  it("answers 429 to a repeating sender without reading its body", async () => {
    const { default: h } = await import("../api/client-error.js");
    let touched = 0;
    const body = new Proxy({}, { get() { touched++; return "x"; }, ownKeys() { touched++; return []; } });
    const run = async () => { const r = { statusCode: 0, setHeader() {}, end() {} }; await h({ method: "POST", headers: { "x-forwarded-for": "9.9.9.9" }, body }, r); return r.statusCode; };
    const codes = [];
    for (let i = 0; i < 14; i++) codes.push(await run());
    expect(codes.filter((c) => c === 429).length).toBeGreaterThanOrEqual(4);
    const before = touched;
    await run();
    expect(touched).toBe(before);
  });
});
