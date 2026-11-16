import React from "react";
import { LayoutDashboard, UsersRound, ClipboardList } from "lucide-react";

export const MODES = [
  { id: "full", label: "Full app", short: "Full", hint: "Everything for the clinic", Icon: LayoutDashboard },
  { id: "connect", label: "Connect only", short: "Connect", hint: "Only MeriDent Connect", Icon: UsersRound },
  { id: "doclog", label: "DocLog only", short: "DocLog", hint: "Only MeriDent DocLog", Icon: ClipboardList },
];

/** Side-menu switch: the whole clinic app, only MeriDent Connect, or only MeriDent DocLog. */
export default function ModeSwitch({ mode = "full", onChange }) {
  const current = MODES.find((m) => m.id === mode) || MODES[0];
  return (
    <div data-testid="mode-switch">
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-xs font-bold text-slate-900" id="mode-switch-label">View</div>
        <div className="text-[11px] text-slate-500 truncate" aria-live="polite">{current.hint}</div>
      </div>
      <div role="radiogroup" aria-labelledby="mode-switch-label" className="mt-2 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
        {MODES.map(({ id, label, short, Icon }) => {
          const on = id === mode;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={label}
              title={label}
              onClick={() => { if (!on && onChange) onChange(id); }}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-[11px] leading-tight transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${on ? "bg-white text-brand-700 font-bold shadow-sm ring-1 ring-slate-200" : "text-slate-600 font-medium hover:bg-white/70 hover:text-slate-900"}`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {short}
            </button>
          );
        })}
      </div>
    </div>
  );
}
