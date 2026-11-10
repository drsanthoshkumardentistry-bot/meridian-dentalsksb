import { describe, it, expect } from "vitest";
import {
  validatePlan, createPlan, planTotals, approvePlan, declinePlan, canBill, markPlanBilled,
  planToInvoiceItems, buildPlanMessage, buildPlanHtml, parseTeeth, plannedTeeth, suggestPlanItems,
  newShareToken, shareUrl, buildShareDoc, isShareExpired, applyShareDecision, buildShareMessage,
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

  it("makes long unguessable URL-safe tokens", () => {
    const a = newShareToken();
    const b = newShareToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(a).not.toBe(b);
    expect(shareUrl("https://x.test/", "abc")).toBe("https://x.test/?plan=abc");
  });

  it("shares only first name, clinic name and the priced plan", () => {
    const plan = createPlan(draft(), day);
    const doc = buildShareDoc({ plan, patient: { id: "P-9", name: "Asha Devi Kumar", phone: "9876543210" }, profile: { name: "Smile Clinic", phone: "1", address: "somewhere" }, clinicId: "u1" }, day);
    expect(doc.patientFirstName).toBe("Asha");
    expect(doc.clinicName).toBe("Smile Clinic");
    expect(doc.totalP).toBe(736000);
    expect(doc.items.map((i) => i.amountP)).toEqual([500000, 200000]);
    expect(doc.decision).toBe("pending");
    const text = JSON.stringify(doc);
    expect(text).not.toMatch(/9876543210|Devi|Kumar|somewhere/);
    expect(isShareExpired(doc, day)).toBe(false);
    expect(isShareExpired(doc, new Date("2026-12-20T00:00:00"))).toBe(true);
    expect(isShareExpired(null)).toBe(true);
    expect(isShareExpired({ expiresAt: { toDate: () => new Date("2030-01-01") } }, day)).toBe(false);
  });

  it("applies a patient's online answer only to a Proposed plan", () => {
    const p = createPlan(draft(), day);
    expect(applyShareDecision(p, { decision: "pending" }, day)).toBe(p);
    const ok = applyShareDecision(p, { decision: "approved", decidedName: "Asha Devi" }, day);
    expect(ok.status).toBe("Approved");
    expect(ok.decidedBy).toBe("Asha Devi (online)");
    expect(applyShareDecision(p, { decision: "declined" }, day).status).toBe("Declined");
    expect(applyShareDecision(ok, { decision: "declined" }, day)).toBe(ok);
    expect(buildShareMessage(p, { name: "Asha" }, { name: "Smile" }, "https://x/?plan=t")).toContain("https://x/?plan=t");
  });
});
