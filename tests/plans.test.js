import { describe, it, expect } from "vitest";
import {
  validatePlan, createPlan, planTotals, approvePlan, declinePlan, canBill, markPlanBilled,
  planToInvoiceItems, buildPlanMessage, buildPlanHtml,
} from "../src/plans.js";

const draft = () => ({
  id: "PL-1",
  title: "Smile makeover",
  items: [
    { id: "a", description: "Root canal", tooth: "46", amount: "5000", taxCategory: "therapeutic" },
    { id: "b", description: "Whitening", tooth: "", amount: "2000", taxCategory: "cosmetic" },
  ],
});
const day = new Date("2026-11-11T10:00:00");

describe("treatment plans", () => {
  it("validates title, items, descriptions and amounts", () => {
    expect(validatePlan({ title: "", items: draft().items })).toMatch(/title/i);
    expect(validatePlan({ title: "x", items: [] })).toMatch(/at least one/i);
    expect(validatePlan({ title: "x", items: [{ description: "", amount: "5" }] })).toMatch(/Describe/);
    expect(validatePlan({ title: "x", items: [{ description: "a", amount: "0" }] })).toMatch(/greater than zero/);
    expect(validatePlan(draft())).toBe("");
  });

  it("creates a Proposed plan and totals it with mixed GST", () => {
    const p = createPlan(draft(), day);
    expect(p.status).toBe("Proposed");
    expect(planTotals(p).totalP).toBe(736000);
  });

  it("approve, decline and re-approve; a billed plan cannot change", () => {
    let p = createPlan(draft(), day);
    expect(canBill(p)).toBe(false);
    p = approvePlan(p, "Self", day);
    expect(p.status).toBe("Approved");
    expect(p.decidedBy).toBe("Self");
    expect(canBill(p)).toBe(true);
    p = declinePlan(p, day);
    expect(p.status).toBe("Declined");
    expect(markPlanBilled(p, "INV/1").status).toBe("Declined");
    p = approvePlan(p, "Guardian", day);
    const billed = markPlanBilled(p, "INV/2026-27/0001");
    expect(billed.status).toBe("Billed");
    expect(billed.invoiceId).toBe("INV/2026-27/0001");
    expect(approvePlan(billed, "x", day).status).toBe("Billed");
    expect(declinePlan(billed, day).status).toBe("Billed");
  });

  it("converts to invoice rows with the tooth in the description", () => {
    let n = 0;
    const rows = planToInvoiceItems(createPlan(draft(), day), () => `r${++n}`);
    expect(rows[0]).toEqual({ id: "r1", description: "Root canal (tooth 46)", amount: "5000", taxCategory: "therapeutic" });
    expect(rows[1].description).toBe("Whitening");
  });

  it("builds a WhatsApp message and escapes HTML in the printout", () => {
    const p = createPlan({ ...draft(), title: "<b>Plan</b>" }, day);
    const msg = buildPlanMessage(p, { name: "Asha" }, { name: "Smile Clinic" });
    expect(msg).toContain("Asha");
    expect(msg).toContain("₹7,360");
    expect(msg).toMatch(/estimate/i);
    const html = buildPlanHtml(p, { name: "Asha" }, { name: "Smile Clinic" });
    expect(html).not.toContain("<b>Plan</b>");
    expect(html).toContain("&lt;b&gt;Plan&lt;/b&gt;");
  });
});
