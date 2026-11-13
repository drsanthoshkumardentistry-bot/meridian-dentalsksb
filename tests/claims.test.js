import { describe, it, expect } from "vitest";
import { applyClaim, claimsSummary, claimOutstandingP, claimIsOpen } from "../src/claims.js";
import { computeLineItemTotals, balancePaise, paidPaise } from "../src/billing.js";

const mk = (rupees, paid = 0) => {
  const { lines, exemptP, taxableGstP, ...t } = computeLineItemTotals({ items: [{ description: "RCT", amount: rupees, taxCategory: "therapeutic" }] });
  return { id: "INV/1", patient: "A", ...t, payments: paid ? [{ date: "1/1/2026", mode: "Cash", amountP: paid * 100 }] : [], date: "1/1/2026" };
};

describe("insurance claims", () => {
  it("needs an insurer and a sensible amount", () => {
    expect(applyClaim(mk(8000), { insurer: "", amount: "100" }).ok).toBe(false);
    expect(applyClaim(mk(8000), { insurer: "Star", amount: "" }).ok).toBe(false);
    expect(applyClaim(mk(8000), { insurer: "Star", amount: "8001" }).error).toMatch(/more than the invoice total/);
    expect(applyClaim(null, { insurer: "Star", amount: "1" }).ok).toBe(false);
  });
  it("saves a submitted claim without touching payments", () => {
    const r = applyClaim(mk(8000, 1000), { insurer: " Star Health ", claimNo: "C1", amount: "5000" });
    expect(r.ok).toBe(true);
    expect(r.invoice.claim).toMatchObject({ insurer: "Star Health", claimNo: "C1", amountP: 500000, status: "Submitted" });
    expect(paidPaise(r.invoice)).toBe(100000);
    expect(claimOutstandingP(r.invoice)).toBe(500000);
    expect(claimIsOpen(r.invoice)).toBe(true);
  });
  it("settling adds an Insurance payment and locks the claim", () => {
    const s = applyClaim(mk(8000, 1000), { insurer: "Star", amount: "5000", status: "Settled", received: "4500" });
    expect(s.ok).toBe(true);
    expect(s.invoice.payments.at(-1)).toMatchObject({ mode: "Insurance", amountP: 450000 });
    expect(balancePaise(s.invoice)).toBe(250000);
    expect(s.invoice.claim.settledP).toBe(450000);
    expect(claimOutstandingP(s.invoice)).toBe(0);
    expect(applyClaim(s.invoice, { insurer: "Other", amount: "1" }).error).toMatch(/settled/);
  });
  it("never lets the insurer payment exceed the balance", () => {
    const r = applyClaim(mk(8000, 7000), { insurer: "Star", amount: "5000", status: "Settled" });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/more than the balance/);
  });
  it("caps what the insurer owes at the balance and summarises", () => {
    const open = applyClaim(mk(8000, 7500), { insurer: "Star", amount: "5000" }).invoice;
    expect(claimOutstandingP(open)).toBe(50000);
    const rej = applyClaim(mk(3000), { insurer: "Niva", amount: "3000", status: "Rejected" }).invoice;
    expect(claimsSummary([open, rej, null, {}, mk(10)])).toEqual({ open: 1, openP: 50000, rejected: 1, settled: 0 });
    expect(claimsSummary(undefined)).toEqual({ open: 0, openP: 0, rejected: 0, settled: 0 });
  });
});
