import { describe, it, expect } from "vitest";
import { voidInvoice, balancePaise, paymentStatus, normalizeInvoice } from "../src/billing.js";
import { intakeVisit, applyNrh, clearNrh } from "../src/visits.js";

const inv = (extra = {}) => ({ id: "INV-1", patient: "A", totalP: 50000, payments: [], ...extra });
describe("void invoice", () => {
  it("zeroes the invoice but keeps the record", () => {
    const r = voidInvoice(inv(), "Wrong patient", "Dr S", new Date("2026-11-24T05:00:00Z"));
    expect(r.ok).toBe(true);
    expect(balancePaise(normalizeInvoice(r.invoice))).toBe(0);
    expect(r.invoice.voided.originalTotalP).toBe(50000);
    expect(paymentStatus(r.invoice)).toBe("Void");
  });
  it("needs a reason and blocks repeat voids", () => {
    expect(voidInvoice(inv(), " ").ok).toBe(false);
    expect(voidInvoice(voidInvoice(inv(), "mistake").invoice, "again").ok).toBe(false);
  });
});
describe("intake sync and NRH", () => {
  it("turns the chief complaint into the first visit note", () => {
    const v = intakeVisit({ chiefComplaint: " Pain in 36 " }, "VN1", new Date(2026, 10, 24));
    expect(v.complaint).toBe("Pain in 36");
    expect(v.fromIntake).toBe(true);
    expect(intakeVisit({ chiefComplaint: "  " }, "VN2")).toBeNull();
  });
  it("NRH sets and clears history without touching the alert", () => {
    const p = applyNrh({ medicalAlert: "" });
    expect(p.conditions).toBe("None / NRH");
    expect(p.allergies).toBe("None / NRH");
    expect(p.medicalAlert).toBe("");
    expect(clearNrh(p).conditions).toBe("");
  });
});
