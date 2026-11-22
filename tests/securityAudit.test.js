import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { visitorIp } from "../api/_lib/clientIp.js";
import { buildShareDoc } from "../src/plans.js";

describe("visitor address for rate limits", () => {
  it("ignores a spoofed first x-forwarded-for entry", () => {
    expect(visitorIp({ "x-forwarded-for": "1.2.3.4, 9.9.9.9" })).toBe("9.9.9.9");
    expect(visitorIp({ "x-forwarded-for": "6.6.6.6, 9.9.9.9" })).toBe("9.9.9.9");
  });
  it("prefers the proxy's own header", () => {
    expect(visitorIp({ "cf-connecting-ip": "7.7.7.7", "x-forwarded-for": "1.1.1.1" })).toBe("7.7.7.7");
  });
  it("falls back safely", () => {
    expect(visitorIp({})).toBe("unknown");
    expect(visitorIp()).toBe("unknown");
  });
});

describe("firestore.rules shape lists stay in step with the app", () => {
  const rules = readFileSync(resolve(process.cwd(), "firestore.rules"), "utf8");
  const listAfter = (marker) => {
    const at = rules.indexOf(marker);
    const m = rules.slice(at).match(/hasOnly\(\[([^\]]+)\]\)/);
    return m[1].split(",").map((x) => x.trim().replace(/'/g, "")).filter(Boolean);
  };
  it("accepts every key the app writes to a treatment estimate link", () => {
    const allowed = listAfter("match /planShares/{token}");
    const doc = buildShareDoc({ plan: { id: "p1", title: "T", items: [{ description: "x", tooth: "11", amountP: 100, qty: 1 }] }, patient: { id: "a", name: "A B" }, clinicId: "c" });
    for (const k of Object.keys(doc)) expect(allowed, `rules reject key ${k}`).toContain(k);
  });
  it("accepts every key the app writes to the dentist-network audit log", () => {
    const allowed = listAfter("match /connectAudit/{entryId}");
    for (const k of ["actorId", "action", "targetId", "meta", "createdAt"]) expect(allowed).toContain(k);
  });
});

describe("storage.rules protect the shared free storage", () => {
  const rules = readFileSync(resolve(process.cwd(), "storage.rules"), "utf8");
  it("keeps every file private to the verified owning account", () => {
    expect(rules).toContain("request.auth.uid == clinicId");
    expect(rules).toContain("email_verified == true");
    expect(rules).not.toMatch(/allow [^;]*if true/);
  });
  it("only lets new files be pictures or PDFs under 10 MB", () => {
    expect(rules).toContain("request.resource.size < 10 * 1024 * 1024");
    expect(rules).toContain("image/.*|application/pdf");
  });
});
