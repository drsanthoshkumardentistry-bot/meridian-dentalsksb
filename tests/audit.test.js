import { describe, it, expect } from "vitest";
import { buildAuditEntry, auditText, auditView, auditActors } from "../src/audit.js";

const now = new Date(Date.UTC(2026, 10, 11, 5));
describe("audit log", () => {
  it("builds a compact entry and clips long text", () => {
    const e = buildAuditEntry({ actor: { uid: "u1", email: "a@x.com", role: "dentist" }, action: "patient.add", subject: "  Asha   Devi ", detail: "x".repeat(500) }, "AU1", now);
    expect(e).toMatchObject({ id: "AU1", actorUid: "u1", actorEmail: "a@x.com", actorRole: "dentist", action: "patient.add", subject: "Asha Devi" });
    expect(e.detail).toHaveLength(160);
    expect(e.at).toBe(now.toISOString());
  });
  it("maps unknown actions to other and defaults the role to owner", () => {
    const e = buildAuditEntry({ actor: { uid: "u" }, action: "hack", subject: "s" }, "A", now);
    expect(e.action).toBe("other");
    expect(e.actorRole).toBe("owner");
    expect(auditText(e)).toBe("Other change: s");
  });
  it("describes, sorts, filters and lists people", () => {
    const a = { id: "1", at: "2026-11-10T00:00:00Z", actorEmail: "b@x.com", action: "invoice.add", subject: "INV/1", detail: "Asha, ₹100.00" };
    const b = { id: "2", at: "2026-11-11T00:00:00Z", actorEmail: "a@x.com", action: "patient.delete", subject: "Ravi", detail: "" };
    expect(auditText(a)).toBe("Created invoice: INV/1 (Asha, ₹100.00)");
    expect(auditView([a, b]).map((e) => e.id)).toEqual(["2", "1"]);
    expect(auditView([a, b], { query: "asha" }).map((e) => e.id)).toEqual(["1"]);
    expect(auditView([a, b], { actor: "a@x.com" }).map((e) => e.id)).toEqual(["2"]);
    expect(auditView([a, b], {}, 1)).toHaveLength(1);
    expect(auditActors([a, b, b])).toEqual(["a@x.com", "b@x.com"]);
  });
});
