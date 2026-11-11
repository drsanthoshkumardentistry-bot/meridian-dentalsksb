import React from "react";
import { formatINR } from "../billing.js";
import { historySummary } from "../physician.js";

const dmy = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(iso || "");
};
const short = (t, n = 110) => (String(t || "").length > n ? `${String(t).slice(0, n)}...` : String(t || ""));

/** Latest history: alerts, conditions, newest visit, last physician consult, last bill. (The tiles above it show balance, next visit and open plans.) */
export default function PatientSummary({ patient, appointments, invoices, now }) {
  const s = historySummary(patient, { appointments, invoices, now: now || new Date() });
  const tone = { ok: "text-emerald-700", warn: "text-amber-700 font-semibold", muted: "text-slate-500" }[s.physicianStatus.tone];
  const row = (label, value) => (
    <div className="flex gap-2 text-xs"><dt className="w-32 shrink-0 font-semibold text-slate-600">{label}</dt><dd className="text-slate-800 min-w-0 break-words">{value}</dd></div>
  );
  return (
    <details open className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 mb-4" data-testid="patient-history">
      <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-slate-800">Latest history</summary>
      <dl className="mt-3 space-y-1.5">
        {s.alert ? row("Medical alert", <span className="text-rose-700 font-semibold">{s.alert}</span>) : null}
        {row("Conditions", s.conditions || <span className="text-slate-500">Not recorded</span>)}
        {row("Allergies", s.allergies || <span className="text-slate-500">Not asked yet</span>)}
        {row("Last visit", s.lastVisit
          ? <span>{dmy(s.lastVisit.date)}. {short([s.lastVisit.complaint, s.lastVisit.treatment].filter(Boolean).join(". "))}</span>
          : <span className="text-slate-500">No visit notes yet</span>)}
        {row("Last physician consult", <span><span className={tone}>{s.physicianStatus.label}</span>
          {s.physician && s.physician.name ? <span> with Dr {String(s.physician.name).replace(/^dr\.?\s*/i, "")}</span> : null}
          {s.physician && s.physician.reason ? <span>. Reason: {short(s.physician.reason, 80)}</span> : null}
          {s.physician && s.physician.clearance ? <span>. {s.physician.clearance}</span> : null}</span>)}
        {row("Last bill", s.lastInvoice
          ? <span>{dmy(s.lastInvoice.date)}, ₹{formatINR(s.lastInvoice.totalP)}{s.dueP > 0 ? <span className="text-rose-700 font-semibold"> (₹{formatINR(s.dueP)} due in total)</span> : null}</span>
          : <span className="text-slate-500">No bills yet</span>)}
      </dl>
    </details>
  );
}
