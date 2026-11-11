import { describe, it, expect } from "vitest";
import { dayClose, cashCheck, buildDaySummaryMessage } from "../src/dayClose.js";

const now = new Date(2026, 10, 11, 18, 0);
const pay = (date, mode, amountP) => ({ date, mode, amountP });
const invoices = [
  { id: "I1", patient: "A", date: "11/11/2026", totalP: 500000, items: [], payments: [pay("11/11/2026", "Cash", 100000), pay("11/11/2026", "UPI", 150000), pay("10/11/2026", "Cash", 999)] },
  { id: "I2", patient: "B", date: "10/11/2026", totalP: 200000, items: [], payments: [pay("11/11/2026", "Cheque", 50000)] },
];
const appointments = [
  { date: "2026-11-11", status: "Completed" }, { date: "2026-11-11", status: "Completed" }, { date: "2026-11-11", status: "No show" },
  { date: "2026-11-11", status: "Cancelled" }, { date: "2026-11-11", status: "Confirmed" }, { date: "2026-11-10", status: "Completed" },
];
const patients = [{ registeredDate: "11/11/2026" }, { registeredDate: "2026-11-11" }, { registeredDate: "10/11/2026" }];

describe("dayClose", () => {
  const s = dayClose({ invoices, appointments, patients }, now);
  it("totals only today's payments, by mode, and puts unknown modes under Other", () => {
    expect(s).toMatchObject({ receivedP: 300000, payments: 3, billedP: 500000, invoices: 1 });
    expect(s.byMode).toMatchObject({ Cash: 100000, UPI: 150000, Other: 50000 });
  });
  it("counts today's visits and new patients", () => {
    expect(s).toMatchObject({ completed: 2, noShows: 1, cancelled: 1, stillWaiting: 1, newPatients: 2 });
  });
  it("reports everything still unpaid", () => expect(s.outstandingP).toBe(500000 - 250999 + 200000 - 50000));
  it("is all zeros on a quiet day", () => {
    expect(dayClose({}, now)).toMatchObject({ receivedP: 0, completed: 0, outstandingP: 0 });
  });
  it("checks counted cash against expected", () => {
    expect(cashCheck(s, "")).toBeNull();
    expect(cashCheck(s, "abc")).toBeNull();
    expect(cashCheck(s, "-1")).toBeNull();
    expect(cashCheck(s, "1000")).toMatchObject({ balanced: true, diffP: 0 });
    expect(cashCheck(s, "950")).toMatchObject({ balanced: false, diffP: -5000 });
    expect(cashCheck(s, "1010.50").diffP).toBe(1050);
  });
  it("writes a short message with the cash result", () => {
    const m = buildDaySummaryMessage({ clinicName: "Smile Care", summary: s, cash: cashCheck(s, "950") });
    expect(m).toContain("Smile Care: day summary");
    expect(m).toContain("Received: ₹3,000.00 (Cash ₹1,000.00, UPI ₹1,500.00, Other ₹500.00)");
    expect(m).toContain("2 done, 1 no-show, 1 cancelled, 1 not closed");
    expect(m).toContain("₹50.00 short");
  });
});
