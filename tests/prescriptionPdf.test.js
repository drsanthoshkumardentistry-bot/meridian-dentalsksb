import { describe, it, expect } from "vitest";
import { buildPrescriptionPdf, rxPdfName } from "../src/prescriptionPdf.js";

const patient = { name: "Asha K", age: 34, phone: "9876543210", prescriptions: [
  { id: "1", drug: "Zerodol-SP", generic: "Aceclofenac + Paracetamol", dosage: "1 Tab", frequency: "1-0-1", duration: "3 Days", instruction: "After Food" }, null,
] };

describe("prescription PDF", () => {
  it("makes a real PDF file", async () => {
    const doc = await buildPrescriptionPdf(patient, { name: "Clinic", drName: "Dr A", councilRegNumber: "TN-123" }, { date: "13/11/2026" });
    const head = String.fromCharCode(...new Uint8Array(doc.output("arraybuffer")).slice(0, 5));
    expect(head).toBe("%PDF-");
  });
  it("works with no medicines and an empty profile", async () => {
    const doc = await buildPrescriptionPdf({ name: "B" }, {});
    expect(doc.getNumberOfPages()).toBe(1);
  });
  it("adds pages for a long list", async () => {
    const many = { name: "C", prescriptions: Array.from({ length: 40 }, (_, i) => ({ id: String(i), drug: `Med ${i}`, frequency: "1-0-1", duration: "3 Days" })) };
    const doc = await buildPrescriptionPdf(many, {});
    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
  });
  it("names the file safely", () => {
    expect(rxPdfName({ name: "Asha K." })).toBe("prescription-asha-k.pdf");
    expect(rxPdfName({})).toBe("prescription-patient.pdf");
  });
});
