import { describe, it, expect } from "vitest";
import { invoiceAgeDays, bucketFor, agingSummary, filterInvoices } from "../src/receivables.js";

const now = new Date("2026-11-11T10:00:00");
const inv = (id, date, totalP, paidP = 0) => ({
  id, patient: id, date, totalP, payments: paidP ? [{ date, mode: "Cash", amountP: paidP }] : [],
});

describe("receivables ageing", () => {
  it("counts whole days from the invoice date, never negative", () => {
    expect(invoiceAgeDays({ date: "11/11/2026" }, now)).toBe(0);
    expect(invoiceAgeDays({ date: "01/11/2026" }, now)).toBe(10);
    expect(invoiceAgeDays({ date: "2026-09-12" }, now)).toBe(60);
    expect(invoiceAgeDays({ date: "20/11/2026" }, now)).toBe(0);
    expect(invoiceAgeDays({ date: "garbage" }, now)).toBeNull();
  });

  it("puts ages into the right bucket", () => {
    expect(bucketFor(0).id).toBe("0-7");
    expect(bucketFor(7).id).toBe("0-7");
    expect(bucketFor(8).id).toBe("8-30");
    expect(bucketFor(30).id).toBe("8-30");
    expect(bucketFor(31).id).toBe("31-60");
    expect(bucketFor(60).id).toBe("31-60");
    expect(bucketFor(61).id).toBe("60+");
    expect(bucketFor(null).id).toBe("0-7");
  });

  const list = [
    inv("A", "10/11/2026", 100000),              // 1 day, balance 1000
    inv("B", "01/10/2026", 500000, 200000),      // 41 days, balance 3000
    inv("C", "01/08/2026", 250000),              // 102 days, balance 2500
    inv("D", "01/11/2026", 100000, 100000),      // fully paid
    inv("E", "05/11/2026", 80000),               // 6 days, balance 800
  ];

  it("sums unpaid balance by bucket and ignores paid invoices", () => {
    const s = agingSummary(list, now);
    expect(s.count).toBe(4);
    expect(s.totalP).toBe(100000 + 300000 + 250000 + 80000);
    const by = Object.fromEntries(s.buckets.map((b) => [b.id, [b.count, b.totalP]]));
    expect(by["0-7"]).toEqual([2, 180000]);
    expect(by["8-30"]).toEqual([0, 0]);
    expect(by["31-60"]).toEqual([1, 300000]);
    expect(by["60+"]).toEqual([1, 250000]);
  });

  it("filters: all keeps order, unpaid and buckets list oldest first", () => {
    expect(filterInvoices(list, "all", now).map((i) => i.id)).toEqual(["A", "B", "C", "D", "E"]);
    expect(filterInvoices(list, "unpaid", now).map((i) => i.id)).toEqual(["C", "B", "E", "A"]);
    expect(filterInvoices(list, "0-7", now).map((i) => i.id)).toEqual(["E", "A"]);
    expect(filterInvoices(list, "60+", now).map((i) => i.id)).toEqual(["C"]);
    expect(filterInvoices(list, "8-30", now)).toEqual([]);
  });
});
