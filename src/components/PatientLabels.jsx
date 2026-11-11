import React from "react";
import { LABELS, LABEL_TONES, MAX_LABELS, hasLabel, labelsOf } from "../labels.js";

/** Small coloured chips, used in the patient list and the chart. */
export function LabelChips({ patient, className = "" }) {
  const list = labelsOf(patient);
  if (!list.length) return null;
  return (
    <span className={`inline-flex flex-wrap gap-1 ${className}`} data-testid="label-chips">
      {list.map((l) => (
        <span key={l.id} className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${LABEL_TONES[l.tone]}`}>{l.name}</span>
      ))}
    </span>
  );
}

/** Tap a label to add or remove it. Up to five per patient. */
export default function PatientLabels({ patient, onToggle }) {
  const count = labelsOf(patient).length;
  return (
    <div className="mb-4 rounded-xl border border-rule bg-white p-3" data-testid="label-editor">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Labels</span>
        <span className="text-[11px] text-slate-500">{count} of {MAX_LABELS}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {LABELS.map((l) => {
          const on = hasLabel(patient, l.id);
          return (
            <button
              key={l.id}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(l.id)}
              className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-colors ${on ? LABEL_TONES[l.tone] : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}
            >
              {on ? "✓ " : "+ "}{l.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
