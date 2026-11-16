import React from "react";

export const MODES = [
  { id: "full", label: "Full app", hint: "Everything for the clinic" },
  { id: "connect", label: "Connect only", hint: "Just MeriDent Connect" },
  { id: "doclog", label: "DocLog only", hint: "Just MeriDent DocLog" },
];

/** A three-way switch in the side menu: the whole clinic app, only MeriDent Connect, or only MeriDent DocLog. */
export default function ModeSwitch({ mode = "full", onChange }) {
  return (
    <div data-testid="mode-switch">
      <div className="text-xs font-semibold text-slate-700" id="mode-switch-label">Show</div>
      <div role="radiogroup" aria-labelledby="mode-switch-label" className="mt-1.5 grid grid-cols-1 gap-1">
        {MODES.map((m) => {
          const on = m.id === mode;
          return (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => { if (!on && onChange) onChange(m.id); }}
              className={`w-full text-left rounded-lg px-2.5 py-1.5 text-xs border transition ${on ? "bg-brand-600 border-brand-600 text-white font-semibold" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}
            >
              {m.label}
              <span className={`block text-[11px] font-normal ${on ? "text-blue-100" : "text-slate-500"}`}>{m.hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
