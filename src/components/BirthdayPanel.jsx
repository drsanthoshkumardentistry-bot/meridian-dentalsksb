import React from "react";
import { Cake, Send } from "lucide-react";

/** Patients whose birthday is today. The clinic taps once to open WhatsApp with the greeting ready. */
export default function BirthdayPanel({ due, onGreet, canWrite = true }) {
  if (!due.length) return null;
  return (
    <section className="bg-white rounded-xl border border-rule p-5 shadow-card" data-testid="birthday-panel" aria-label="Birthdays today">
      <h2 className="text-base font-bold text-slate-900 flex items-center gap-2"><Cake className="w-4 h-4 text-gold-700" aria-hidden="true" /> Birthdays today</h2>
      <ul className="mt-3 space-y-2">
        {due.map(({ patient, age }) => (
          <li key={patient.id} className="flex flex-wrap items-center justify-between gap-2 bg-enamel rounded-lg border border-slate-100 px-3 py-2 text-xs">
            <span className="font-semibold text-slate-900">{patient.name}{age > 0 ? <span className="font-normal text-slate-500"> turns {age}</span> : null}</span>
            {canWrite && <button type="button" onClick={() => onGreet(patient)} className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap"><Send className="w-3 h-3" /> Send wishes</button>}
          </li>
        ))}
      </ul>
    </section>
  );
}
