import { describe, it, expect } from "vitest";
import { buildInvoicePdf, invoicePdfName } from "../src/invoicePdf.js";

const inv = { id: "INV/26-27/001", patient: "Test Patient", date: "12/11/2026", treatment: "Scaling", subtotalP: 100000, totalP: 100000, payments: [{ date: "12/11/2026", mode: "Cash", amountP: 50000 }, null] };

describe("invoice PDF", () => {
  it("makes a real PDF file", async () => {
    const doc = await buildInvoicePdf(inv, { name: "Clinic" }, { receipt: true });
    const head = String.fromCharCode(...new Uint8Array(doc.output("arraybuffer")).slice(0, 5));
    expect(head).toBe("%PDF-");
  });
  it("names the file safely", () => {
    expect(invoicePdfName(inv, true)).toBe("receipt-INV-26-27-001.pdf");
    expect(invoicePdfName({}, false)).toBe("invoice-bill.pdf");
  });
});
