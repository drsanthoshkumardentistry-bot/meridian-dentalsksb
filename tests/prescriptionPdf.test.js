import { describe, it, expect, vi } from "vitest";
import { buildPrescriptionPdf, rxPdfName, canSharePdfFile, sharePrescriptionPdf } from "../src/prescriptionPdf.js";

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

describe("sending the prescription as a PDF file", () => {
  it("knows whether this device can share a file", () => {
    expect(canSharePdfFile({})).toBe(false);
    expect(canSharePdfFile({ share: () => {} })).toBe(false);
    expect(canSharePdfFile({ share: () => {}, canShare: () => false })).toBe(false);
    expect(canSharePdfFile({ share: () => {}, canShare: (d) => Array.isArray(d.files) && d.files[0].type === "application/pdf" })).toBe(true);
    expect(canSharePdfFile({ share: () => {}, canShare: () => { throw new Error("x"); } })).toBe(false);
  });
  it("hands a real PDF file to the share sheet", async () => {
    const share = vi.fn().mockResolvedValue();
    const r = await sharePrescriptionPdf({ patient, profile: { name: "Clinic" }, text: "Hi", nav: { share } });
    expect(r).toBe("shared");
    const arg = share.mock.calls[0][0];
    expect(arg.files).toHaveLength(1);
    expect(arg.files[0].name).toBe("prescription-asha-k.pdf");
    expect(arg.files[0].type).toBe("application/pdf");
    expect(arg.files[0].size).toBeGreaterThan(500);
    expect(arg.text).toBe("Hi");
  });
  it("treats closing the share sheet as cancelled, and passes real errors on", async () => {
    const abort = Object.assign(new Error("x"), { name: "AbortError" });
    expect(await sharePrescriptionPdf({ patient, profile: {}, nav: { share: vi.fn().mockRejectedValue(abort) } })).toBe("cancelled");
    await expect(sharePrescriptionPdf({ patient, profile: {}, nav: { share: vi.fn().mockRejectedValue(new Error("boom")) } })).rejects.toThrow("boom");
  });
});
