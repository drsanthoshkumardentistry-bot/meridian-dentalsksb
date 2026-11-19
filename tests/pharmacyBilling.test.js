import { describe, it, expect } from "vitest";
import { buildStockItem, sellableItems, stockBillLine, takeStockForBill } from "../src/stock.js";

const inv = [
  { id: "a", name: "Mouthwash", unit: "bottles", quantity: 5, minThreshold: 1, price: 120 },
  { id: "b", name: "Gloves", unit: "boxes", quantity: 0, minThreshold: 1, price: 300 },
  { id: "c", name: "Cement", unit: "packs", quantity: 4, minThreshold: 1 }
];

describe("pharmacy billing", () => {
  it("keeps an optional selling price on a new item", () => {
    const base = { name: "Floss", category: "Other", quantity: 5, unit: "packs", minThreshold: 1, expiry: "" };
    expect(buildStockItem({ ...base, price: "45" }, "x").item.price).toBe(45);
    expect(buildStockItem({ ...base, price: "" }, "x").item.price).toBeUndefined();
    expect(buildStockItem({ ...base, price: "-1" }, "x").ok).toBe(false);
  });
  it("lists only items with a price and stock", () => {
    expect(sellableItems(inv).map((i) => i.id)).toEqual(["a"]);
  });
  it("makes a bill line and refuses too much", () => {
    const r = stockBillLine(inv[0], 2, () => "L1");
    expect(r.line).toMatchObject({ amount: "240", stockId: "a", stockQty: 2, description: "Mouthwash x 2" });
    expect(stockBillLine(inv[0], 6).error).toMatch(/Only 5/);
    expect(stockBillLine(inv[0], 0).error).toMatch(/at least 1/);
  });
  it("takes stock off, and refuses combined over-selling", () => {
    const ok = takeStockForBill(inv, [{ stockId: "a", stockQty: 2 }, { description: "x" }]);
    expect(ok.inventory.find((i) => i.id === "a").quantity).toBe(3);
    expect(takeStockForBill(inv, [{ stockId: "a", stockQty: 3 }, { stockId: "a", stockQty: 3 }]).ok).toBe(false);
    expect(takeStockForBill(inv, [{ description: "x" }]).inventory).toBe(inv);
  });
});

import { validateCertificate, buildCertificateHtml } from "../src/certificate.js";
describe("patient letters", () => {
  it("validates and builds a referral and a summary", () => {
    expect(validateCertificate({ type: "referral", issuedOn: "2026-11-19", treatment: "" })).toMatch(/reason/);
    expect(validateCertificate({ type: "summary", issuedOn: "2026-11-19", treatment: "RCT 36" })).toBe("");
    const h = buildCertificateHtml({ type: "referral", patient: { name: "A" }, issuedOn: "2026-11-19", treatment: "Impacted <8>", to: "Dr Rao" });
    expect(h).toContain("Dr Rao");
    expect(h).toContain("Impacted &lt;8&gt;");
    expect(buildCertificateHtml({ type: "summary", patient: { name: "A" }, issuedOn: "2026-11-19", treatment: "RCT 36" })).toContain("RCT 36");
  });
});
