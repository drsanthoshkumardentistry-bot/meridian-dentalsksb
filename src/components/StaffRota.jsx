import React from "react";
import { ROTA_DAYS, OFF, ANY, rotaFor, setRota, copyMonToWeekdays, todaysCover } from "../rota.js";

/** Weekly plan: who works which day, and at which chair. */
export default function StaffRota({ employees, chairs, canEdit, onChange, now }) {
  const staff = employees.filter((e) => e.active !== false);
  if (!staff.length) return null;
  const cover = todaysCover(employees, chairs, now);
  const update = (emp) => onChange(employees.map((e) => (e.id === emp.id ? emp : e)));
  return (
    <div className="bg-white rounded-xl border border-rule p-4 text-xs space-y-3 shadow-xs" data-testid="staff-rota">
      <div>
        <div className="font-bold text-slate-800">Weekly rota</div>
        <p className="text-slate-500 mt-0.5">Pick the chair each person works at every day. Leave a day blank for a day off.</p>
      </div>

      <div className="rounded-lg bg-blue-50/60 border border-blue-100 p-3 space-y-1" data-testid="rota-today">
        <div className="font-semibold text-blue-800">Today</div>
        {cover.byChair.map((c) => (
          <div key={c.chair}><span className="text-slate-600">{c.chair.split(" (")[0]}:</span> {c.staff.length ? c.staff.join(", ") : <span className="text-slate-400">nobody assigned</span>}</div>
        ))}
        {cover.anyChair.length > 0 && <div><span className="text-slate-600">Any chair:</span> {cover.anyChair.join(", ")}</div>}
        {cover.awayNames.length > 0 && <div className="text-amber-700">On leave but planned today: {cover.awayNames.join(", ")}</div>}
        {cover.uncovered.length > 0 && <div className="text-rose-700 font-semibold">No one is planned for: {cover.uncovered.join(", ")}</div>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="text-slate-500">
              <th className="py-1.5 pr-2 font-semibold">Staff</th>
              {ROTA_DAYS.map((d) => <th key={d.id} className="py-1.5 px-1 font-semibold">{d.label}</th>)}
              {canEdit && <th />}
            </tr>
          </thead>
          <tbody>
            {staff.map((emp) => (
              <tr key={emp.id} className="border-t border-slate-100">
                <td className="py-1.5 pr-2 font-semibold text-slate-800 whitespace-nowrap">{emp.name}</td>
                {ROTA_DAYS.map((d) => (
                  <td key={d.id} className="py-1.5 px-1">
                    <select
                      aria-label={`${emp.name} on ${d.label}`}
                      disabled={!canEdit}
                      value={rotaFor(emp, d.id)}
                      onChange={(e) => update(setRota(emp, d.id, e.target.value, chairs))}
                      className="w-full px-1.5 py-1 border border-slate-200 rounded-md bg-white disabled:bg-slate-50"
                    >
                      <option value={OFF}>Off</option>
                      <option value={ANY}>{ANY}</option>
                      {[...new Set([...chairs, rotaFor(emp, d.id)].filter((c) => c && c !== ANY))].map((c) => <option key={c} value={c}>{c.split(" (")[0]}</option>)}
                    </select>
                  </td>
                ))}
                {canEdit && (
                  <td className="py-1.5 pl-1">
                    <button type="button" onClick={() => update(copyMonToWeekdays(emp))} className="text-[11px] text-blue-700 hover:underline whitespace-nowrap">Copy Mon to Tue-Fri</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
