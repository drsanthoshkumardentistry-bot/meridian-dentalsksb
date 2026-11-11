import { describe, it, expect } from "vitest";
import { cleanPhysician, physicianStatus, historySummary, hasPhysicianInfo } from "../src/physician.js";

const now = new Date(2026, 10, 11, 12);

describe("physician details", () => {
  it("keeps a real past date and drops future or invalid ones", () => {
    expect(cleanPhysician({ lastConsultDate: "2026-09-01" }, now).lastConsultDate).toBe("2026-09-01");
    expect(cleanPhysician({ lastConsultDate: "2027-01-01" }, now).lastConsultDate).toBe("");
    expect(cleanPhysician({ lastConsultDate: "yesterday" }, now).lastConsultDate).toBe("");
  });
  it("limits text and accepts only known clearance values", () => {
    const p = cleanPhysician({ name: "x".repeat(200), clearance: "Whatever" }, now);
    expect(p.name.length).toBe(80);
    expect(p.clearance).toBe("");
    expect(cleanPhysician({ clearance: "Fit for dental treatment" }, now).clearance).toBe("Fit for dental treatment");
  });
  it("knows when nothing is recorded", () => {
    expect(hasPhysicianInfo(cleanPhysician({}, now))).toBe(false);
    expect(hasPhysicianInfo(cleanPhysician({ name: "Dr A" }, now))).toBe(true);
  });
});

describe("physician status", () => {
  it("is recent for a new consult", () => {
    const s = physicianStatus({ conditions: "Diabetes", physician: { lastConsultDate: "2026-10-20" } }, now);
    expect(s.state).toBe("recent");
    expect(s.label).toMatch(/less than a month ago/);
  });
  it("nudges when old and the patient has a condition", () => {
    const s = physicianStatus({ conditions: "Hypertension", physician: { lastConsultDate: "2026-02-01" } }, now);
    expect(s.state).toBe("old");
    expect(s.tone).toBe("warn");
  });
  it("does not nudge a healthy patient with an old consult", () => {
    expect(physicianStatus({ conditions: "None", physician: { lastConsultDate: "2025-01-01" } }, now).state).toBe("recent");
  });
  it("asks when a patient with a condition has no consult recorded", () => {
    expect(physicianStatus({ conditions: "Diabetes" }, now).state).toBe("missing");
    expect(physicianStatus({ conditions: "" }, now).state).toBe("none");
  });
});

describe("history summary", () => {
  const patient = {
    id: "P1", name: "Asha", conditions: "Diabetes", allergies: "Penicillin", medicalAlert: "Bleeding disorder",
    visits: [{ id: "v1", date: "2026-08-01", complaint: "Pain" }, { id: "v2", date: "2026-10-15", complaint: "Check-up", treatment: "Scaling" }],
    physician: { name: "Dr Ramesh", lastConsultDate: "2026-10-01" },
    plans: [{ status: "Proposed" }, { status: "Declined" }],
  };
  const appointments = [
    { id: "a1", patientId: "P1", date: "2026-10-15", time: "10:00", status: "Completed", doctor: "Dr S" },
    { id: "a2", patientId: "P1", date: "2026-11-20", time: "11:00", status: "Scheduled", doctor: "Dr S" },
    { id: "a3", patientId: "P2", date: "2026-11-12", time: "09:00", status: "Scheduled" },
    { id: "a4", patientName: "asha", date: "2026-11-15", time: "09:30", status: "Cancelled" },
  ];
  const invoices = [
    { id: "i1", patientId: "P1", date: "2026-10-15", totalP: 100000, payments: [{ amountP: 40000 }] },
    { id: "i2", patient: "Other", date: "2026-11-01", totalP: 50000, payments: [] },
  ];
  it("pulls the newest facts for this patient only", () => {
    const s = historySummary(patient, { appointments, invoices, now });
    expect(s.lastVisit.id).toBe("v2");
    expect(s.nextAppointment.id).toBe("a2");
    expect(s.lastCompletedAppointment.id).toBe("a1");
    expect(s.lastInvoice.id).toBe("i1");
    expect(s.dueP).toBe(60000);
    expect(s.plansOpen).toBe(1);
    expect(s.physician.name).toBe("Dr Ramesh");
    expect(s.physicianStatus.state).toBe("recent");
  });
  it("copes with an empty patient", () => {
    const s = historySummary({ id: "Z", name: "New" }, { now });
    expect(s.lastVisit).toBeNull();
    expect(s.nextAppointment).toBeNull();
    expect(s.lastInvoice).toBeNull();
    expect(s.physician).toBeNull();
  });
});
