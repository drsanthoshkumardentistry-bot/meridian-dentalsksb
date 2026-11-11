import React from "react";
import { Check, Circle } from "lucide-react";

/** A short getting-started list on the dashboard. Hides itself when finished or dismissed. */
export default function SetupChecklist({ progress, dismissed, onGo, onDismiss, canWrite = true }) {
  if (dismissed || progress.complete) return null;
  const pct = Math.round((progress.doneCount / progress.total) * 100);
  return (
    <section className="bg-white rounded-xl border border-rule p-5 shadow-card" data-testid="setup-checklist" aria-label="Getting started">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-bold text-slate-900">Get your clinic set up</h2>
        <span className="text-xs text-slate-500">{progress.doneCount} of {progress.total} done</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-mist overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Setup progress">
        <div className="h-full bg-brand-600" style={{ width: `${pct}%` }} />
      </div>
      <ul className="mt-3 divide-y divide-rule">
        {progress.steps.map((s) => (
          <li key={s.id} className="py-2.5 flex items-start gap-3 text-xs">
            {s.done ? <Check className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" aria-label="Done" /> : <Circle className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" aria-label="Not done" />}
            <div className="flex-1 min-w-0">
              <div className={`font-semibold ${s.done ? "text-slate-500 line-through" : "text-slate-900"}`}>{s.label}</div>
              {!s.done && <div className="text-slate-500">{s.hint}</div>}
            </div>
            {!s.done && canWrite && <button type="button" onClick={() => onGo(s.to)} className="px-3 py-1.5 rounded-lg border border-rule bg-white hover:bg-enamel font-semibold text-slate-800 whitespace-nowrap">Open</button>}
          </li>
        ))}
      </ul>
      {canWrite && <button type="button" onClick={onDismiss} className="mt-2 text-xs text-slate-500 hover:text-slate-800 underline">Hide this list</button>}
    </section>
  );
}
