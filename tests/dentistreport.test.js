import { describe, it, expect } from "vitest";
import { dentistEarnings, dentistEarningsCsv, cleanPct, UNASSIGNED } from "../src/dentistReport.js";

const inv = (o) => ({ id: "I", patient: "X", date: "05/11/2026", totalP: 100000, items: [], payments: [], ...o });
const invoices = [
  inv({ id: "I1", doctor: "Dr Asha", totalP: 500000, payments: [{ date: "05/11/2026", mode: "Cash", amountP: 300000 }, { date: "02/12/2026", mode: "UPI", amountP: 100000 }] }),
  inv({ id: "I2", doctor: " dr asha ", totalP: 200000, payments: [{ date: "09/11/2026", mode: "Cash", amountP: 200000 }] }),
  inv({ id: "I3", doctor: "Dr Ravi", totalP: 100000, date: "20/10/2026", payments: [{ date: "03/11/2026", mode: "Card", amountP: 50000 }] }),
  inv({ id: "I4", totalP: 80000, payments: [{ date: "07/11/2026", mode: "Cash", amountP: 80000 }] }),
];
const appts = [
  { doctor: "Dr Asha", date: "2026-11-02", status: "Completed" }, { doctor: "dr asha", date: "2026-11-03", status: "Completed" },
  { doctor: "Dr Asha", date: "2026-11-04", status: "Cancelled" }, { doctor: "Dr Ravi", date: "2026-10-30", status: "Completed" },
];

describe("dentistEarnings", () => {
  const r = dentistEarnings(invoices, appts, "2026-11", { "Dr Asha": 30, "dr ravi": "10" });
  it("credits payments to the dentist in the month they were paid, ignoring name case and spaces", () => {
    const a = r.rows.find((x) => x.name === "Dr Asha");
    expect(a).toMatchObject({ collectedP: 500000, billedP: 700000, invoices: 2, completedVisits: 2, commissionPct: 30, commissionP: 150000 });
  });
  it("counts bills in their own month and keeps invoices without a dentist apart", () => {
    expect(r.rows.find((x) => x.name === "Dr Ravi")).toMatchObject({ collectedP: 50000, billedP: 0, completedVisits: 0, commissionP: 5000 });
    expect(r.rows.find((x) => x.name === UNASSIGNED).collectedP).toBe(80000);
  });
  it("sorts by money received and totals everything", () => {
    expect(r.rows.map((x) => x.name)).toEqual(["Dr Asha", UNASSIGNED, "Dr Ravi"]);
    expect(r.total).toMatchObject({ collectedP: 630000, billedP: 780000, commissionP: 155000 });
  });
  it("returns nothing for a month with no activity", () => expect(dentistEarnings(invoices, appts, "2025-01").rows).toEqual([]));
  it("cleans commission rates", () => {
    expect([cleanPct("abc"), cleanPct(-5), cleanPct(150), cleanPct("12.345")]).toEqual([0, 0, 100, 12.35]);
  });
  it("exports a spreadsheet in rupees with a total row", () => {
    const lines = dentistEarningsCsv(r, "2026-11").trim().split("\r\n");
    expect(lines[1]).toBe("2026-11,Dr Asha,5000.00,7000.00,2,2,0,0,2500.00,30,1500.00");
    expect(lines.at(-1)).toBe("2026-11,Total,6300.00,7800.00,3,2,0,0,,,1550.00");
  });
});
