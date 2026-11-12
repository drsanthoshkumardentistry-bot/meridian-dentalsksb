import React from "react";
import { CalendarPlus, ChevronRight } from "lucide-react";
import { formatTime12 } from "../reminders.js";

/**
 * Right-hand "Now" panel (wide screens): the next patient, things needing attention, and a quick new appointment.
 * Graphite with gold highlights and coloured status dots.
 */
export default function NowPanel({ next = null, alerts = [], onGo, onNewAppointment, canBook = true }) {
  return (
    <aside aria-label="Now" data-testid="now-panel" className="hidden xl:flex w-72 shrink-0 flex-col gap-6 bg-gradient-to-b from-[#1f2937] to-[#0b1019] text-slate-200 p-5 overflow-y-auto">
      <section>
        <h2 className="text-[11px] font-bold tracking-wider text-slate-400">NEXT PATIENT</h2>
        {next ? (
          <button type="button" onClick={() => onGo("Appointments Diary")} className="mt-2 w-full text-left rounded-xl bg-gradient-to-br from-amber-500/25 to-amber-700/10 border border-amber-400/30 hover:border-amber-400/60 p-4 transition">
            <div className="text-lg font-bold text-amber-100 leading-tight">{next.patientName || "Patient"}</div>
            <div className="text-xs text-amber-300 mt-1 font-semibold">{formatTime12(next.time)}{next.procedure ? ` · ${next.procedure}` : ""}</div>
            {next.chair && <div className="text-[11px] text-slate-400 mt-0.5">{next.chair}</div>}
          </button>
        ) : (
          <p className="mt-2 text-xs text-slate-400">No visits coming up today.</p>
        )}
      </section>

      <section>
        <h2 className="text-[11px] font-bold tracking-wider text-slate-400">NEEDS ATTENTION</h2>
        {alerts.length === 0 ? (
          <p className="mt-2 text-xs text-slate-400">All clear.</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {alerts.map((a) => (
              <li key={a.text}>
                <button type="button" onClick={() => onGo(a.to)} className="w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs text-left bg-white/5 hover:bg-white/10 transition">
                  <span className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${a.tone === "red" ? "bg-rose-500" : "bg-amber-400"}`} aria-hidden="true" />{a.text}</span><ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {canBook && (
        <button type="button" onClick={onNewAppointment} className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl nav-item-active text-white hover:brightness-110 px-4 py-2.5 text-sm font-semibold transition">
          <CalendarPlus className="w-4 h-4" /> New appointment
        </button>
      )}
    </aside>
  );
}
