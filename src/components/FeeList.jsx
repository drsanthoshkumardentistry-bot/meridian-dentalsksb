import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { TAX_CATEGORIES, formatINR, toPaise } from "../billing.js";
import { buildFee, sortedFees, SUGGESTED_NAMES } from "../fees.js";

const field = "px-3 py-2 border border-rule rounded-lg text-xs bg-white";

/** The clinic's procedure price list. Used to fill amounts on invoices and treatment plans. */
export default function FeeList({ fees, onChange, newId }) {
  const list = sortedFees(fees);
  const [form, setForm] = useState({ name: "", amount: "", taxCategory: "therapeutic" });
  const [error, setError] = useState("");

  const add = (e) => {
    e.preventDefault();
    const r = buildFee(form, list, newId("FEE"));
    if (!r.ok) { setError(r.error); return; }
    setError("");
    onChange([...list, r.fee]);
    setForm({ name: "", amount: "", taxCategory: form.taxCategory });
  };

  return (
    <section className="rounded-xl border border-rule p-4 space-y-3" aria-label="Procedure fees" data-testid="fee-list">
      <div>
        <h2 className="text-sm font-bold text-slate-900">Procedure fees</h2>
        <p className="text-xs text-slate-500">Your own price list. When you type a procedure on an invoice or treatment plan, its fee fills in. You can still change any amount.</p>
      </div>

      {list.length > 0 && (
        <ul className="divide-y divide-rule border border-rule rounded-lg">
          {list.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
              <span className="font-semibold text-slate-900">{f.name}{f.taxCategory !== "therapeutic" ? <span className="ml-2 font-normal text-slate-500">GST applies</span> : null}</span>
              <span className="flex items-center gap-3">
                <span className="tabular text-slate-800">₹{formatINR(toPaise(f.amount))}</span>
                <button type="button" aria-label={`Remove ${f.name}`} onClick={() => onChange(list.filter((x) => x.id !== f.id))} className="text-slate-500 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="grid grid-cols-2 sm:grid-cols-[2fr_1fr_1.4fr_auto] gap-2 items-center">
        <input aria-label="Procedure name" list="fee-suggestions" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Procedure, e.g. Root canal treatment" className={`${field} col-span-2 sm:col-span-1`} />
        <input aria-label="Fee in rupees" type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Fee ₹" className={`${field} font-bold`} />
        <select aria-label="Tax type" value={form.taxCategory} onChange={(e) => setForm({ ...form, taxCategory: e.target.value })} className={field}>
          {TAX_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <button type="submit" className="px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 justify-center"><Plus className="w-3.5 h-3.5" /> Add</button>
      </form>
      <datalist id="fee-suggestions">{SUGGESTED_NAMES.map((n) => <option key={n} value={n} />)}</datalist>
      {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
      {!list.length && <p className="text-xs text-slate-500">No fees yet. Start with the procedures you do most.</p>}
    </section>
  );
}
