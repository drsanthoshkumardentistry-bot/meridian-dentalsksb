import React from "react";

/** Online booking requests waiting for the clinic. */
export default function BookingRequests({ requests, onConfirm, onDecline, onContact }) {
  const open = requests.filter((r) => r.status === "new").sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  if (!open.length) return null;
  return (
    <section className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2" data-testid="booking-requests" aria-label="Online booking requests">
      <h2 className="text-sm font-bold text-blue-900">Online booking requests ({open.length})</h2>
      {open.map((r) => (
        <div key={r.id} className="bg-white rounded-xl border border-blue-100 p-3 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[180px]">
            <div className="text-sm font-semibold text-slate-900">{r.name} <span className="text-slate-500 font-normal">· {r.phone}</span></div>
            <div className="text-[11px] text-slate-500">{r.service} · {r.date}, {r.slot.toLowerCase()}{r.note ? ` · “${r.note}”` : ""}</div>
          </div>
          <button type="button" onClick={() => onContact(r)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50">WhatsApp</button>
          <button type="button" onClick={() => onConfirm(r)} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold">Confirm</button>
          <button type="button" onClick={() => onDecline(r)} className="px-2 py-1.5 text-slate-500 hover:text-rose-600 text-[11px] font-semibold">Decline</button>
        </div>
      ))}
    </section>
  );
}
