import { describe, it, expect } from "vitest";
import {
  computeInvoiceTotals, toPaise, nextInvoiceNumber, financialYear, normalizeInvoice,
  addPayment, balancePaise, paymentStatus, buildUpiUri, isValidUpiId, buildInvoiceHtml,
} from "../src/billing.js";

describe("money", () => {
  it("avoids float errors", () => {
    expect(toPaise("0.1") + toPaise("0.2")).toBe(30);
    expect(toPaise("1,250.55")).toBe(125055);
    expect(toPaise("abc")).toBe(0);
  });
});

describe("GST", () => {
  it("therapeutic is exempt", () => {
    const t = computeInvoiceTotals({ amount: 5500, taxCategory: "therapeutic" });
    expect(t.taxP).toBe(0);
    expect(t.totalP).toBe(550000);
  });
  it("cosmetic is 18% split into CGST+SGST that always sum to the tax", () => {
    const t = computeInvoiceTotals({ amount: 10000, taxCategory: "cosmetic" });
    expect(t.cgstP).toBe(90000);
    expect(t.sgstP).toBe(90000);
    expect(t.totalP).toBe(1180000);
    const odd = computeInvoiceTotals({ amount: 0.05, taxCategory: "cosmetic" });
    expect(odd.cgstP + odd.sgstP).toBe(odd.taxP);
  });
  it("discount is applied before tax and capped at the amount", () => {
    const t = computeInvoiceTotals({ amount: 10000, discount: 2000, taxCategory: "cosmetic" });
    expect(t.taxableP).toBe(800000);
    expect(t.totalP).toBe(944000);
    expect(computeInvoiceTotals({ amount: 100, discount: 500 }).totalP).toBe(0);
  });
});

describe("invoice numbers", () => {
  it("financial year runs April to March", () => {
    expect(financialYear(new Date(2026, 3, 1))).toBe("2026-27");
    expect(financialYear(new Date(2027, 2, 31))).toBe("2026-27");
  });
  it("is sequential and ignores other years and legacy ids", () => {
    const d = new Date(2026, 10, 10);
    expect(nextInvoiceNumber([], d)).toBe("INV/2026-27/0001");
    const list = [{ id: "INV/2026-27/0007" }, { id: "INV/2025-26/0099" }, { id: "INV-2026-AB12C" }];
    expect(nextInvoiceNumber(list, d)).toBe("INV/2026-27/0008");
  });
});

describe("payments", () => {
  const base = normalizeInvoice({ id: "X", totalP: 100000, payments: [] });
  it("supports part payments and tracks balance", () => {
    const r = addPayment(base, { amount: 400, mode: "UPI" });
    expect(r.ok).toBe(true);
    expect(balancePaise(r.invoice)).toBe(60000);
    expect(paymentStatus(r.invoice)).toBe("Part paid");
    const r2 = addPayment(r.invoice, { amount: 600 });
    expect(paymentStatus(r2.invoice)).toBe("Paid");
  });
  it("rejects overpayment and zero", () => {
    expect(addPayment(base, { amount: 1001 }).ok).toBe(false);
    expect(addPayment(base, { amount: 0 }).ok).toBe(false);
  });
  it("migrates legacy invoices", () => {
    const paid = normalizeInvoice({ id: "INV-1", rawAmount: "5500", status: "Self-Pay Completed", paymentMode: "Cash" });
    expect(paid.totalP).toBe(550000);
    expect(paymentStatus(paid)).toBe("Paid");
    const open = normalizeInvoice({ id: "INV-2", rawAmount: "800", status: "Pre-Auth Submitted" });
    expect(paymentStatus(open)).toBe("Unpaid");
  });
});

describe("UPI and print", () => {
  it("validates UPI ids", () => {
    expect(isValidUpiId("clinic@okhdfc")).toBe(true);
    expect(isValidUpiId("bad id@x")).toBe(false);
    expect(isValidUpiId("")).toBe(false);
  });
  it("builds a UPI link with exact amount", () => {
    const u = buildUpiUri({ vpa: "a@upi", name: "My Clinic", amountP: 123450, note: "INV/2026-27/0001" });
    expect(u).toContain("pa=a%40upi");
    expect(u).toContain("am=1234.50");
    expect(u).toContain("cu=INR");
  });
  it("escapes HTML in printed invoices", () => {
    const inv = normalizeInvoice({ id: "X", patient: "<script>alert(1)</script>", rawAmount: 100, treatment: "a&b" });
    const html = buildInvoiceHtml(inv, { name: "C" });
    expect(html).not.toContain("<script>alert(1)");
    expect(html).toContain("a&amp;b");
  });
});
