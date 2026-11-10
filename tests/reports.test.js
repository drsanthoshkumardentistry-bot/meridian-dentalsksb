import { describe, it, expect } from "vitest";
import {
  collectionsForMonth, gstSummaryForMonth, outstandingTotalP, csvCell, toCsv, collectionsCsv, gstRegisterCsv, buildReportHtml,
} from "../src/reports.js";
import { computeInvoiceTotals, computeLineItemTotals } from "../src/billing.js";

const mk = (id, date, amount, cat, payments, extra = {}) => ({
  id, date, patient: "P " + id, treatment: "Work", taxCategory: cat, ...computeInvoiceTotals({ amount, taxCategory: cat }), payments, ...extra,
});

const invoices = [
  mk("INV/2026-27/0001", "05/11/2026", 1000, "therapeutic", [{ date: "05/11/2026", mode: "Cash", amountP: 60000 }, { date: "9/11/2026", mode: "UPI", amountP: 40000 }]),
  mk("INV/2026-27/0002", "5/11/2026", 10000, "cosmetic", [{ date: "05/11/2026", mode: "UPI", amountP: 500000 }]),
  mk("INV/2026-27/0003", "28/10/2026", 2000, "therapeutic", [{ date: "02/11/2026", mode: "Card", amountP: 200000 }]),
];

describe("collections", () => {
  it("groups payments by day and mode, using payment date (not invoice date)", () => {
    const { days, totals } = collectionsForMonth(invoices, "2026-11");
    expect(days.map((d) => d.date)).toEqual(["2026-11-02", "2026-11-05", "2026-11-09"]);
    expect(days[1].byMode.Cash).toBe(60000);
    expect(days[1].byMode.UPI).toBe(500000);
    expect(totals.totalP).toBe(60000 + 40000 + 500000 + 200000);
    expect(totals.byMode.Card).toBe(200000);
    expect(totals.payments).toBe(4);
  });
  it("excludes other months", () => {
    expect(collectionsForMonth(invoices, "2026-10").totals.totalP).toBe(0);
  });
  it("unknown modes go to Other so totals still match", () => {
    const odd = [mk("X", "01/11/2026", 10, "therapeutic", [{ date: "01/11/2026", mode: "Cheque", amountP: 1000 }])];
    const { totals } = collectionsForMonth(odd, "2026-11");
    expect(totals.byMode.Other).toBe(1000);
    expect(totals.totalP).toBe(1000);
  });
});

describe("GST summary", () => {
  it("uses invoice date and separates exempt from taxable", () => {
    const { sum, rows } = gstSummaryForMonth(invoices, "2026-11");
    expect(rows.length).toBe(2);
    expect(sum.exemptP).toBe(100000);
    expect(sum.taxableAt18P).toBe(1000000);
    expect(sum.cgstP).toBe(90000);
    expect(sum.sgstP).toBe(90000);
    expect(sum.taxP).toBe(180000);
    expect(sum.totalP).toBe(100000 + 1180000);
  });
  it("includes the October invoice only in October", () => {
    expect(gstSummaryForMonth(invoices, "2026-10").sum.invoices).toBe(1);
  });
});

describe("outstanding", () => {
  it("sums balances", () => {
    expect(outstandingTotalP(invoices)).toBe(680000);
    const open = [mk("O", "01/11/2026", 1000, "therapeutic", [{ date: "01/11/2026", mode: "Cash", amountP: 30000 }])];
    expect(outstandingTotalP(open)).toBe(70000);
  });
});

describe("CSV", () => {
  it("escapes commas, quotes and newlines", () => {
    expect(csvCell('a,"b"')).toBe('"a,""b"""');
    expect(csvCell("x\ny")).toBe('"x\ny"');
  });
  it("blocks spreadsheet formula injection", () => {
    expect(csvCell("=HYPERLINK(\"http://evil\")")).toBe("\"'=HYPERLINK(\"\"http://evil\"\")\"");
    expect(csvCell("+91 98765")).toBe("'+91 98765");
    expect(csvCell("-5")).toBe("'-5");
    expect(csvCell("@cmd")).toBe("'@cmd");
  });
  it("builds both exports with totals rows", () => {
    const c = collectionsCsv(invoices, "2026-11").trim().split("\r\n");
    expect(c[0]).toContain("Date,Cash,UPI,Card");
    expect(c[c.length - 1].startsWith("TOTAL")).toBe(true);
    expect(c[c.length - 1]).toContain("8000.00");
    const g = gstRegisterCsv(invoices, "2026-11").trim().split("\r\n");
    expect(g.length).toBe(1 + 2 + 1);
    expect(g[g.length - 1]).toContain("2800.00");
  });
  it("a hostile patient name cannot become a formula in the export", () => {
    const bad = [mk("B", "01/11/2026", 10, "therapeutic", [], { patient: "=1+1" })];
    expect(gstRegisterCsv(bad, "2026-11")).toContain("'=1+1");
  });
});

describe("printable report", () => {
  it("escapes HTML and shows GST payable", () => {
    const bad = [mk("B", "01/11/2026", 10000, "cosmetic", [{ date: "01/11/2026", mode: "Cash", amountP: 100 }])];
    const html = buildReportHtml(bad, "2026-11", { name: "<b>Clinic</b>" });
    expect(html).not.toContain("<b>Clinic</b>");
    expect(html).toContain("&lt;b&gt;Clinic");
    expect(html).toContain("1,800.00");
  });
});

describe("GST summary with mixed invoices", () => {
  it("splits a mixed invoice into exempt and taxable parts", () => {
    const t = computeLineItemTotals({
      items: [
        { description: "RCT", amount: 5000, taxCategory: "therapeutic" },
        { description: "Whitening", amount: 10000, taxCategory: "cosmetic" },
      ],
    });
    const mixed = [{ id: "M", date: "05/11/2026", patient: "R", treatment: "RCT, Whitening", ...t, payments: [] }];
    const { sum, rows } = gstSummaryForMonth(mixed, "2026-11");
    expect(sum.exemptP).toBe(500000);
    expect(sum.taxableAt18P).toBe(1000000);
    expect(sum.taxP).toBe(180000);
    expect(rows[0].category).toBe("Mixed");
  });
});
