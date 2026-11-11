import { describe, it, expect } from "vitest";
import { rxAdviceLines, setText, resetText, RX_ADVICE_DEFAULT, MAX_TEXT } from "../src/templates.js";
import { buildInvoiceHtml } from "../src/billing.js";
import { listOf } from "../src/optionLists.js";

describe("clinic wording", () => {
  it("uses the standard advice unless the clinic writes its own", () => {
    expect(rxAdviceLines({})).toEqual(RX_ADVICE_DEFAULT);
    const p = setText({}, "rxAdvice", "Avoid hot food\n\n  Rinse with salt water  ");
    expect(rxAdviceLines(p)).toEqual(["Avoid hot food", "Rinse with salt water"]);
    expect(rxAdviceLines(resetText(p, "rxAdvice"))).toEqual(RX_ADVICE_DEFAULT);
  });
  it("caps the length", () => {
    expect(setText({}, "invoiceFooter", "x".repeat(2000)).texts.invoiceFooter.length).toBe(MAX_TEXT);
  });
  it("prints the footer safely on invoices", () => {
    const inv = { id: "I1", date: "d", patient: "A", treatment: "t", subtotalP: 0, taxableP: 0, totalP: 0, gstRate: 0, payments: [] };
    const html = buildInvoiceHtml(inv, { name: "C", texts: { invoiceFooter: "Thanks <b>" } });
    expect(html).toContain("Thanks &lt;b&gt;");
    expect(buildInvoiceHtml(inv, { name: "C" })).not.toContain("white-space:pre-line");
  });
  it("offers patient-form lists", () => {
    expect(listOf({}, "referralSources")).toContain("Walk-in");
    expect(listOf({ lists: { guardianRelations: ["Aunt"] } }, "guardianRelations")).toEqual(["Aunt"]);
  });
});
