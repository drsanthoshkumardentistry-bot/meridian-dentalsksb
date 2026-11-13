import React from "react";
import { Bell, Send, RefreshCw, ClipboardCheck, CreditCard, MessageSquare, CalendarCheck, ArrowRight } from "lucide-react";
import { MiniBars } from "./Sparkline.jsx";

// One soft colour family per card: pale gradient, a coloured circle for the icon, matching bars.
export const STAT_TONES = {
  blue: { card: "from-blue-50 to-blue-100/70 border-blue-100", bubble: "bg-blue-500 text-white shadow-blue-300/60", bar: "#2563eb" },
  mint: { card: "from-emerald-50 to-teal-100/70 border-emerald-100", bubble: "bg-emerald-500 text-white shadow-emerald-300/60", bar: "#10b981" },
  violet: { card: "from-violet-50 to-indigo-100/70 border-violet-100", bubble: "bg-violet-500 text-white shadow-violet-300/60", bar: "#7c3aed" },
  peach: { card: "from-orange-50 to-amber-100/70 border-orange-100", bubble: "bg-orange-400 text-white shadow-orange-300/60", bar: "#f97316" },
  rose: { card: "from-rose-50 to-pink-100/70 border-rose-100", bubble: "bg-rose-500 text-white shadow-rose-300/60", bar: "#e11d48" },
};

export function StatCard({ title, value, note, icon, tone = "blue", bars }) {
  const t = STAT_TONES[tone] || STAT_TONES.blue;
  return (
    <div className={`stat-card rounded-2xl border bg-gradient-to-br ${t.card} p-4 sm:p-5 lg:p-4 flex flex-col justify-between gap-3 lg:gap-2 min-h-[9rem] lg:min-h-[8rem] shadow-card`}>
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 lg:w-10 lg:h-10 shrink-0 rounded-full flex items-center justify-center shadow-lg ${t.bubble}`}>{icon}</div>
        <div className="text-[13px] font-semibold text-slate-600 leading-tight">{title}</div>
      </div>
      <div>
        <div className="text-xl sm:text-2xl font-bold text-slate-900 break-words tabular">{value}</div>
        <div className="text-[11px] sm:text-xs text-slate-600/80 mt-1 leading-snug">{note}</div>
      </div>
      {bars ? <MiniBars data={bars} color={t.bar} /> : <div className="h-9" aria-hidden="true" />}
    </div>
  );
}

const TILE_ICON = {
  bookings: [CalendarCheck, "blue"], reminders: [Bell, "blue"], nextVisits: [Send, "mint"], recalls: [RefreshCw, "blue"],
  plans: [ClipboardCheck, "mint"], payments: [CreditCard, "peach"], feedback: [MessageSquare, "violet"],
};
const TILE_TONE = { blue: "bg-blue-100 text-blue-600", mint: "bg-emerald-100 text-emerald-600", peach: "bg-orange-100 text-orange-600", violet: "bg-violet-100 text-violet-600", rose: "bg-rose-100 text-rose-600" };

/** One of "Today's actions": a coloured icon bubble, the count, what it is, and an arrow. */
export function ActionTile({ tile, onOpen }) {
  const [Icon, tone] = TILE_ICON[tile.id] || [Bell, "blue"];
  const active = tile.count > 0;
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group text-left rounded-2xl border p-3 sm:p-4 flex items-center gap-3 transition-all hover:-translate-y-0.5 ${active ? "bg-white border-blue-100 shadow-card hover:shadow-lift" : "bg-slate-50/70 border-rule hover:bg-white"}`}
    >
      <span className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center ${active ? TILE_TONE[tone] : "bg-slate-100 text-slate-400"}`}><Icon className="w-5 h-5" /></span>
      <span className="min-w-0 flex-1">
        <span className={`block text-xl font-bold leading-none ${active ? "text-slate-900" : "text-slate-400"}`}>{tile.count}</span>
        <span className="block text-xs font-semibold text-slate-700 mt-1 leading-snug">{tile.label}</span>
        <span className="block text-[11px] text-slate-500 mt-0.5">{active ? tile.cta : "Nothing to do"}</span>
      </span>
      <span className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center transition-colors ${active ? "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white" : "bg-slate-100 text-slate-300"}`}><ArrowRight className="w-3.5 h-3.5" /></span>
    </button>
  );
}
