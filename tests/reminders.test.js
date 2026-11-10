import { describe, it, expect } from "vitest";
import {
  whatsappNumber, whatsappLink, formatTime12, dueAppointmentReminders, buildAppointmentReminder,
  duePaymentReminders, buildPaymentReminder, markAppointmentReminded, markInvoiceReminded, dateKey, addDays,
} from "../src/reminders.js";
import { normalizeInvoice } from "../src/billing.js";

const NOW = new Date(2026, 10, 10, 9, 0); // 10 Nov 2026, 9:00 local
const appt = (o) => ({ id: "A", patientName: "Ravi", phone: "9876543210", date: "2026-11-11", time: "10:30", status: "Confirmed", doctor: "Dr. Test", procedure: "Scaling", ...o });

describe("phone numbers", () => {
  it("normalises Indian mobiles and rejects bad ones", () => {
    expect(whatsappNumber("98765 43210")).toBe("919876543210");
    expect(whatsappNumber("+91 98765-43210")).toBe("919876543210");
    expect(whatsappNumber("09876543210")).toBe("919876543210");
    expect(whatsappNumber("12345")).toBe("");
    expect(whatsappNumber("5876543210")).toBe("");
    expect(whatsappLink("123", "hi")).toBe("");
  });
  it("encodes the message in the link", () => {
    expect(whatsappLink("9876543210", "a b&c")).toBe("https://wa.me/919876543210?text=a%20b%26c");
  });
});

describe("dates and times", () => {
  it("formats 12 hour time", () => {
    expect(formatTime12("00:05")).toBe("12:05 AM");
    expect(formatTime12("12:00")).toBe("12:00 PM");
    expect(formatTime12("14:30")).toBe("2:30 PM");
  });
  it("adds days across month ends", () => {
    expect(dateKey(addDays(new Date(2026, 0, 31), 1))).toBe("2026-02-01");
  });
});

describe("appointment reminders", () => {
  it("picks tomorrow and later-today appointments only", () => {
    const list = [
      appt({ id: "tomorrow" }),
      appt({ id: "today-later", date: "2026-11-10", time: "15:00" }),
      appt({ id: "today-passed", date: "2026-11-10", time: "08:00" }),
      appt({ id: "next-week", date: "2026-11-17" }),
    ];
    const ids = dueAppointmentReminders(list, NOW).map((d) => d.appt.id);
    expect(ids).toEqual(["today-later", "tomorrow"]);
  });
  it("skips cancelled, invalid phone and already reminded", () => {
    const list = [
      appt({ id: "c", status: "Cancelled" }),
      appt({ id: "p", phone: "123" }),
      appt({ id: "r", reminders: { dayBefore: "2026-11-09T10:00:00Z" } }),
      appt({ id: "ok" }),
    ];
    expect(dueAppointmentReminders(list, NOW).map((d) => d.appt.id)).toEqual(["ok"]);
  });
  it("marking reminded removes it from the due list", () => {
    const a = appt({});
    const marked = markAppointmentReminded(a, "dayBefore", NOW);
    expect(dueAppointmentReminders([marked], NOW)).toEqual([]);
  });
  it("builds a clear message", () => {
    const t = buildAppointmentReminder({ clinicName: "Smile Clinic", appt: appt({}), kind: "dayBefore" });
    expect(t).toContain("Ravi");
    expect(t).toContain("tomorrow");
    expect(t).toContain("10:30 AM");
    expect(t).toContain("Smile Clinic");
  });
});

describe("payment reminders", () => {
  const inv = normalizeInvoice({ id: "INV/2026-27/0001", patient: "Ravi", patientId: "P1", totalP: 100000, payments: [{ amountP: 40000 }] });
  const patients = [{ id: "P1", phone: "9876543210" }];
  it("targets only unpaid invoices with a valid phone", () => {
    const paid = normalizeInvoice({ id: "X", patientId: "P1", totalP: 100, payments: [{ amountP: 100 }] });
    const nophone = { ...inv, id: "Y", patientId: "P2" };
    const due = duePaymentReminders([inv, paid, nophone], patients, NOW);
    expect(due.map((d) => d.inv.id)).toEqual([inv.id]);
  });
  it("does not nag within 3 days", () => {
    const recent = markInvoiceReminded(inv, new Date(2026, 10, 9, 9, 0));
    expect(duePaymentReminders([recent], patients, NOW)).toEqual([]);
    const old = markInvoiceReminded(inv, new Date(2026, 10, 5, 9, 0));
    expect(duePaymentReminders([old], patients, NOW).length).toBe(1);
  });
  it("states the balance and UPI id", () => {
    const t = buildPaymentReminder({ clinicName: "Smile Clinic", inv, upiId: "clinic@upi" });
    expect(t).toContain("₹600.00");
    expect(t).toContain("clinic@upi");
  });
});
