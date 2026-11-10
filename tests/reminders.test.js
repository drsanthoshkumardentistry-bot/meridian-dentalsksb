import { describe, it, expect } from "vitest";
import {
  whatsappNumber, whatsappLink, formatTime12, dueAppointmentReminders, buildAppointmentReminder,
  duePaymentReminders, buildPaymentReminder, markAppointmentReminded, markInvoiceReminded, dateKey, addDays,
  parseAnyDate, monthsBetween, lastVisitDate, dueRecalls, buildRecallMessage, markPatientRecalled, hasWhatsAppConsent,
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

describe("consent", () => {
  it("treats missing consent as allowed and false as opt-out", () => {
    expect(hasWhatsAppConsent({})).toBe(true);
    expect(hasWhatsAppConsent({ consent: { whatsapp: true } })).toBe(true);
    expect(hasWhatsAppConsent({ consent: { whatsapp: false } })).toBe(false);
  });
  it("opted-out patients get no appointment or payment reminders", () => {
    const patients = [{ id: "P9", consent: { whatsapp: false } }];
    expect(dueAppointmentReminders([appt({ patientId: "P9" })], NOW, patients)).toEqual([]);
    expect(dueAppointmentReminders([appt({ patientId: "P9" })], NOW, [])).toHaveLength(1);
    const inv = normalizeInvoice({ id: "I", patient: "X", patientId: "P9", totalP: 100, payments: [] });
    expect(duePaymentReminders([inv], [{ id: "P9", phone: "9876543210", consent: { whatsapp: false } }], NOW)).toEqual([]);
  });
});

describe("dates and months", () => {
  it("parses both date formats", () => {
    expect(dateKey(parseAnyDate("2026-03-05"))).toBe("2026-03-05");
    expect(dateKey(parseAnyDate("05/03/2026"))).toBe("2026-03-05");
    expect(parseAnyDate("junk")).toBeNull();
  });
  it("counts whole months", () => {
    expect(monthsBetween(new Date(2026, 4, 10), new Date(2026, 10, 10))).toBe(6);
    expect(monthsBetween(new Date(2026, 4, 11), new Date(2026, 10, 10))).toBe(5);
  });
});

describe("patient recall", () => {
  const P = (o) => ({ id: "P1", name: "Meena", phone: "9876543210", registeredDate: "01/01/2025", ...o });
  it("finds the latest past visit and ignores future or cancelled ones", () => {
    const appts = [
      { patientId: "P1", date: "2026-02-01", status: "Completed" },
      { patientId: "P1", date: "2026-08-01", status: "Cancelled" },
      { patientId: "P1", date: "2026-12-01", status: "Confirmed" },
    ];
    expect(dateKey(lastVisitDate(P(), appts, [], NOW))).toBe("2026-02-01");
  });
  it("falls back to invoices then registration date", () => {
    expect(dateKey(lastVisitDate(P(), [], [{ patientId: "P1", date: "15/06/2026" }], NOW))).toBe("2026-06-15");
    expect(dateKey(lastVisitDate(P(), [], [], NOW))).toBe("2025-01-01");
  });
  it("is due after 6 months by default, 3 or 12 when set", () => {
    const appts = [{ patientId: "P1", date: "2026-05-01", status: "Completed" }]; // 6 months ago
    expect(dueRecalls([P()], appts, [], NOW)).toHaveLength(1);
    expect(dueRecalls([P({ recallMonths: 12 })], appts, [], NOW)).toHaveLength(0);
    const recent = [{ patientId: "P1", date: "2026-08-15", status: "Completed" }]; // under 3 months
    expect(dueRecalls([P({ recallMonths: 3 })], recent, [], NOW)).toHaveLength(0);
    const older = [{ patientId: "P1", date: "2026-07-01", status: "Completed" }]; // 4 months
    expect(dueRecalls([P({ recallMonths: 3 })], older, [], NOW)).toHaveLength(1);
  });
  it("skips booked, opted-out, bad phone and recently nudged patients", () => {
    const old = [{ patientId: "P1", date: "2025-12-01", status: "Completed" }];
    const booked = [...old, { patientId: "P1", date: "2026-11-20", status: "Confirmed" }];
    expect(dueRecalls([P()], booked, [], NOW)).toHaveLength(0);
    expect(dueRecalls([P({ consent: { whatsapp: false } })], old, [], NOW)).toHaveLength(0);
    expect(dueRecalls([P({ phone: "12" })], old, [], NOW)).toHaveLength(0);
    expect(dueRecalls([markPatientRecalled(P(), new Date(2026, 10, 1))], old, [], NOW)).toHaveLength(0);
    expect(dueRecalls([markPatientRecalled(P(), new Date(2026, 9, 1))], old, [], NOW)).toHaveLength(1);
  });
  it("lists the longest-overdue patient first and writes a clear message", () => {
    const ps = [P({ id: "A", name: "Newer" }), P({ id: "B", name: "Older" })];
    const appts = [
      { patientId: "A", date: "2026-03-01", status: "Completed" },
      { patientId: "B", date: "2025-09-01", status: "Completed" },
    ];
    const d = dueRecalls(ps, appts, [], NOW);
    expect(d.map((x) => x.patient.name)).toEqual(["Older", "Newer"]);
    const msg = buildRecallMessage({ clinicName: "Smile Clinic", clinicPhone: "9840100001", patient: d[0].patient, months: d[0].months });
    expect(msg).toContain("Older");
    expect(msg).toContain("14 months");
    expect(msg).toContain("9840100001");
  });
});
