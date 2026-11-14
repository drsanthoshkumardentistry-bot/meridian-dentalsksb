import React, { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { monthGrid, shiftMonth, MONTH_NAMES } from "../calendar.js";

const DOW = ["M", "T", "W", "T", "F", "S", "S"];

/** Calendar button for the header. Days with visits show a count; tapping a day opens it in the diary. */
export default function ApptCalendar({ appointments = [], onPick, now = new Date() }) {
  const [open, setOpen] = useState(false);
  const [ym, setYm] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);
  const weeks = useMemo(() => monthGrid(appointments, ym.year, ym.month, now), [appointments, ym, now]);
  const toggle = () => { if (!open) setYm({ year: now.getFullYear(), month: now.getMonth() }); setOpen((v) => !v); };
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={toggle} aria-haspopup="dialog" aria-expanded={open} aria-label="Appointment calendar"
        className="p-2 rounded-full text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">
        <CalendarDays className="w-5 h-5" />
      </button>
      {open && (
        <div role="dialog" aria-label="Appointment calendar" className="absolute right-0 mt-2 w-[19rem] max-w-[calc(100vw-1.5rem)] rounded-xl bg-white border border-slate-200 shadow-2xl z-50 p-3" data-testid="appt-calendar">
          <div className="flex items-center justify-between mb-2">
            <button type="button" aria-label="Previous month" onClick={() => setYm(shiftMonth(ym, -1))} className="p-1.5 rounded-lg hover:bg-slate-100"><ChevronLeft className="w-4 h-4" /></button>
            <div className="text-sm font-bold text-slate-900">{MONTH_NAMES[ym.month]} {ym.year}</div>
            <button type="button" aria-label="Next month" onClick={() => setYm(shiftMonth(ym, 1))} className="p-1.5 rounded-lg hover:bg-slate-100"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-slate-500 mb-1">{DOW.map((d, i) => <div key={i}>{d}</div>)}</div>
          <div className="grid grid-cols-7 gap-0.5">
            {weeks.flat().map((c) => (
              <button key={c.date} type="button" onClick={() => { setOpen(false); onPick(c.date); }}
                aria-label={`${c.date}, ${c.count} ${c.count === 1 ? "visit" : "visits"}`}
                className={`relative h-10 rounded-lg text-xs flex flex-col items-center justify-center hover:bg-blue-50 ${c.inMonth ? "text-slate-900" : "text-slate-300"} ${c.today ? "ring-2 ring-blue-600 font-bold" : ""}`}>
                <span>{c.day}</span>
                {c.count > 0 && <span className={`mt-0.5 min-w-[16px] px-1 rounded-full text-[9px] font-bold leading-4 ${c.inMonth ? "bg-blue-600 text-white" : "bg-blue-200 text-blue-800"}`}>{c.count}</span>}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-slate-500">The number is the visits booked that day. Tap a date to open it.</p>
        </div>
      )}
    </div>
  );
}
