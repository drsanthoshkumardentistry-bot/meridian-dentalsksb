import { describe, it, expect } from "vitest";
import { daysToExpiry, stockState, adjustStock, buildStockItem, stockSummary, stockView, buildReorderMessage } from "../src/stock.js";

const now = new Date(2026, 10, 11, 10);
const it1 = (o) => ({ id: "s", name: "Item", category: "Materials", unit: "Boxes", quantity: 10, minThreshold: 5, ...o });

describe("stock state", () => {
  it("separates out, low and healthy", () => {
    expect(stockState(it1({ quantity: 0 }), now)).toMatchObject({ out: true, low: false });
    expect(stockState(it1({ quantity: 5 }), now)).toMatchObject({ out: false, low: true });
    expect(stockState(it1({ quantity: 6 }), now)).toMatchObject({ out: false, low: false });
  });
  it("reads expiry in days and flags expired and soon", () => {
    expect(daysToExpiry(it1({ expiry: "2026-11-21" }), now)).toBe(10);
    expect(daysToExpiry(it1({}), now)).toBeNull();
    expect(stockState(it1({ expiry: "2026-11-10" }), now).expired).toBe(true);
    expect(stockState(it1({ expiry: "2026-11-11" }), now)).toMatchObject({ expired: false, expiringSoon: true });
    expect(stockState(it1({ expiry: "2026-12-11" }), now).expiringSoon).toBe(true);
    expect(stockState(it1({ expiry: "2026-12-12" }), now).expiringSoon).toBe(false);
  });
});

describe("adjustStock", () => {
  it("never goes below zero and updates the label", () => {
    expect(adjustStock(it1({ quantity: 2 }), -5).quantity).toBe(0);
    expect(adjustStock(it1({ quantity: 6 }), -1)).toMatchObject({ quantity: 5, status: "Low Stock" });
    expect(adjustStock(it1({ quantity: 3 }), 10)).toMatchObject({ quantity: 13, status: "In Stock" });
  });
  it("ignores junk amounts", () => {
    expect(adjustStock(it1({ quantity: 4 }), "abc").quantity).toBe(4);
    expect(adjustStock(it1({ quantity: 4 }), 2.9).quantity).toBe(6);
  });
});

describe("buildStockItem", () => {
  const form = { name: " Gloves ", category: "Materials", unit: "Boxes", quantity: "8", minThreshold: "3", expiry: "" };
  it("builds a clean item", () => {
    expect(buildStockItem(form, "STK1")).toEqual({ ok: true, item: { id: "STK1", name: "Gloves", category: "Materials", quantity: 8, unit: "Boxes", minThreshold: 3, status: "In Stock" } });
  });
  it("keeps an expiry date when given", () => {
    expect(buildStockItem({ ...form, expiry: "2027-01-31" }, "x").item.expiry).toBe("2027-01-31");
  });
  it("rejects blank names and negative numbers", () => {
    expect(buildStockItem({ ...form, name: "  " }, "x").ok).toBe(false);
    expect(buildStockItem({ ...form, quantity: "-1" }, "x").error).toMatch(/negative/);
    expect(buildStockItem({ ...form, minThreshold: "-2" }, "x").error).toMatch(/negative/);
  });
  it("marks an item low when it starts at or under its reorder level", () => {
    expect(buildStockItem({ ...form, quantity: "3" }, "x").item.status).toBe("Low Stock");
  });
});

describe("summary, views and reorder list", () => {
  const items = [
    it1({ id: "a", name: "Composite", quantity: 0, minThreshold: 4 }),
    it1({ id: "b", name: "Gloves", quantity: 2, minThreshold: 5 }),
    it1({ id: "c", name: "Anaesthetic", quantity: 20, expiry: "2026-11-20" }),
    it1({ id: "d", name: "Old cement", quantity: 20, expiry: "2026-10-01" }),
    it1({ id: "e", name: "Burs", quantity: 20 })
  ];
  it("summarises", () => {
    expect(stockSummary(items, now)).toEqual({ total: 5, out: 1, low: 1, expiring: 1, expired: 1 });
  });
  it("lists reorder items with the emptiest first, and expiring items soonest first", () => {
    expect(stockView(items, { view: "reorder" }, now).map((i) => i.id)).toEqual(["a", "b"]);
    expect(stockView(items, { view: "expiring" }, now).map((i) => i.id)).toEqual(["d", "c"]);
  });
  it("searches by name, category or unit", () => {
    expect(stockView(items, { query: "glove" }, now).map((i) => i.id)).toEqual(["b"]);
    expect(stockView(items, { view: "reorder", query: "comp" }, now).map((i) => i.id)).toEqual(["a"]);
  });
  it("writes a supplier message only when something needs ordering", () => {
    const m = buildReorderMessage({ clinicName: "Smile", items }, now);
    expect(m).toContain("Composite: 0 left, please send 8 Boxes");
    expect(m).toContain("Gloves: 2 left, please send 8 Boxes");
    expect(m).not.toContain("Burs");
    expect(buildReorderMessage({ clinicName: "Smile", items: [items[4]] }, now)).toBe("");
  });
});
