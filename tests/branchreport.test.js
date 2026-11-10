import { describe, it, expect } from "vitest";
import { branchComparison, branchComparisonCsv } from "../src/branchReport.js";

const branches = [{ id: "main", name: "Main branch" }, { id: "br2", name: "Peelamedu" }];
const inv = (o) => ({ id: "I", branchId: "main", date: "05/11/2026", totalP: 100000, payments: [], ...o });
const pay = (date, amountP, mode = "Cash") => ({ date, mode, amountP });
const appt = (o) => ({ id: "A", branchId: "main", date: "2026-11-05", status: "Completed", ...o });
const data = {
  invoices: [
    inv({ id: "1", totalP: 500000, payments: [pay("05/11/2026", 300000), pay("20/10/2026", 50000)] }),
    inv({ id: "2", branchId: "br2", totalP: 200000, payments: [pay("07/11/2026", 200000, "UPI")] }),
    inv({ id: "3", branchId: "br2", date: "02/10/2026", totalP: 90000, payments: [] }),
  ],
  appointments: [
    appt({ id: "a1" }), appt({ id: "a2" }), appt({ id: "a3", status: "No show" }), appt({ id: "a4", status: "Cancelled" }),
    appt({ id: "a5", branchId: "br2" }), appt({ id: "a6", date: "2026-10-30" }),
  ],
  patients: [{ id: "p1", registeredDate: "03/11/2026" }, { id: "p2", registeredDate: "2026-11-09", branchId: "br2" }, { id: "p3", registeredDate: "01/10/2026" }],
};
const cmp = branchComparison(branches, data, "2026-11");
const row = (id) => cmp.rows.find((r) => r.id === id);

describe("branchComparison", () => {
  it("counts money received in the month only", () => {
    expect(row("main").collectedP).toBe(300000);
    expect(row("br2").collectedP).toBe(200000);
    expect(cmp.total.collectedP).toBe(500000);
  });
  it("counts invoices raised in the month and all-time outstanding", () => {
    expect(row("main").billedP).toBe(500000);
    expect(row("br2").billedP).toBe(200000);
    expect(row("main").outstandingP).toBe(150000);
    expect(row("br2").outstandingP).toBe(90000);
    expect(cmp.total.outstandingP).toBe(240000);
  });
  it("counts completed visits, no shows and the no-show rate (cancelled visits are left out)", () => {
    expect(row("main")).toMatchObject({ completedVisits: 2, noShows: 1, noShowRate: 33 });
    expect(row("br2")).toMatchObject({ completedVisits: 1, noShows: 0, noShowRate: 0 });
    expect(cmp.total).toMatchObject({ completedVisits: 3, noShows: 1, noShowRate: 25 });
  });
  it("counts new patients by registration date and treats a missing branch as the main branch", () => {
    expect(row("main").newPatients).toBe(1);
    expect(row("br2").newPatients).toBe(1);
  });
  it("averages money received per completed visit", () => {
    expect(row("main").perVisitP).toBe(150000);
    expect(cmp.total.perVisitP).toBe(Math.round(500000 / 3));
  });
  it("shares add up and the top branch is named", () => {
    expect(row("main").sharePct).toBe(60);
    expect(row("br2").sharePct).toBe(40);
    expect(cmp.topBranchId).toBe("main");
  });
  it("handles a month with no data", () => {
    const empty = branchComparison(branches, {}, "2026-11");
    expect(empty.total.collectedP).toBe(0);
    expect(empty.topBranchId).toBeNull();
    expect(empty.rows.every((r) => r.sharePct === 0 && r.noShowRate === 0)).toBe(true);
  });
  it("falls back to one main branch when none are given", () => {
    expect(branchComparison([], { invoices: data.invoices }, "2026-11").rows).toHaveLength(1);
  });
});

describe("branchComparisonCsv", () => {
  it("writes a row per branch and a total, in rupees", () => {
    const csv = branchComparisonCsv(cmp, "2026-11");
    const lines = csv.trim().split("\r\n");
    expect(lines[0]).toBe("Month,2026-11");
    expect(lines[2]).toContain("Branch,Received (Rs)");
    expect(lines.find((l) => l.startsWith("Main branch,"))).toContain("3000.00");
    expect(lines.at(-1)).toMatch(/^Total,5000\.00,7000\.00,2400\.00,3,1,25,2,/);
  });
});
