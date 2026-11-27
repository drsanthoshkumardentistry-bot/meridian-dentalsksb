import { describe, it, expect } from "vitest";
import { editVisit, editedLabel, canEditVisits, prefillComplaint, registrationHistory, visitToForm, NRH_TEXT } from "../src/visits.js";
import { voidInvoice, reversePayment, paidPaise, paymentStatus } from "../src/billing.js";
import { alertText } from "../src/medicalAlert.js";

const now = new Date(2026, 10, 27, 19, 50);
const patient = { id: "P1", chiefComplaint: "Pain 36", visits: [{ id: "V1", date: "2026-11-27", complaint: "Pain 36", findings: "Deep caries" }] };

describe("editing a saved visit note", () => {
  it("updates the note and stamps who and when", () => {
    const r = editVisit(patient, "V1", { ...visitToForm(patient.visits[0]), findings: "Deep caries 36. IOPA: periapical lesion" }, "dr@x.com", now);
    expect(r.ok).toBe(true);
    const v = r.patient.visits[0];
    expect(v.id).toBe("V1");
    expect(v.findings).toMatch(/periapical/);
    expect(v.edits).toHaveLength(1);
    expect(editedLabel(v)).toMatch(/^Edited on .*27 Nov 2026.* by dr@x.com$/);
  });
  it("keeps a history across several edits and rejects an empty note", () => {
    const a = editVisit(patient, "V1", visitToForm(patient.visits[0]), "a", now).patient;
    const b = editVisit(a, "V1", { ...visitToForm(a.visits[0]), advice: "Soft diet" }, "b", now).patient;
    expect(b.visits[0].edits).toHaveLength(2);
    expect(editVisit(patient, "V1", { date: "2026-11-27" }, "a", now).ok).toBe(false);
    expect(editVisit(patient, "nope", visitToForm(patient.visits[0]), "a", now).ok).toBe(false);
  });
  it("is limited to owner, manager and dentist", () => {
    expect(["owner", "manager", "dentist"].every(canEditVisits)).toBe(true);
    expect(canEditVisits("receptionist")).toBe(false);
  });
});

describe("chief complaint pre-fill", () => {
  it("fills for a new patient, not once real notes exist", () => {
    expect(prefillComplaint({ chiefComplaint: "Pain 36", visits: [{ fromIntake: true }] })).toBe("Pain 36");
    expect(prefillComplaint({ chiefComplaint: "Pain 36", visits: [{ fromIntake: true }, { id: "x" }] })).toBe("");
    expect(prefillComplaint({ chiefComplaint: " " })).toBe("");
  });
});

describe("registration history", () => {
  it("NRH tick sets both fields and the flag", () => {
    expect(registrationHistory({ nrh: true })).toEqual({ medicalAlert: "", conditions: NRH_TEXT, allergies: NRH_TEXT, nrh: true });
  });
  it("NRH typed in Medical Alert does not raise the red banner", () => {
    const h = registrationHistory({ medicalAlert: "NRH" });
    expect(h.nrh).toBe(true);
    expect(alertText({ ...h })).toBe("");
    expect(alertText({ medicalAlert: "NRH" })).toBe("");
  });
  it("NKDA typed at registration is kept as NKDA", () => {
    expect(registrationHistory({ allergies: " nkda " }).allergies).toBe("NKDA");
    expect(registrationHistory({ allergies: "Penicillin", conditions: "Asthma" })).toMatchObject({ allergies: "Penicillin", conditions: "Asthma", nrh: false });
  });
});

const paid = () => ({ id: "I2", totalP: 50000, payments: [{ date: "1/1/2026", mode: "Cash", amountP: 50000 }, { date: "1/1/2026", mode: "UPI", amountP: 50000 }] });
describe("reversing payments and voiding paid invoices", () => {
  it("reverses one duplicate payment with a reason and keeps the record", () => {
    expect(reversePayment(paid(), 1, " ").ok).toBe(false);
    const r = reversePayment(paid(), 1, "entered twice", "owner@x.com", now);
    expect(r.ok).toBe(true);
    expect(paidPaise(r.invoice)).toBe(50000);
    expect(paymentStatus(r.invoice)).toBe("Paid");
    expect(r.invoice.reversedPayments[0]).toMatchObject({ amountP: 50000, reason: "entered twice", by: "owner@x.com" });
    expect(reversePayment(paid(), 5, "x y z").ok).toBe(false);
  });
  it("reversing the only payment makes the invoice unpaid and voidable", () => {
    const one = { id: "I3", totalP: 50000, payments: [{ date: "d", mode: "Cash", amountP: 50000 }] };
    const r = reversePayment(one, 0, "wrong patient").invoice;
    expect(paymentStatus(r)).toBe("Unpaid");
  });
  it("voids a paid invoice with a reason and keeps the reversed money on the void record", () => {
    expect(voidInvoice(paid(), "").ok).toBe(false);
    const v = voidInvoice(paid(), "wrong patient", "owner@x.com", now).invoice;
    expect(paymentStatus(v)).toBe("Void");
    expect(paidPaise(v)).toBe(0);
    expect(v.voided.reversedPaidP).toBe(100000);
    expect(reversePayment(v, 0, "again").ok).toBe(false);
  });
});

import { safePatients } from "../src/safeRecords.js";
describe("typed history text survives loading", () => {
  it("keeps allergies, conditions and alert as text, and joins an old list", () => {
    const p = { id: "P", name: "A", allergies: "NKDA", conditions: "None / NRH", medicalAlert: "Asthma" };
    expect(safePatients([p])[0]).toBe(p);
    expect(safePatients([{ id: "P", name: "A", allergies: ["Penicillin", "Sulfa"] }])[0].allergies).toBe("Penicillin, Sulfa");
  });
});
