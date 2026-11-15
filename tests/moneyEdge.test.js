// Money edge cases: odd amounts must never produce NaN, negatives or crashes on a bill.
import { describe, it, expect } from "vitest";
import { computeInvoiceTotals, formatINR, paymentStatus, balancePaise, paidPaise, normalizeInvoice } from "../src/billing.js";

describe("money edge cases", () => {
  it.each([0, -500, NaN, Infinity, "abc", "", null, undefined, 1e-7])("amount %s gives a clean zero bill", (amount) => {
    const t = computeInvoiceTotals({ amount, taxCategory: "cosmetic" });
    for (const k of ["subtotalP", "taxP", "totalP", "cgstP", "sgstP"]) expect(Number.isFinite(t[k]) && t[k] >= 0).toBe(true);
    expect(t.totalP).toBe(0);
  });
  it("rounds decimals to the nearest paisa (2.675 is 268 paise, not 267)", () => {
    expect(computeInvoiceTotals({ amount: 2.675, taxCategory: "therapeutic" }).totalP).toBe(268);
    expect(computeInvoiceTotals({ amount: 0.1 + 0.2, taxCategory: "therapeutic" }).totalP).toBe(30);
  });
  it("a huge amount is capped, never overflowing", () => {
    const t = computeInvoiceTotals({ amount: 1e15, taxCategory: "cosmetic" });
    expect(Number.isSafeInteger(t.totalP)).toBe(true);
  });
  it("a discount bigger than the bill gives a zero total, a negative discount is ignored", () => {
    expect(computeInvoiceTotals({ amount: 100, discount: 500, taxCategory: "cosmetic" }).totalP).toBe(0);
    expect(computeInvoiceTotals({ amount: 100, discount: -50, taxCategory: "therapeutic" }).totalP).toBe(10000);
  });
  it.each([NaN, undefined, null, "x"])("formatINR(%s) shows 0.00, never NaN", (v) => {
    expect(formatINR(v)).toBe("0.00");
  });
  it("overpayment never shows a negative balance", () => {
    const inv = { totalP: 1000, payments: [{ amountP: 600 }, { amountP: 600 }] };
    expect(balancePaise(inv)).toBe(0);
    expect(paymentStatus(inv)).toBe("Paid");
  });
  it("negative, NaN, text and blank payment lines never reduce what was paid or crash", () => {
    const inv = normalizeInvoice({ totalP: 5000, payments: [null, 7, "x", { amountP: -300 }, { amountP: NaN }, { amountP: "abc" }, { amountP: 1000 }] });
    expect(paidPaise(inv)).toBe(1000);
    expect(balancePaise(inv)).toBe(4000);
  });
});
