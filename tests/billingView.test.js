import { describe, it, expect } from "vitest";
import { dueDateIn, daysOverdue, isOverdue, billingSummary, searchInvoices, invoiceView, invoicesCsv, buildInvoiceMessage } from "../src/billingView.js";

const now = new Date(2026, 10, 11, 10); // 11 Nov 2026
const inv = (o) => ({ id: "INV/1", patient: "Asha", date: "01/11/2026", totalP: 100000, payments: [], ...o });
const paid = (p, amountP, date = "05/11/2026") => ({ ...p, payments: [{ date, mode: "Cash", amountP }] });

describe("due dates", () => {
  it("builds a date-input value", () => {
    expect(dueDateIn(0, now)).toBe("2026-11-11");
    expect(dueDateIn(30, now)).toBe("2026-12-11");
  });
  it("counts days overdue, never negative, null without a due date", () => {
    expect(daysOverdue(inv({ dueDate: "2026-11-08" }), now)).toBe(3);
    expect(daysOverdue(inv({ dueDate: "2026-11-20" }), now)).toBe(0);
    expect(daysOverdue(inv({}), now)).toBeNull();
  });
  it("is overdue only when unpaid and past due", () => {
    expect(isOverdue(inv({ dueDate: "2026-11-08" }), now)).toBe(true);
    expect(isOverdue(paid(inv({ dueDate: "2026-11-08" }), 100000), now)).toBe(false);
    expect(isOverdue(inv({ dueDate: "2026-11-11" }), now)).toBe(false);
    expect(isOverdue(inv({}), now)).toBe(false);
  });
});

describe("billingSummary", () => {
  it("separates this month's billing and collections from the running balance", () => {
    const list = [
      paid(inv({ id: "A", date: "03/11/2026", totalP: 100000 }), 40000, "04/11/2026"),
      inv({ id: "B", date: "20/10/2026", totalP: 50000, dueDate: "2026-11-01" }),
      paid(inv({ id: "C", date: "15/10/2026", totalP: 20000 }), 20000, "16/10/2026")
    ];
    expect(billingSummary(list, now)).toEqual({ billedP: 100000, collectedP: 40000, outstandingP: 60000 + 50000, overdueP: 50000, overdueCount: 1 });
  });
});

describe("search and views", () => {
  const list = [
    paid(inv({ id: "A", patient: "Asha Devi", totalP: 100000 }), 100000),
    paid(inv({ id: "B", patient: "Ravi", totalP: 100000, claimId: "CLM-XYZ", provider: "Star Health" }), 30000),
    inv({ id: "C", patient: "Meena", totalP: 100000, dueDate: "2026-11-01" })
  ];
  it("searches id, patient, claim and provider", () => {
    expect(searchInvoices(list, "asha").map((i) => i.id)).toEqual(["A"]);
    expect(searchInvoices(list, "clm-xyz").map((i) => i.id)).toEqual(["B"]);
    expect(searchInvoices(list, "star").map((i) => i.id)).toEqual(["B"]);
    expect(searchInvoices(list, "  ").length).toBe(3);
  });
  it("filters by payment state", () => {
    expect(invoiceView(list, { status: "paid" }, now).map((i) => i.id)).toEqual(["A"]);
    expect(invoiceView(list, { status: "part" }, now).map((i) => i.id)).toEqual(["B"]);
    expect(invoiceView(list, { status: "unpaid" }, now).map((i) => i.id).sort()).toEqual(["B", "C"]);
    expect(invoiceView(list, { status: "overdue" }, now).map((i) => i.id)).toEqual(["C"]);
  });
  it("combines a search with a status", () => {
    expect(invoiceView(list, { status: "unpaid", query: "ravi" }, now).map((i) => i.id)).toEqual(["B"]);
  });
});

describe("export and share text", () => {
  it("writes one CSV row per invoice with plain numbers", () => {
    const csv = invoicesCsv([paid(inv({ id: "A", patient: 'Asha, "AD"', totalP: 125050 }), 25050)], now);
    const lines = csv.trim().split("\r\n");
    expect(lines[0]).toMatch(/^Invoice,Date,Due date/);
    expect(lines[1]).toContain('"Asha, ""AD"""');
    expect(lines[1]).toContain("1250.50,250.50,1000.00,Part paid");
  });
  it("builds an invoice message with balance, due date and UPI", () => {
    const m = buildInvoiceMessage({ clinicName: "Smile", inv: paid(inv({ dueDate: "2026-11-20", treatment: "RCT" }), 40000), upiId: "smile@upi" });
    expect(m).toContain("invoice INV/1 from Smile for RCT");
    expect(m).toContain("Balance: ₹600.00");
    expect(m).toContain("smile@upi");
    expect(buildInvoiceMessage({ clinicName: "Smile", inv: paid(inv({}), 100000) })).toContain("Fully paid");
  });
});
