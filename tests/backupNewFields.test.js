import { describe, it, expect } from "vitest";
import { buildBackup, parseBackupText, normalizeBackup, validateBackup, mergeBackup, encryptBackup, decryptBackup } from "../src/portability.js";
import { editVisit, visitToForm, registrationHistory } from "../src/visits.js";
import { reversePayment, voidInvoice } from "../src/billing.js";
import { safePatients } from "../src/safeRecords.js";

const now = new Date(2026, 10, 28, 2, 0);
const base = { id: "P1", name: "Asha", phone: "9876543210", chiefComplaint: "Pain 36", visits: [{ id: "V1", date: "2026-11-27", complaint: "Pain 36", findings: "Caries" }] };
const patient = { ...editVisit({ ...base, ...registrationHistory({ allergies: "nkda", nrh: false }) }, "V1", { ...visitToForm(base.visits[0]), advice: "Soft diet" }, "dr@x.com", now).patient };
const inv = (id) => ({ id, patientId: "P1", patient: "Asha", totalP: 100000, date: "01/11/2026", payments: [{ date: "d", mode: "Cash", amountP: 100000 }, { date: "d", mode: "UPI", amountP: 100000 }] });
const reversed = reversePayment(inv("INV/1"), 1, "entered twice", "owner", now).invoice;
const voided = voidInvoice(inv("INV/2"), "wrong patient", "owner", now).invoice;

describe("backup keeps the newest clinic data", () => {
  it("round-trips edited notes, NKDA, reversed payments and voided paid invoices, encrypted too", async () => {
    const backup = buildBackup({ patients: [patient], invoices: [reversed, voided], profile: { name: "Clinic" } }, now);
    const env = await encryptBackup(backup, "a-strong-pass");
    const parsed = parseBackupText(JSON.stringify(env));
    expect(parsed.encrypted).toBe(true);
    const dec = await decryptBackup(parsed.envelope, "a-strong-pass");
    expect(dec.ok).toBe(true);
    const back = normalizeBackup(dec.backup);
    expect(validateBackup(back).ok).toBe(true);
    const merged = mergeBackup({ patients: [], invoices: [], appointments: [], inventory: [], employees: [], profile: {} }, back);
    const p = safePatients(merged.merged.patients)[0];
    expect(p.allergies).toBe("NKDA");
    expect(p.visits[0].edits).toHaveLength(1);
    expect(p.visits[0].editedBy).toBe("dr@x.com");
    const [i1, i2] = merged.merged.invoices;
    expect(i1.payments).toHaveLength(1);
    expect(i1.reversedPayments[0].reason).toBe("entered twice");
    expect(i2.voided.reversedPaidP).toBe(200000);
  });
});
