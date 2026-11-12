import React, { useState } from "react";
import DmyDateInput from "./DmyDateInput.jsx";
import { WORK_TYPES, LAB_STATUS, validateLabOrder, createLabOrder, moveLabOrder, canMove, isOverdue } from "../lab.js";
import { dateKey, addDays, formatDateLong } from "../reminders.js";

const field = "w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-aqua-400";
const TONE = { sent: "bg-brand-50 text-brand-700", received: "bg-aqua-50 text-aqua-700", fitted: "bg-emerald-50 text-emerald-700", cancelled: "bg-slate-100 text-slate-600" };

const blank = (now = new Date()) => ({ lab: "", labPhone: "", workType: "Crown", teeth: "", shade: "", sentOn: dateKey(now), dueOn: dateKey(addDays(now, 7)), note: "" });

/** A patient's lab work: send a new order and follow each one through to fitting. */
export default function LabOrders({ patient, labs = [], newId, onChange, canWrite = true }) {
  const orders = patient.labOrders || [];
  const [form, setForm] = useState(blank());
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const pickLab = (e) => {
    const lab = e.target.value;
    const known = labs.find((l) => l.lab.toLowerCase() === lab.trim().toLowerCase());
    setForm({ ...form, lab, labPhone: known && !form.labPhone ? known.labPhone : form.labPhone });
  };
  const submit = (e) => {
    e.preventDefault();
    const err = validateLabOrder(form);
    if (err) { setError(err); return; }
    setError("");
    onChange([createLabOrder(form, newId()), ...orders]);
    setForm(blank());
  };
  const move = (o, to) => onChange(orders.map((x) => (x.id === o.id ? moveLabOrder(x, to) : x)));

  return (
    <div className="space-y-4" data-testid="lab-orders">
      {canWrite && (
        <form onSubmit={submit} noValidate aria-label="New lab order" className="bg-white border border-rule rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Send work to a lab</h3>
          <datalist id="lab-names">{labs.map((l) => <option key={l.lab} value={l.lab} />)}</datalist>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label htmlFor="lab-name" className="block text-xs font-semibold text-slate-600 mb-1">Lab</label>
              <input id="lab-name" list="lab-names" className={field} maxLength={60} value={form.lab} onChange={pickLab} placeholder="e.g. Sri Dental Lab" /></div>
            <div><label htmlFor="lab-phone" className="block text-xs font-semibold text-slate-600 mb-1">Lab's WhatsApp (optional)</label>
              <input id="lab-phone" inputMode="tel" className={field} value={form.labPhone} onChange={set("labPhone")} placeholder="10-digit mobile" /></div>
            <div><label htmlFor="lab-type" className="block text-xs font-semibold text-slate-600 mb-1">Type of work</label>
              <select id="lab-type" className={field} value={form.workType} onChange={set("workType")}>{WORK_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label htmlFor="lab-teeth" className="block text-xs font-semibold text-slate-600 mb-1">Teeth</label>
                <input id="lab-teeth" className={field} value={form.teeth} onChange={set("teeth")} placeholder="e.g. 36, 37" /></div>
              <div><label htmlFor="lab-shade" className="block text-xs font-semibold text-slate-600 mb-1">Shade</label>
                <input id="lab-shade" className={field} maxLength={20} value={form.shade} onChange={set("shade")} placeholder="e.g. A2" /></div>
            </div>
            <div><label htmlFor="lab-sent" className="block text-xs font-semibold text-slate-600 mb-1">Sent on</label>
              <DmyDateInput id="lab-sent" ariaLabel="Sent to lab (dd/mm/yyyy)" className={field} value={form.sentOn} onChange={(v) => setForm({ ...form, sentOn: v })} /></div>
            <div><label htmlFor="lab-due" className="block text-xs font-semibold text-slate-600 mb-1">Expected back</label>
              <DmyDateInput id="lab-due" ariaLabel="Due back (dd/mm/yyyy)" className={field} value={form.dueOn} onChange={(v) => setForm({ ...form, dueOn: v })} /></div>
          </div>
          <div><label htmlFor="lab-note" className="block text-xs font-semibold text-slate-600 mb-1">Instructions (optional)</label>
            <textarea id="lab-note" rows={2} maxLength={300} className={field} value={form.note} onChange={set("note")} placeholder="Margin, occlusion, material" /></div>
          {error && <p role="alert" className="text-xs text-rose-700 font-medium">{error}</p>}
          <button type="submit" className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold">Save lab order</button>
        </form>
      )}

      {orders.length === 0 ? (
        <p className="text-sm text-slate-500">No lab work for this patient yet.</p>
      ) : (
        <ul className="space-y-2" aria-label="Lab orders">
          {orders.map((o) => (
            <li key={o.id} className="bg-white border border-rule rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <div className="font-semibold text-slate-900">{o.workType}{o.teeth ? ` · ${o.teeth}` : ""}{o.shade ? ` · shade ${o.shade}` : ""}</div>
                <div className="text-xs text-slate-600">{o.lab} · sent {formatDateLong(o.sentOn)} · expected {formatDateLong(o.dueOn)}</div>
                {o.note && <div className="text-xs text-slate-500 mt-0.5">{o.note}</div>}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${isOverdue(o) ? "bg-rose-50 text-rose-700" : TONE[o.status]}`}>{isOverdue(o) ? "Overdue" : LAB_STATUS[o.status]}</span>
                {canWrite && canMove(o, "received") && <button type="button" onClick={() => move(o, "received")} className="px-3 py-1.5 rounded border border-rule text-xs font-semibold hover:bg-enamel">Mark received</button>}
                {canWrite && canMove(o, "fitted") && <button type="button" onClick={() => move(o, "fitted")} className="px-3 py-1.5 rounded border border-rule text-xs font-semibold hover:bg-enamel">Mark fitted</button>}
                {canWrite && canMove(o, "cancelled") && <button type="button" onClick={() => move(o, "cancelled")} className="px-2 py-1.5 text-xs font-semibold text-slate-500 hover:text-rose-700">Cancel</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
