import React, { useState } from "react";
import { formatINR, paidPaise } from "../billing.js";
import { buildSchedule, instalmentView, MAX_INSTALMENTS } from "../instalments.js";
import { formatDateLong, dateKey } from "../reminders.js";
import DmyDateInput from "./DmyDateInput.jsx";

const field = "w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-500 text-xs";
const BADGE = { paid: "bg-emerald-50 text-emerald-800", part: "bg-amber-50 text-amber-900", due: "bg-slate-100 text-slate-700", overdue: "bg-rose-50 text-rose-800" };
const LABEL = { paid: "Paid", part: "Part paid", due: "Due", overdue: "Overdue" };

/** Split a bill into monthly instalments, or show the plan it already has. */
export default function InstalmentPlan({ inv, canEdit, onCreate, onRemove, showToast, today = dateKey() }) {
  const view = instalmentView(inv, today);
  const [f, setF] = useState({ count: "6", firstDueOn: today, every: "1" });
  const paidSoFar = paidPaise(inv);
  const create = (e) => {
    e.preventDefault();
    const r = buildSchedule({ totalP: inv.totalP, count: f.count, firstDueOn: f.firstDueOn, downP: paidSoFar, everyMonths: Number(f.every) || 1 });
    if (!r.ok) return showToast(r.error);
    onCreate(r.schedule, paidSoFar);
  };
  if (view) {
    return (
      <div className="space-y-2 text-xs" data-testid="instalment-plan">
        <ul className="divide-y divide-slate-100 rounded-xl border border-rule bg-white">
          {view.rows.map((r) => (
            <li key={r.no} className="flex items-center justify-between gap-2 px-3 py-2">
              <span>#{r.no} · {formatDateLong(r.dueOn)}</span>
              <span className="font-semibold">₹{formatINR(r.amountP)}</span>
              <span className={`px-2 py-0.5 rounded-full font-semibold ${BADGE[r.status]}`}>{LABEL[r.status]}</span>
            </li>
          ))}
        </ul>
        <p className="text-slate-500">Take each instalment with Collect as usual. The bill's due date moves to the next unpaid instalment, so overdue and reminders follow the plan.</p>
        {canEdit && <button type="button" onClick={onRemove} className="text-rose-700 font-semibold underline">Remove plan</button>}
      </div>
    );
  }
  if (!canEdit) return <p className="text-xs text-slate-500">No instalment plan on this bill.</p>;
  return (
    <form onSubmit={create} className="grid grid-cols-2 gap-3 text-xs" aria-label="Instalment plan">
      <div><label htmlFor="ip-n" className="block text-[11px] font-semibold text-slate-600 mb-1">Number of instalments</label><input id="ip-n" inputMode="numeric" className={field} value={f.count} onChange={(e) => setF({ ...f, count: e.target.value })} /></div>
      <div><label htmlFor="ip-ev" className="block text-[11px] font-semibold text-slate-600 mb-1">Every (months)</label><input id="ip-ev" inputMode="numeric" className={field} value={f.every} onChange={(e) => setF({ ...f, every: e.target.value })} /></div>
      <div><label htmlFor="ip-first" className="block text-[11px] font-semibold text-slate-600 mb-1">First due on</label><DmyDateInput id="ip-first" ariaLabel="First due on (dd/mm/yyyy)" value={f.firstDueOn} onChange={(v) => setF({ ...f, firstDueOn: v })} className={field} /></div>
      <div className="col-span-2 flex items-center gap-3"><button className="px-4 py-2 rounded-lg bg-[#1d4ed8] text-white font-semibold">Create plan</button><span className="text-slate-500">Splits the balance of ₹{formatINR(Math.max(0, inv.totalP - paidSoFar))} into 2 to {MAX_INSTALMENTS} equal instalments. Collect any down payment first.</span></div>
    </form>
  );
}
