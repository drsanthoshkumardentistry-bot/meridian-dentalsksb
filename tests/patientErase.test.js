import { describe, it, expect } from "vitest";
import { eraseFromRecords, ERASED_NAME } from "../src/patientErase.js";

describe("erasing a patient", () => {
  const appts = [{ id: "A1", patientId: "p1" }, { id: "A2", patientId: "p2" }, { id: "A3", patientId: 1 }];
  const invs = [{ id: "I1", patientId: "p1", patient: "Asha", phone: "9876543210", totalP: 100 }, { id: "I2", patientId: "p2", patient: "Ravi", phone: "9", totalP: 5 }];
  it("removes their appointments and names off their invoices, keeps everyone else", () => {
    const r = eraseFromRecords({ patientId: "p1", appointments: appts, invoices: invs });
    expect(r.appointments.map((a) => a.id)).toEqual(["A2", "A3"]);
    expect(r.invoices[0]).toMatchObject({ id: "I1", patient: ERASED_NAME, phone: "", totalP: 100, erased: true });
    expect(r.invoices[1]).toBe(invs[1]);
    expect(r.removedAppointments).toBe(1); expect(r.anonymisedInvoices).toBe(1);
  });
  it("matches ids across number/string and survives junk lists", () => {
    expect(eraseFromRecords({ patientId: 1, appointments: appts, invoices: [] }).appointments.map((a) => a.id)).toEqual(["A1", "A2"]);
    expect(() => eraseFromRecords({ patientId: "x", appointments: null, invoices: [null, 5, undefined] })).not.toThrow();
  });
});
