import React, { useState } from "react";
import { Copy, MessageCircle } from "lucide-react";
import { formatINR } from "../billing.js";
import { MODE_KEYS } from "../reports.js";
import { cashCheck, buildDaySummaryMessage } from "../dayClose.js";

/** Today's money and visits in one place, with a cash check and a summary to send to the owner. */
export default function DayClose({ summary, clinicName, onCopy }) {
  const [counted, setCounted] = useState("");
  const cash = cashCheck(summary, counted);
  const message = buildDaySummaryMessage({ clinicName, summary, cash });
  const rows = MODE_KEYS.concat("Other").filter((m) => summary.byMode[m] > 0);
  return (
    <section className="bg-white rounded-xl border border-rule p-5 shadow-card space-y-3" data-testid="day-close" aria-label="Today's close">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-bold text-slate-900">Close of day</h2>
        <span className="text-xs text-slate-500">{summary.payments} {summary.payments === 1 ? "payment" : "payments"} today</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div><div className="text-slate-500">Received</div><div className="text-lg font-bold text-emerald-700 tabular">₹{formatINR(summary.receivedP)}</div></div>
        <div><div className="text-slate-500">Billed</div><div className="text-lg font-bold text-slate-900 tabular">₹{formatINR(summary.billedP)}</div><div className="text-slate-500">{summary.invoices} {summary.invoices === 1 ? "invoice" : "invoices"}</div></div>
        <div><div className="text-slate-500">Visits done</div><div className="text-lg font-bold text-slate-900 tabular">{summary.completed}</div><div className="text-slate-500">{summary.noShows} no-show, {summary.cancelled} cancelled</div></div>
        <div><div className="text-slate-500">Not closed</div><div className={`text-lg font-bold tabular ${summary.stillWaiting ? "text-amber-700" : "text-slate-900"}`}>{summary.stillWaiting}</div><div className="text-slate-500">mark each Completed or Cancelled</div></div>
      </div>
      {rows.length > 0 && (
        <ul className="flex flex-wrap gap-2 text-xs" aria-label="Received by mode">
          {rows.map((m) => <li key={m} className="rounded-full bg-enamel border border-rule px-3 py-1 text-slate-700">{m} <span className="font-semibold tabular">₹{formatINR(summary.byMode[m])}</span></li>)}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <label htmlFor="cash-counted" className="font-semibold text-slate-700">Cash counted (₹)</label>
        <input id="cash-counted" type="number" min="0" step="0.01" value={counted} onChange={(e) => setCounted(e.target.value)} placeholder={`Expected ${formatINR(summary.byMode.Cash)}`} className="w-36 px-3 py-2 border border-rule rounded-lg" />
        {cash && <span role="status" className={`font-semibold ${cash.balanced ? "text-emerald-700" : "text-rose-700"}`}>{cash.balanced ? "Matches the invoices" : cash.diffP > 0 ? `₹${formatINR(cash.diffP)} more than expected` : `₹${formatINR(-cash.diffP)} short`}</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer" className="px-3 py-2 bg-white border border-rule hover:bg-enamel rounded-lg text-xs font-semibold text-slate-800 inline-flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5" /> Send summary on WhatsApp</a>
        <button type="button" onClick={() => onCopy(message)} className="px-3 py-2 bg-white border border-rule hover:bg-enamel rounded-lg text-xs font-semibold text-slate-800 inline-flex items-center gap-1.5"><Copy className="w-3.5 h-3.5" /> Copy summary</button>
      </div>
    </section>
  );
}
