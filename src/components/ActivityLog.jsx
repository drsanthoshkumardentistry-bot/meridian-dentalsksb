import React, { useState } from "react";
import { auditView, auditText, auditActors } from "../audit.js";
import { ROLE_LABEL } from "../roles.js";

const input = "px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-600";
const when = (iso) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/** Who changed what, newest first. */
export default function ActivityLog({ entries }) {
  const [query, setQuery] = useState("");
  const [actor, setActor] = useState("all");
  const [more, setMore] = useState(1);
  const rows = auditView(entries, { query, actor }, 50 * more);
  const total = auditView(entries, { query, actor }, Infinity).length;

  return (
    <section className="rounded-xl border border-slate-200 p-4 text-xs space-y-3" data-testid="activity-log" aria-label="Activity log">
      <div>
        <h2 className="text-sm font-bold text-slate-900">Activity log</h2>
        <p className="text-slate-500">The latest 300 changes made by you and your team. Clinical notes are never copied here.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <input aria-label="Search activity" placeholder="Search patient, invoice or action" className={`${input} flex-1 min-w-[180px]`} value={query} onChange={(e) => setQuery(e.target.value)} />
        <select aria-label="Filter by person" className={input} value={actor} onChange={(e) => setActor(e.target.value)}>
          <option value="all">Everyone</option>
          {auditActors(entries).map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      {rows.length === 0 ? <p className="text-slate-500">{entries.length ? "Nothing matches your search." : "No activity recorded yet. New changes will appear here."}</p> : (
        <ul className="divide-y divide-slate-100">
          {rows.map((e) => (
            <li key={e.id} className="py-2 flex flex-wrap gap-x-3 gap-y-0.5">
              <span className="text-slate-400 tabular w-28 shrink-0">{when(e.at)}</span>
              <span className="flex-1 min-w-[200px] text-slate-800">{auditText(e)}</span>
              <span className="text-slate-500">{e.actorEmail} · {ROLE_LABEL[e.actorRole] || e.actorRole}</span>
            </li>
          ))}
        </ul>
      )}
      {total > rows.length && <button type="button" onClick={() => setMore(more + 1)} className="text-[#1d4ed8] font-semibold">Show more</button>}
    </section>
  );
}
