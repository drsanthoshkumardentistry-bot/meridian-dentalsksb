import { describe, it, expect } from "vitest";
import {
  computeInvoiceTotals, computeLineItemTotals, allocateProportionally, invoiceLines, toPaise, nextInvoiceNumber, financialYear, normalizeInvoice,
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

describe("multi-item invoices", () => {
  it("shares a discount without losing a paisa", () => {
    expect(allocateProportionally(100, [1, 1, 1]).reduce((a, b) => a + b, 0)).toBe(100);
    expect(allocateProportionally(1, [1, 1, 1]).reduce((a, b) => a + b, 0)).toBe(1);
    expect(allocateProportionally(0, [5, 5])).toEqual([0, 0]);
    expect(allocateProportionally(50, [0, 0])).toEqual([0, 0]);
  });
  it("mixes exempt and 18% items correctly", () => {
    const t = computeLineItemTotals({
      items: [
        { description: "Root canal", amount: 5000, taxCategory: "therapeutic" },
        { description: "Whitening", amount: 10000, taxCategory: "cosmetic" },
      ],
    });
    expect(t.subtotalP).toBe(1500000);
    expect(t.exemptP).toBe(500000);
    expect(t.taxableGstP).toBe(1000000);
    expect(t.taxP).toBe(180000);
    expect(t.cgstP + t.sgstP).toBe(t.taxP);
    expect(t.totalP).toBe(1680000);
    expect(t.gstRate).toBe(18);
  });
  it("applies a discount proportionally, so GST falls on the discounted taxable value", () => {
    const t = computeLineItemTotals({
      items: [
        { description: "A", amount: 5000, taxCategory: "therapeutic" },
        { description: "B", amount: 10000, taxCategory: "cosmetic" },
      ],
      discount: 1500,
    });
    // discount 1500 split 500 / 1000
    expect(t.lines[0].discountP).toBe(50000);
    expect(t.lines[1].discountP).toBe(100000);
    expect(t.lines[1].taxableP).toBe(900000);
    expect(t.taxP).toBe(162000);
    expect(t.totalP).toBe(450000 + 900000 + 162000);
    expect(t.discountP).toBe(150000);
  });
  it("matches the single-amount calculation for one item", () => {
    const one = computeInvoiceTotals({ amount: 10000, discount: 2000, taxCategory: "cosmetic" });
    const many = computeLineItemTotals({ items: [{ description: "x", amount: 10000, taxCategory: "cosmetic" }], discount: 2000 });
    expect(many.totalP).toBe(one.totalP);
    expect(many.taxP).toBe(one.taxP);
    expect(many.cgstP).toBe(one.cgstP);
  });
  it("totals always equal the sum of the lines, even with awkward paise", () => {
    const t = computeLineItemTotals({
      items: [
        { description: "a", amount: 333.33, taxCategory: "cosmetic" },
        { description: "b", amount: 777.77, taxCategory: "cosmetic" },
        { description: "c", amount: 0.99, taxCategory: "therapeutic" },
      ],
      discount: 100.01,
    });
    expect(t.lines.reduce((s, l) => s + l.totalP, 0)).toBe(t.totalP);
    expect(t.lines.reduce((s, l) => s + l.discountP, 0)).toBe(t.discountP);
    expect(t.cgstP + t.sgstP).toBe(t.taxP);
  });
  it("old invoices read as one line", () => {
    const old = normalizeInvoice({ id: "O", rawAmount: "800", treatment: "Scaling" });
    const lines = invoiceLines(old);
    expect(lines).toHaveLength(1);
    expect(lines[0].description).toBe("Scaling");
    expect(lines[0].amountP).toBe(80000);
  });
  it("prints each item with its GST treatment", () => {
    const t = computeLineItemTotals({
      items: [
        { description: "Root canal", amount: 5000, taxCategory: "therapeutic" },
        { description: "Whitening", amount: 10000, taxCategory: "cosmetic" },
      ],
    });
    const inv = normalizeInvoice({ id: "X", patient: "Ravi", treatment: "Root canal, Whitening", ...t, payments: [] });
    const html = buildInvoiceHtml(inv, { name: "C" });
    expect(html).toContain("Root canal");
    expect(html).toContain("GST exempt");
    expect(html).toContain("GST 18%");
  });
});
