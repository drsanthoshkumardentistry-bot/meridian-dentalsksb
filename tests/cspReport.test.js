import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import handler, { sanitizeCspReport } from "../api/csp-report.js";

const read = (f) => fs.readFileSync(new URL("../" + f, import.meta.url), "utf8");
const res = () => { const r = { statusCode: 0, headers: {}, setHeader(k, v) { r.headers[k] = v; }, end() { r.ended = true; } }; return r; };

describe("CSP violation reports", () => {
  it("keeps only short allow-listed fields and drops query strings (they can hold private link tokens)", () => {
    const r = sanitizeCspReport({ "csp-report": { "document-uri": "https://x.in/?portal=SECRET#a", "blocked-uri": "https://evil.example/a.js?k=1", "violated-directive": "script-src", extra: "nope", "source-file": "https://x.in/a.js?t=1", "line-number": 12 } });
    expect(r).toEqual({ "document-uri": "https://x.in/", "blocked-uri": "https://evil.example/a.js", "violated-directive": "script-src", "source-file": "https://x.in/a.js", "line-number": "12" });
    expect(JSON.stringify(r)).not.toContain("SECRET");
  });
  it("trims long values and line breaks", () => {
    const r = sanitizeCspReport({ "csp-report": { "violated-directive": "a\nb".repeat(300) } });
    expect(r["violated-directive"].length).toBeLessThanOrEqual(200);
    expect(r["violated-directive"]).not.toMatch(/[\r\n]/);
  });
  it("rejects junk and non-POST, logs a good report, and rate-limits a flood", async () => {
    expect(sanitizeCspReport(null)).toBeNull();
    expect(sanitizeCspReport({ "csp-report": "x" })).toBeNull();
    const a = res(); await handler({ method: "GET", headers: {} }, a); expect(a.statusCode).toBe(405);
    const b = res(); await handler({ method: "POST", headers: {}, body: {} }, b); expect(b.statusCode).toBe(400);
    const log = vi.spyOn(console, "warn").mockImplementation(() => {});
    const c = res(); await handler({ method: "POST", headers: { "x-forwarded-for": "9.9.9.9" }, body: { "csp-report": { "violated-directive": "img-src" } } }, c);
    expect(c.statusCode).toBe(204); expect(log).toHaveBeenCalled();
    let last = 0; for (let i = 0; i < 40; i++) { const x = res(); await handler({ method: "POST", headers: { "x-forwarded-for": "8.8.8.8" }, body: { "csp-report": { "violated-directive": "d" } } }, x); last = x.statusCode; }
    expect(last).toBe(429); log.mockRestore();
  });
  it("both hosts send the same report-only policy that reports to /api/csp-report, and the enforced one is unchanged", () => {
    const v = JSON.parse(read("vercel.json")).headers.flatMap((h) => h.headers);
    const ro = v.find((x) => x.key === "Content-Security-Policy-Report-Only").value;
    expect(ro).toContain("report-uri /api/csp-report");
    expect(ro).toContain("default-src 'self'");
    expect(read("public/_headers")).toContain(ro);
    expect(v.find((x) => x.key === "Content-Security-Policy").value).toContain("script-src 'self' 'sha256-");
  });
  it("the Cloudflare function wraps the handler", () => {
    expect(read("functions/api/csp-report.js")).toContain("api/csp-report.js");
  });
});
