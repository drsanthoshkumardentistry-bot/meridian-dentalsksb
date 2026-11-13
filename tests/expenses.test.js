import { describe, it, expect } from "vitest";
import { buildExpense, addExpense, removeExpense, expensesForMonth, profitSummary, expensesCsv, MAX_EXPENSES } from "../src/expenses.js";
import { computeLineItemTotals } from "../src/billing.js";
import { buildBackup, validateBackup, mergeBackup } from "../src/portability.js";

const NOW = new Date(2026, 10, 13, 12);
const inv = (id, rupees, date, paid) => {
  const { lines, exemptP, taxableGstP, ...t } = computeLineItemTotals({ items: [{ description: "x", amount: rupees, taxCategory: "therapeutic" }] });
  return { id, patient: "P", ...t, payments: paid ? [{ date, mode: "Cash", amountP: paid * 100 }] : [], date };
};

describe("expenses", () => {
  it("validates the form", () => {
    expect(buildExpense({ date: "", amount: "10" }, "E1", NOW).ok).toBe(false);
    expect(buildExpense({ date: "2026-12-01", amount: "10" }, "E1", NOW).error).toMatch(/future/);
    expect(buildExpense({ date: "2026-11-01", amount: "0" }, "E1", NOW).ok).toBe(false);
    expect(buildExpense({ date: "2026-11-01", amount: "-5" }, "E1", NOW).ok).toBe(false);
    expect(buildExpense({ date: "2026-11-01", amount: "99999999999" }, "E1", NOW).ok).toBe(false);
    const r = buildExpense({ date: "2026-11-01", amount: "1,250.50", category: "Nope", mode: "Barter", note: " rent " }, "E1", NOW);
    expect(r.ok).toBe(true);
    expect(r.expense).toMatchObject({ amountP: 125050, category: "Other", mode: "Cash", note: "rent" });
  });
  it("adds, removes and caps the list", () => {
    const e = buildExpense({ date: "2026-11-01", amount: "5" }, "E1", NOW).expense;
    const a = addExpense(undefined, e);
    expect(a.list).toHaveLength(1);
    expect(removeExpense(a.list, "E1")).toEqual([]);
    expect(removeExpense(null, "E1")).toEqual([]);
    expect(addExpense(Array.from({ length: MAX_EXPENSES }, (_, i) => ({ id: i })), e).ok).toBe(false);
  });
  it("filters by month and computes profit and loss", () => {
    const list = [
      { id: "a", date: "2026-11-02", category: "Rent", amountP: 1000000, mode: "Cash", note: "" },
      { id: "b", date: "2026-11-10", category: "Lab fees", amountP: 250000, mode: "UPI", note: "crown" },
      { id: "c", date: "2026-10-30", category: "Rent", amountP: 999, mode: "Cash", note: "" },
      null, { id: "bad", date: "2026-11-05", amountP: "x" },
    ];
    expect(expensesForMonth(list, "2026-11").map((e) => e.id)).toEqual(["b", "a"]);
    const s = profitSummary([inv("I1", 20000, "13/11/2026", 20000)], list, "2026-11");
    expect(s).toMatchObject({ receivedP: 2000000, spentP: 1250000, profitP: 750000, count: 2 });
    expect(s.categories[0].category).toBe("Rent");
    expect(profitSummary([], list, "2026-11").profitP).toBe(-1250000);
    expect(profitSummary(undefined, undefined, "2026-11")).toMatchObject({ receivedP: 0, spentP: 0, profitP: 0 });
  });
  it("exports a spreadsheet that blocks formula injection", () => {
    const csv = expensesCsv([{ id: "a", date: "2026-11-02", category: "Rent", amountP: 150000, mode: "Cash", note: "=HYPERLINK(1)" }], "2026-11");
    expect(csv).toContain("1500.00");
    expect(csv).toContain("'=HYPERLINK(1)");
    expect(csv).toContain("TOTAL");
  });
  it("travels in a backup and merges without duplicates", () => {
    const expenses = [{ id: "E1", date: "2026-11-02", category: "Rent", amountP: 100, mode: "Cash", note: "" }];
    const backup = buildBackup({ profile: { name: "C", expenses } });
    expect(validateBackup(backup).ok).toBe(true);
    const m = mergeBackup({ profile: { expenses: [] } }, backup);
    expect(m.expenses).toHaveLength(1);
    expect(m.nothingNew).toBe(false);
    const again = mergeBackup({ profile: { expenses } }, backup);
    expect(again.expenses).toBeNull();
    expect(again.nothingNew).toBe(true);
    backup.data.expenses = [{ id: "bad id!", amountP: 1 }];
    expect(validateBackup(backup).ok).toBe(false);
    backup.data.expenses = "x";
    expect(validateBackup(backup).ok).toBe(false);
  });
});
