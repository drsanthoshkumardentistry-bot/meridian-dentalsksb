import { describe, it, expect } from "vitest";
import {
  validatePlan, createPlan, planTotals, approvePlan, declinePlan, canBill, markPlanBilled,
  planToInvoiceItems, buildPlanMessage, buildPlanHtml, parseTeeth, plannedTeeth, suggestPlanItems,
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

  it("parses tooth lists and rejects invalid FDI numbers", () => {
    expect(parseTeeth("16, 17  26;16")).toEqual([16, 17, 26]);
    expect(parseTeeth("")).toEqual([]);
    const items = [{ id: "a", description: "x", tooth: "16, 99", amount: "5" }];
    expect(validatePlan({ title: "t", items })).toMatch(/valid FDI/);
    items[0].tooth = "16, 17";
    expect(validatePlan({ title: "t", items })).toBe("");
  });

  it("marks teeth on the chart only for live plans", () => {
    const base = createPlan({ ...draft(), id: "A" }, day); // tooth 46 proposed
    const billed = { ...createPlan({ id: "B", title: "b", items: [{ id: "z", description: "d", tooth: "11", amount: "5" }] }, day), status: "Billed" };
    const declined = { ...createPlan({ id: "C", title: "c", items: [{ id: "y", description: "d", tooth: "21", amount: "5" }] }, day), status: "Declined" };
    expect([...plannedTeeth([base, billed, declined])]).toEqual([46]);
    expect(plannedTeeth(undefined).size).toBe(0);
  });

  it("suggests treatments from charted findings, ordered by tooth", () => {
    let n = 0;
    const rows = suggestPlanItems({ 26: "CAR", 16: "SCL", 11: "RES", 18: "MIS", 99: "CAR" }, () => `r${++n}`);
    expect(rows.map((r) => [r.tooth, r.description])).toEqual([
      ["16", "Scaling and polishing"],
      ["18", "Replacement of missing tooth"],
      ["26", "Restoration (filling)"],
    ]);
    expect(rows[0].amount).toBe("");
  });
});
