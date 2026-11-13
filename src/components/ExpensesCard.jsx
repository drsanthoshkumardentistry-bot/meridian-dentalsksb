import React, { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { EXPENSE_CATEGORIES, EXPENSE_MODES, expensesForMonth, profitSummary } from "../expenses.js";
import { formatINR } from "../billing.js";
import { monthLabel } from "../reports.js";
import { dateKey } from "../reminders.js";

const input = "px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:border-blue-500";

/** Money spent and monthly profit. Owners and managers add expenses; everyone who can open Reports sees the totals. */
export default function ExpensesCard({ expenses, invoices, ym, canEdit, onAdd, onRemove, onDownload }) {
  const blank = { date: dateKey(), category: EXPENSE_CATEGORIES[0], amount: "", mode: "Cash", note: "" };
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const sum = profitSummary(invoices, expenses, ym);
  const rows = expensesForMonth(expenses, ym);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = (e) => {
    e.preventDefault();
    const err = onAdd(form);
    if (err) { setError(err); return; }
    setError(""); setForm({ ...blank, category: form.category });
  };
  return (
    <section className="bg-white border border-rule rounded-xl p-4 space-y-3" aria-label="Expenses and profit" data-testid="expenses-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs font-bold text-slate-900">Expenses and profit · {monthLabel(ym)}</h2>
        <button type="button" onClick={onDownload} className="px-3 py-1.5 bg-white border border-rule hover:bg-enamel rounded-lg text-xs font-semibold text-slate-800 inline-flex items-center gap-1.5">
          <Download className="w-3.5 h-3.5" /> Expenses (spreadsheet)
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3 text-xs">
        <div><div className="text-[11px] font-semibold text-slate-500">Received</div><div className="text-base font-bold text-emerald-700">₹{formatINR(sum.receivedP)}</div></div>
        <div><div className="text-[11px] font-semibold text-slate-500">Spent</div><div className="text-base font-bold text-slate-900">₹{formatINR(sum.spentP)}</div></div>
        <div><div className="text-[11px] font-semibold text-slate-500">{sum.profitP < 0 ? "Loss" : "Profit"}</div><div className={`text-base font-bold ${sum.profitP < 0 ? "text-rose-600" : "text-blue-700"}`} data-testid="profit-value">₹{formatINR(Math.abs(sum.profitP))}</div></div>
      </div>
      <p className="text-[11px] text-slate-500">Money received includes GST collected, so this is a cash view for the month, not an income-tax figure.</p>
      {sum.categories.length > 0 && (
        <ul className="text-xs grid sm:grid-cols-2 gap-x-6 gap-y-1" aria-label="Spending by category">
          {sum.categories.map((c) => <li key={c.category} className="flex justify-between"><span className="text-slate-700">{c.category}</span><span className="font-semibold tabular">₹{formatINR(c.amountP)}</span></li>)}
        </ul>
      )}
      {canEdit && (
        <form onSubmit={submit} className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-end">
          <label className="text-[11px] font-semibold text-slate-600">Date<input type="date" className={`${input} w-full`} max={dateKey()} value={form.date} onChange={set("date")} /></label>
          <label className="text-[11px] font-semibold text-slate-600">Category<select className={`${input} w-full`} value={form.category} onChange={set("category")}>{EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="text-[11px] font-semibold text-slate-600">Amount (₹)<input className={`${input} w-full`} inputMode="decimal" value={form.amount} onChange={set("amount")} /></label>
          <label className="text-[11px] font-semibold text-slate-600">Paid by<select className={`${input} w-full`} value={form.mode} onChange={set("mode")}>{EXPENSE_MODES.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="text-[11px] font-semibold text-slate-600">Note<input className={`${input} w-full`} maxLength={120} value={form.note} onChange={set("note")} /></label>
          <button type="submit" className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">Add expense</button>
        </form>
      )}
      {error && <p role="alert" className="text-xs font-semibold text-rose-600">{error}</p>}
      {rows.length === 0 ? <p className="text-xs text-slate-500">No expenses recorded for this month.</p> : (
        <ul className="divide-y divide-slate-100 text-xs max-h-64 overflow-auto" aria-label="Expenses this month">
          {rows.map((e) => (
            <li key={e.id} className="flex items-center gap-3 py-1.5">
              <span className="w-20 text-slate-500 tabular">{e.date.split("-").reverse().join("/")}</span>
              <span className="font-semibold text-slate-800">{e.category}</span>
              <span className="text-slate-500 truncate flex-1">{e.note}</span>
              <span className="font-bold tabular">₹{formatINR(e.amountP)}</span>
              {canEdit && <button type="button" onClick={() => onRemove(e.id)} aria-label={`Delete ${e.category} expense of ₹${formatINR(e.amountP)}`} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
