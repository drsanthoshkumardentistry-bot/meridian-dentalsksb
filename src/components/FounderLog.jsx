import React, { useEffect, useState } from "react";
import { History } from "lucide-react";
import { loadLog } from "../adminApi.js";

const LABEL = { suspend: "Suspended", resume: "Allowed back", pause_subscription: "Paused subscription", resume_subscription: "Started subscription", plan: "Changed plan", feature: "Feature switch", note: "Saved a note", approve: "Approved request", reject: "Rejected request" };
export const actionLabel = (a) => LABEL[a] || String(a || "Action");
export const when = (at, now = Date.now()) => {
  const m = Math.floor((now - at) / 60000);
  if (!at || m < 0) return "";
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  if (m < 1440) return `${Math.floor(m / 60)} h ago`;
  return new Date(at).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

/** What you changed and when. It never holds patient data. */
export default function FounderLog({ loadFn = loadLog, now = Date.now(), className = "" }) {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState("");
  const load = () => { setErr(""); loadFn().then(setRows).catch((e) => { setRows([]); setErr((e && e.message) || "Could not load."); }); };
  useEffect(() => { let live = true; loadFn().then((r) => { if (live) setRows(r); }).catch((e) => { if (live) { setRows([]); setErr((e && e.message) || "Could not load."); } }); return () => { live = false; }; }, [loadFn]);
  return (
    <section aria-label="Founder activity log" className={className} data-testid="activity-log">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-ink"><History className="h-4 w-4 text-brand-600" aria-hidden="true" /> Activity log</h2>
        <button type="button" onClick={load} className="rounded-lg border border-slate-300 px-2.5 py-1 text-[11px] font-semibold text-slate-700">Refresh</button>
      </div>
      <p className="mt-1 text-[11px] text-slate-500">Every change you make to a clinic, a plan or a switch. No patient data is kept here.</p>
      {err && <p role="alert" className="mt-2 text-xs text-rose-700">{err}</p>}
      {rows && rows.length === 0 && !err && <p className="mt-3 text-xs text-slate-500">Nothing yet. Your next change will show here.</p>}
      <ul className="mt-3 divide-y divide-slate-100">
        {(rows || []).slice(0, 40).map((r) => (
          <li key={r.id} className="py-2 text-xs">
            <div className="flex items-center justify-between gap-2"><span className="font-semibold text-slate-800">{actionLabel(r.action)}</span><span className="text-[11px] text-slate-500">{when(r.at, now)}</span></div>
            <div className="break-all text-slate-600">{r.target}{r.detail ? ` · ${r.detail}` : ""}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}
