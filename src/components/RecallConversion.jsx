import React from "react";
import { monthLabel } from "../reports.js";

/** How many patients messaged for a recall came back. */
export default function RecallConversion({ stats, ym }) {
  return (
    <section className="bg-white border border-rule rounded-xl p-4" aria-label="Recall follow-up" data-testid="recall-conversion">
      <h2 className="text-xs font-bold text-slate-900">Recall follow-up · {monthLabel(ym)}</h2>
      {stats.sent === 0 ? (
        <p className="text-xs text-slate-500 mt-2">No recall messages were sent this month. Send them from the Patients screen and this card will show how many patients came back.</p>
      ) : (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div><div className="text-slate-500">Messages sent</div><div className="text-lg font-bold text-slate-900 tabular">{stats.sent}</div></div>
          <div><div className="text-slate-500">Booked or came</div><div className="text-lg font-bold text-slate-900 tabular">{stats.returned}</div></div>
          <div><div className="text-slate-500">Visit done</div><div className="text-lg font-bold text-slate-900 tabular">{stats.completed}</div></div>
          <div><div className="text-slate-500">Came back</div><div className="text-lg font-bold text-emerald-700 tabular">{stats.ratePct}%</div></div>
        </div>
      )}
      <p className="text-[11px] text-slate-500 mt-2">Counts a patient when a visit is booked or done on or after the day their recall message was sent. Only each patient's latest recall message is kept.</p>
    </section>
  );
}
