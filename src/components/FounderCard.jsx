import React, { useEffect, useState } from "react";
import { loadAdminStats } from "../adminStats.js";
import { markPaid } from "../planApi.js";

const Stat = ({ label, value }) => (
  <div className="rounded-lg border border-slate-200 p-3"><div className="text-xl font-bold text-slate-900">{value}</div><div className="text-xs text-slate-500">{label}</div></div>
);
const day = (ms) => (ms ? new Date(ms).toLocaleDateString("en-GB") : "never");

/** Settings: private numbers for the founder. Renders nothing for everyone else. */
export default function FounderCard({ loadFn = loadAdminStats, payFn = markPaid }) {
  const [pay, setPay] = useState({ email: "", plan: "standard", days: "30" });
  const [payMsg, setPayMsg] = useState("");
  const savePaid = async (e) => {
    e.preventDefault(); setPayMsg("Saving…");
    try { const r = await payFn({ email: pay.email.trim(), plan: pay.plan, days: Number(pay.days) }); setPayMsg(`Saved. ${r.plan === "pro" ? "Pro" : "Standard"} until ${new Date(r.paidUntil).toLocaleDateString("en-GB")}.`); }
    catch (err) { setPayMsg((err && err.message) || "Could not save."); }
  };
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
      <form onSubmit={savePaid} className="rounded-lg border border-slate-200 p-3 space-y-2" aria-label="Mark a clinic as paid">
        <div className="text-xs font-semibold text-slate-700">Mark a clinic as paid</div>
        <div className="flex flex-wrap gap-2">
          <input type="email" required placeholder="Clinic sign-in email" aria-label="Clinic email" value={pay.email} onChange={(e) => setPay({ ...pay, email: e.target.value })} className="flex-1 min-w-[12rem] px-2 py-1.5 border border-slate-300 rounded-lg text-xs" />
          <select aria-label="Plan" value={pay.plan} onChange={(e) => setPay({ ...pay, plan: e.target.value })} className="px-2 py-1.5 border border-slate-300 rounded-lg text-xs"><option value="standard">Standard</option><option value="pro">Pro</option></select>
          <select aria-label="Time paid for" value={pay.days} onChange={(e) => setPay({ ...pay, days: e.target.value })} className="px-2 py-1.5 border border-slate-300 rounded-lg text-xs"><option value="30">1 month</option><option value="90">3 months</option><option value="365">1 year</option></select>
          <button type="submit" className="px-3 py-1.5 rounded-lg bg-blue-700 text-white text-xs font-semibold">Save</button>
        </div>
        {payMsg && <p role="status" className="text-xs text-slate-600">{payMsg}</p>}
      </form>
      <div className="overflow-x-auto">
        <table className="w-full text-xs"><thead><tr className="text-left text-slate-500"><th className="py-1">Latest sign-ups</th><th>Joined</th><th>Last sign-in</th></tr></thead>
          <tbody>{stats.recent.map((r, i) => <tr key={i} className="border-t border-slate-100"><td className="py-1 break-all">{r.email}</td><td>{day(r.created)}</td><td>{day(r.lastLogin)}</td></tr>)}</tbody></table>
      </div>
    </section>
  );
}
