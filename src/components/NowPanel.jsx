import React from "react";
import { CalendarPlus, ChevronRight } from "lucide-react";
import { formatTime12 } from "../reminders.js";

/** Dashboard card: the next patient, things needing attention, and a quick New appointment button. */
export function NowStrip({ next = null, alerts = [], onGo, onNewAppointment, canBook = true }) {
  return (
    <section aria-label="Now" data-testid="now-strip" className="rounded-2xl bg-gradient-to-br from-[#1e3a8a] to-[#0f1f4d] text-slate-200 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-bold tracking-wider text-slate-400">NEXT PATIENT</div>
          {next ? (
            <button type="button" onClick={() => onGo("Appointments Diary")} className="text-left mt-1">
              <div className="text-lg font-bold text-sky-100 leading-tight truncate">{next.patientName || "Patient"}</div>
              <div className="text-xs text-sky-300 font-semibold">{formatTime12(next.time)}{next.procedure ? ` · ${next.procedure}` : ""}</div>
            </button>
          ) : <p className="mt-1 text-xs text-slate-400">No visits coming up today.</p>}
        </div>
        {canBook && (
          <button type="button" onClick={onNewAppointment} className="shrink-0 inline-flex items-center gap-1.5 rounded-xl nav-item-active text-white px-3 py-2 text-xs font-semibold">
            <CalendarPlus className="w-4 h-4" /> New
          </button>
        )}
      </div>
      {alerts.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {alerts.map((a) => (
            <li key={a.text}>
              <button type="button" onClick={() => onGo(a.to)} className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs">
                <span className={`w-2 h-2 rounded-full ${a.tone === "red" ? "bg-rose-500" : "bg-amber-400"}`} aria-hidden="true" />{a.text}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
