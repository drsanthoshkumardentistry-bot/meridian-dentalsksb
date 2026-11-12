import { describe, it, expect } from "vitest";
import { buildInvoiceHtml, normalizeInvoice } from "../src/billing.js";

describe("printed receipt", () => {
  it("forces a white page so dark-mode browsers do not turn the saved PDF black", () => {
    const html = buildInvoiceHtml(normalizeInvoice({ id: "R1", patient: "A", date: "12/11/2026", items: [{ name: "x", qty: 1, price: 100 }], payments: [] }), { name: "Clinic" }, { receipt: true });
    expect(html).toContain('content="light only"');
    expect(html).toMatch(/background:#fff !important/);
  });
});
