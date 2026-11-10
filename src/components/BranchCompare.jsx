import React from "react";
import { Download } from "lucide-react";
import { formatINR } from "../billing.js";
import { monthLabel } from "../reports.js";

const th = "p-3 text-right font-semibold";

/** Every branch side by side for one month. Shown only when the clinic has more than one branch. */
export default function BranchCompare({ cmp, ym, onDownload }) {
  if (cmp.rows.length < 2) return null;
  const { total } = cmp;
  return (
    <section className="bg-white border border-rule rounded-xl overflow-hidden" aria-label="Branch comparison" data-testid="branch-compare">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3">
        <h2 className="text-xs font-bold text-slate-900">Branches side by side · {monthLabel(ym)}</h2>
        <button type="button" onClick={onDownload} className="px-3 py-1.5 bg-white border border-rule hover:bg-enamel rounded-lg text-xs font-semibold text-slate-800 inline-flex items-center gap-1.5">
          <Download className="w-3.5 h-3.5" /> Branches (spreadsheet)
        </button>
      </div>

      <ul className="px-4 pt-3 space-y-2" aria-label="Share of money received">
        {cmp.rows.map((r) => (
          <li key={r.id} className="text-xs">
            <div className="flex justify-between gap-3">
              <span className="font-semibold text-slate-900">{r.name}{r.id === cmp.topBranchId ? " · highest" : ""}</span>
              <span className="text-slate-600 tabular">₹{formatINR(r.collectedP)} · {r.sharePct}%</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-mist overflow-hidden" role="img" aria-label={`${r.name} received ${r.sharePct} percent of the money`}>
              <div className="h-full bg-brand-600" style={{ width: `${r.sharePct}%` }} />
            </div>
          </li>
        ))}
      </ul>

      <div className="overflow-x-auto mt-3">
        <table className="w-full text-left text-xs tabular">
          <thead className="bg-enamel text-slate-600 border-y border-rule">
            <tr>
              <th className="p-3 font-semibold">Branch</th>
              <th className={th}>Received (₹)</th>
              <th className={th}>Invoiced (₹)</th>
              <th className={th}>Outstanding (₹)</th>
              <th className={th}>Visits done</th>
              <th className={th}>No shows</th>
              <th className={th}>New patients</th>
              <th className={th}>Per visit (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cmp.rows.map((r) => (
              <tr key={r.id}>
                <td className="p-3 font-semibold text-slate-900">{r.name}</td>
                <td className="p-3 text-right">{formatINR(r.collectedP)}</td>
                <td className="p-3 text-right">{formatINR(r.billedP)}</td>
                <td className="p-3 text-right">{formatINR(r.outstandingP)}</td>
                <td className="p-3 text-right">{r.completedVisits}</td>
                <td className="p-3 text-right">{r.noShows}{r.noShows ? ` (${r.noShowRate}%)` : ""}</td>
                <td className="p-3 text-right">{r.newPatients}</td>
                <td className="p-3 text-right">{r.perVisitP ? formatINR(r.perVisitP) : "–"}</td>
              </tr>
            ))}
            <tr className="bg-enamel font-bold">
              <td className="p-3">All branches</td>
              <td className="p-3 text-right">{formatINR(total.collectedP)}</td>
              <td className="p-3 text-right">{formatINR(total.billedP)}</td>
              <td className="p-3 text-right">{formatINR(total.outstandingP)}</td>
              <td className="p-3 text-right">{total.completedVisits}</td>
              <td className="p-3 text-right">{total.noShows}{total.noShows ? ` (${total.noShowRate}%)` : ""}</td>
              <td className="p-3 text-right">{total.newPatients}</td>
              <td className="p-3 text-right">{total.perVisitP ? formatINR(total.perVisitP) : "–"}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="px-4 py-2 text-[10px] text-slate-500">Received counts payments made in the month. Invoiced counts bills raised in the month. Outstanding is everything still unpaid. Cancelled visits are left out of the no-show rate.</p>
    </section>
  );
}
