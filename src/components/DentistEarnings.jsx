import React from "react";
import { Download } from "lucide-react";
import { formatINR } from "../billing.js";
import { monthLabel } from "../reports.js";
import { UNASSIGNED } from "../dentistReport.js";

const th = "p-3 text-right font-semibold";

/** Money and work per dentist for one month. Only the owner can change commission rates. */
export default function DentistEarnings({ report, ym, commissions = {}, canEditRates, onRate, onDownload }) {
  if (!report.rows.length) return null;
  const unassigned = report.rows.find((r) => r.name === UNASSIGNED && r.collectedP > 0);
  return (
    <section className="bg-white border border-rule rounded-xl overflow-hidden" aria-label="Dentist earnings" data-testid="dentist-earnings">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3">
        <h2 className="text-xs font-bold text-slate-900">By dentist · {monthLabel(ym)}</h2>
        <button type="button" onClick={onDownload} className="px-3 py-1.5 bg-white border border-rule hover:bg-enamel rounded-lg text-xs font-semibold text-slate-800 inline-flex items-center gap-1.5">
          <Download className="w-3.5 h-3.5" /> Dentists (spreadsheet)
        </button>
      </div>
      {unassigned && <p className="px-4 pt-2 text-xs text-amber-800">Some invoices have no dentist. Choose "Treated by" when you create an invoice so the money is credited correctly.</p>}
      <div className="overflow-x-auto mt-3">
        <table className="w-full text-left text-xs tabular">
          <thead className="bg-enamel text-slate-600 border-y border-rule">
            <tr>
              <th className="p-3 font-semibold">Dentist</th>
              <th className={th}>Received (₹)</th>
              <th className={th}>Billed (₹)</th>
              <th className={th}>Visits done</th>
              <th className={th}>Commission %</th>
              <th className={th}>Commission (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {report.rows.map((r) => (
              <tr key={r.name}>
                <td className="p-3 font-semibold text-slate-900">{r.name}</td>
                <td className="p-3 text-right">{formatINR(r.collectedP)}</td>
                <td className="p-3 text-right">{formatINR(r.billedP)}</td>
                <td className="p-3 text-right">{r.completedVisits}</td>
                <td className="p-3 text-right">
                  {canEditRates && r.name !== UNASSIGNED ? (
                    <input type="number" min="0" max="100" step="0.5" aria-label={`Commission percent for ${r.name}`} value={commissions[r.name] ?? ""} onChange={(e) => onRate(r.name, e.target.value)} className="w-16 px-2 py-1 border border-rule rounded text-right" />
                  ) : r.commissionPct || "-"}
                </td>
                <td className="p-3 text-right">{r.commissionP ? formatINR(r.commissionP) : "-"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-enamel font-bold text-slate-900 border-t border-rule">
            <tr>
              <td className="p-3">Total</td>
              <td className="p-3 text-right">{formatINR(report.total.collectedP)}</td>
              <td className="p-3 text-right">{formatINR(report.total.billedP)}</td>
              <td className="p-3 text-right">{report.total.completedVisits}</td>
              <td className="p-3" />
              <td className="p-3 text-right">{report.total.commissionP ? formatINR(report.total.commissionP) : "-"}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="px-4 py-3 text-xs text-slate-500">Money received is credited to the dentist on the invoice, in the month it was paid. Commission is a simple share of money received. Check it against your agreement with each dentist.</p>
    </section>
  );
}
