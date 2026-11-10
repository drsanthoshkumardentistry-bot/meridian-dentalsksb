import React, { useState } from "react";
import { Q_STATUS, queueView, queueSummary, waitMinutes } from "../queue.js";

const input = "px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-600";

/** Walk-in queue with tokens and urgent triage. */
export default function QueuePanel({ queue, today, onAdd, onStatus, onRemove, now = new Date() }) {
  const [form, setForm] = useState({ name: "", phone: "", reason: "", priority: "Normal" });
  const [error, setError] = useState("");
  const rows = queueView(queue, today);
  const sum = queueSummary(queue, today, now);

  const submit = (e) => {
    e.preventDefault();
    const r = onAdd(form);
    if (r && r.ok === false) { setError(r.error); return; }
    setError("");
    setForm({ name: "", phone: "", reason: "", priority: "Normal" });
  };

  return (
    <section className="bg-white rounded-xl border border-rule p-4 space-y-3" data-testid="walkin-queue" aria-label="Walk-in queue">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-slate-900">Walk-in queue</h2>
        <p className="text-xs text-slate-500">
          {sum.waiting} waiting{sum.urgent ? ` (${sum.urgent} urgent)` : ""} · {sum.inChair} in chair · {sum.done} done{sum.avgWaitMin ? ` · average wait ${sum.avgWaitMin} min` : ""}
        </p>
      </div>
      <form onSubmit={submit} className="flex flex-wrap gap-2 items-start" noValidate>
        <input aria-label="Walk-in patient name" placeholder="Patient name" className={`${input} flex-1 min-w-[140px]`} value={form.name} maxLength={80} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input aria-label="Walk-in mobile number" placeholder="Mobile (optional)" inputMode="tel" className={`${input} w-36`} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input aria-label="Reason for walk-in visit" placeholder="Reason, e.g. tooth pain" className={`${input} flex-1 min-w-[140px]`} value={form.reason} maxLength={120} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        <select aria-label="Triage priority" className={input} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
          <option>Normal</option><option>Urgent</option>
        </select>
        <button type="submit" className="px-4 py-2 rounded-lg bg-[#1d4ed8] hover:bg-blue-800 text-white text-xs font-semibold">Add to queue</button>
      </form>
      {error && <p role="alert" className="text-xs text-rose-600 font-medium">{error}</p>}
      {rows.length === 0 ? (
        <p className="text-xs text-slate-500">No walk-ins today. Add a patient above to give them a token.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map((e) => {
            const closed = e.status === Q_STATUS.DONE || e.status === Q_STATUS.LEFT;
            return (
              <li key={e.id} className={`py-2 flex flex-wrap items-center gap-3 ${closed ? "opacity-60" : ""}`}>
                <span className="w-10 h-10 rounded-lg bg-aqua-50 text-aqua-700 font-bold flex items-center justify-center tabular" aria-label={`Token ${e.token}`}>{e.token}</span>
                <div className="flex-1 min-w-[140px]">
                  <div className="text-sm font-semibold text-slate-900">
                    {e.name}
                    {e.priority === "Urgent" && <span className="ml-2 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-full px-2 py-0.5">Urgent</span>}
                  </div>
                  <div className="text-[11px] text-slate-500">{e.reason || "No reason noted"} · {e.status}{!closed ? ` · waiting ${waitMinutes(e, now)} min` : ""}</div>
                </div>
                {e.status === Q_STATUS.WAITING && <button type="button" onClick={() => onStatus(e, Q_STATUS.IN_CHAIR)} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold">Call in</button>}
                {e.status === Q_STATUS.IN_CHAIR && <button type="button" onClick={() => onStatus(e, Q_STATUS.DONE)} className="px-3 py-1.5 rounded-lg bg-ink bg-[#0b1b3a] text-white text-[11px] font-semibold">Mark done</button>}
                {e.status === Q_STATUS.WAITING && <button type="button" onClick={() => onStatus(e, Q_STATUS.LEFT)} className="px-2 py-1.5 text-slate-500 hover:text-slate-700 text-[11px] font-semibold">Left</button>}
                {closed && <button type="button" onClick={() => onRemove(e)} className="px-2 py-1.5 text-slate-400 hover:text-rose-600 text-[11px] font-semibold">Remove</button>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
