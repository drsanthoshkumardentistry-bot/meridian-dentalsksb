// Clinic expenses and monthly profit (pure helpers). Expenses live inside the clinic profile, so no new database rules are needed.
import { toPaise, MAX_AMOUNT_P } from "./billing.js";
import { dateKey } from "./reminders.js";
import { collectionsForMonth, toCsv } from "./reports.js";

export const EXPENSE_CATEGORIES = ["Rent", "Salaries", "Lab fees", "Dental materials", "Utilities", "Equipment and repairs", "Marketing", "Software and internet", "Taxes and fees", "Other"];
export const EXPENSE_MODES = ["Cash", "UPI", "Card", "Bank transfer"];
export const MAX_EXPENSES = 5000;

/** Validates one expense form. Amounts are rupees typed by the user; stored in paise. */
export const buildExpense = (form = {}, id, now = new Date()) => {
  const date = String(form.date || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: "Choose the date of the expense" };
  if (date > dateKey(now)) return { ok: false, error: "The date cannot be in the future" };
  const amountP = toPaise(form.amount);
  if (!(amountP > 0)) return { ok: false, error: "Enter an amount greater than zero" };
  if (amountP > MAX_AMOUNT_P) return { ok: false, error: "That amount is too large. Check for extra zeros" };
  return {
    ok: true,
    expense: {
      id,
      date,
      category: EXPENSE_CATEGORIES.includes(form.category) ? form.category : "Other",
      amountP,
      mode: EXPENSE_MODES.includes(form.mode) ? form.mode : "Cash",
      note: String(form.note || "").trim().slice(0, 120),
    },
  };
};

export const addExpense = (list, expense) => {
  const cur = Array.isArray(list) ? list.filter((e) => e && typeof e === "object") : [];
  if (cur.length >= MAX_EXPENSES) return { ok: false, error: "The expense list is full. Download it as a spreadsheet and clear old years first" };
  return { ok: true, list: [expense, ...cur] };
};
export const removeExpense = (list, id) => (Array.isArray(list) ? list : []).filter((e) => e && e.id !== id);

export const expensesForMonth = (list, ym) =>
  (Array.isArray(list) ? list : [])
    .filter((e) => e && typeof e.date === "string" && e.date.slice(0, 7) === ym && Number.isFinite(e.amountP) && e.amountP > 0)
    .sort((a, b) => b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id)));

/** Money received minus money spent for the month. Received includes GST collected; it is not an income-tax figure. */
export const profitSummary = (invoices, expenses, ym) => {
  const receivedP = collectionsForMonth(invoices || [], ym).totals.totalP;
  const rows = expensesForMonth(expenses, ym);
  const byCategory = {};
  let spentP = 0;
  for (const e of rows) { spentP += e.amountP; byCategory[e.category] = (byCategory[e.category] || 0) + e.amountP; }
  const categories = Object.entries(byCategory).map(([category, amountP]) => ({ category, amountP })).sort((a, b) => b.amountP - a.amountP);
  return { receivedP, spentP, profitP: receivedP - spentP, categories, count: rows.length };
};

export const expensesCsv = (list, ym) => {
  const rows = expensesForMonth(list, ym);
  const rupees = (p) => (p / 100).toFixed(2);
  const total = rows.reduce((s, e) => s + e.amountP, 0);
  return toCsv([["Date", "Category", "Amount (INR)", "Paid by", "Note"], ...rows.map((e) => [e.date, e.category, rupees(e.amountP), e.mode, e.note || ""]), ["TOTAL", "", rupees(total), "", ""]]);
};
