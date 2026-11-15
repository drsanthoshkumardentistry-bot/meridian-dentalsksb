import React, { useEffect, useState } from "react";
import { loadAdminStats } from "../adminStats.js";

const Stat = ({ label, value }) => (
  <div className="rounded-lg border border-slate-200 p-3"><div className="text-xl font-bold text-slate-900">{value}</div><div className="text-xs text-slate-500">{label}</div></div>
);
const day = (ms) => (ms ? new Date(ms).toLocaleDateString("en-GB") : "never");

/** Settings: private numbers for the founder. Renders nothing for everyone else. */
export default function FounderCard({ loadFn = loadAdminStats }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    loadFn().then((s) => { if (live) setStats(s); }).catch((e) => { if (live) setError((e && e.message) || "Could not load."); });
    return () => { live = false; };
  }, [loadFn]);
  if (!stats && !error) return null;
  if (error) return <section className="rounded-xl border border-slate-200 p-4 text-xs text-slate-600" data-testid="founder-card">Founder view: {error}</section>;
  const peak = Math.max(1, ...stats.weeks.map((w) => w.signUps));
  return (
    <section className="rounded-xl border border-slate-200 p-4 space-y-3" data-testid="founder-card">
      <div>
        <h2 className="text-base font-bold text-slate-900">Founder view</h2>
        <p className="text-xs text-slate-500">Only you can see this. Counts come from sign-ups and sign-in dates. No patient data is read.</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <Stat label="Clinics signed up" value={stats.total} />
        <Stat label="New in 7 days" value={stats.newLast7} />
        <Stat label="New in 30 days" value={stats.newLast30} />
        <Stat label="Signed in, last 7 days" value={stats.activeLast7} />
        <Stat label="Signed in, last 30 days" value={stats.activeLast30} />
        <Stat label="Gone quiet (30+ days)" value={stats.quiet30} />
      </div>
      <div>
        <div className="text-xs font-semibold text-slate-600 mb-1">New sign-ups per week (last 8 weeks)</div>
        <div className="flex items-end gap-1 h-16" role="img" aria-label="Weekly sign-ups">
          {stats.weeks.map((w, i) => <div key={i} title={`${w.signUps}`} className="flex-1 bg-blue-600/80 rounded-t" style={{ height: `${Math.max(4, (w.signUps / peak) * 100)}%` }} />)}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs"><thead><tr className="text-left text-slate-500"><th className="py-1">Latest sign-ups</th><th>Joined</th><th>Last sign-in</th></tr></thead>
          <tbody>{stats.recent.map((r, i) => <tr key={i} className="border-t border-slate-100"><td className="py-1 break-all">{r.email}</td><td>{day(r.created)}</td><td>{day(r.lastLogin)}</td></tr>)}</tbody></table>
      </div>
    </section>
  );
}
