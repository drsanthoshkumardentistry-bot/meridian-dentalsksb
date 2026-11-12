import { describe, it, expect } from "vitest";
import { todaySummary } from "../src/today.js";
import { memberDiscountRupees, membershipInvoice, leadPatientPrefill } from "../src/growth.js";
import { balancePaise, normalizeInvoice, paymentStatus } from "../src/billing.js";
import { firstScreen, navFor } from "../src/roles.js";

describe("todaySummary", () => {
  const today = "2026-11-12";
  it("collects what reception needs", () => {
    const s = todaySummary({
      today,
      appointments: [
        { id: "2", date: today, time: "11:00", patientName: "B", status: "Scheduled" },
        { id: "1", date: today, time: "09:00", patientName: "A", status: "Completed" },
        { id: "3", date: "2026-11-13", time: "09:00", patientName: "C" },
      ],
      invoices: [
        { id: "I1", patient: "A", totalP: 10000, payments: [{ amountP: 4000 }], dueDate: "2026-11-01" },
        { id: "I2", patient: "B", totalP: 5000, payments: [{ amountP: 5000 }] },
      ],
      leads: [{ id: "L1", name: "R", phone: "9876543210", status: "New", followUpOn: "2026-11-12" }, { id: "L2", status: "Booked", followUpOn: "2026-11-01" }],
      memberships: [{ id: "M1", planName: "Gold", startOn: "2025-12-01", endOn: "2026-12-01" }, { id: "M2", startOn: "2026-01-01", endOn: "2027-06-01" }],
    });
    expect(s.appts.map((a) => a.id)).toEqual(["1", "2"]);
    expect(s).toMatchObject({ upcomingCount: 1, doneCount: 1, unpaidCount: 1, unpaidP: 6000 });
    expect(s.overdue).toHaveLength(1);
    expect(s.leadsDue.map((l) => l.id)).toEqual(["L1"]);
    expect(s.expiring.map((e) => e.m.id)).toEqual(["M1"]);
  });
  it("is empty without data", () => {
    expect(todaySummary()).toMatchObject({ appts: [], unpaidCount: 0, leadsDue: [], expiring: [] });
  });
});

describe("billing links", () => {
  it("works out a member discount in rupees", () => {
    expect(memberDiscountRupees([{ amount: "1000" }, { amount: "500" }], 10)).toBe("150");
    expect(memberDiscountRupees([{ amount: "" }], 10)).toBe("");
    expect(memberDiscountRupees([{ amount: "100" }], 0)).toBe("");
  });
  it("builds a paid membership invoice", () => {
    const m = { id: "MB1", patientId: "P1", patientName: "Asha", planName: "Gold", startOn: "2026-11-12", endOn: "2027-11-12", paidP: 150000, mode: "UPI" };
    const inv = normalizeInvoice(membershipInvoice(m, "INV-1", "12/11/2026"));
    expect(inv).toMatchObject({ id: "INV-1", patientId: "P1", totalP: 150000, taxP: 0, membershipId: "MB1" });
    expect(balancePaise(inv)).toBe(0);
    expect(paymentStatus(inv)).toBe("Paid");
  });
  it("prefills a patient from a lead", () => {
    expect(leadPatientPrefill({ name: "Ravi", phone: "9876543210" })).toEqual({ name: "Ravi", phone: "9876543210" });
  });
});

describe("menu", () => {
  it("no longer lists Today separately (it lives in the Appointments Diary) and still opens on Patients", () => {
    const items = [{ label: "Today" }];
    expect(navFor("receptionist", items)).toHaveLength(0);
    expect(navFor("dentist", items)).toHaveLength(0);
    expect(firstScreen("receptionist")).toBe("Patients & Odontogram");
    expect(firstScreen("dentist")).toBe("Patients & Odontogram");
  });
});
