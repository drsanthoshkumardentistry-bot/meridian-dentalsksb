import React, { useCallback, useEffect, useState } from "react";
import { loadOverview, decideRequest } from "../adminApi.js";

const Tile = ({ label, value, note, tone = "text-slate-900" }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4">
    <div className={`text-2xl font-bold tabular-nums ${tone}`}>{value}</div>
    <div className="text-xs font-semibold text-slate-700 mt-0.5">{label}</div>
    {note && <div className="text-[11px] text-slate-500 mt-0.5">{note}</div>}
  </div>
);
export const mins = (m) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : m > 0 ? `${m}m` : "-");
const date = (ms) => (ms ? new Date(ms).toLocaleDateString("en-GB") : "never");
const ago = (ms, now = Date.now()) => {
  if (!ms) return "never";
  const m = Math.max(0, Math.round((now - ms) / 60000));
  return m < 2 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : date(ms);
};
const rupees = (n) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const planName = (p, yearly) => `${p === "pro" ? "Pro" : "Standard"}${yearly ? " (yearly)" : ""}`;

/** Founder-only home screen: who is online, time spent, billing, and subscription approvals. No patient data. */
export default function AdminDashboard({ initial = null, loadFn = loadOverview, decideFn = decideRequest, onOpenApp, onLogout, refreshMs = 60000, now }) {
  const [data, setData] = useState(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    try { const d = await loadFn(); if (!d) { setError("This account is not an admin, or your session ended. Sign in again."); return; } setData(d); setError(""); } catch (e) { setError((e && e.message) || "Could not load."); }
  }, [loadFn]);
  useEffect(() => {
    if (!initial) load();
    const t = refreshMs > 0 ? setInterval(load, refreshMs) : null;
    return () => { if (t) clearInterval(t); };
  }, [load, refreshMs]);

  const decide = async (r, action) => {
    setBusy(r.uid + action); setMsg("");
    try {
      const out = await decideFn({ uid: r.uid, action });
      setMsg(action === "approve" ? `Approved. ${r.email} has ${planName(r.plan, r.yearly)} until ${date(out.paidUntil)}.` : `Rejected the request from ${r.email}.`);
      setConfirm(null);
      await load();
    } catch (e) { setMsg((e && e.message) || "Could not save."); }
    finally { setBusy(""); }
  };

  const peak = data ? Math.max(0.1, ...data.presence.dayTotals.map((d) => d.hours)) : 1;
  const pending = data ? data.requests.filter((r) => r.status === "pending") : [];
  const decided = data ? data.requests.filter((r) => r.status !== "pending").slice(0, 8) : [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800" data-testid="admin-dashboard">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold text-slate-900">MeriDent admin</h1>
            <p className="text-xs text-slate-500">Only you can see this. Sign-in and usage times only. No patient data is read.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={load} className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold">Refresh</button>
            <button type="button" onClick={onOpenApp} className="px-3 py-1.5 rounded-lg border border-blue-300 bg-blue-50 text-blue-800 text-xs font-semibold">Open my clinic</button>
            <button type="button" onClick={onLogout} className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold">Sign out</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-5 space-y-6">
        {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 text-rose-800 text-xs p-3">{error}</p>}
        {!data && !error && <p className="text-sm text-slate-500">Loading…</p>}
        {msg && <p role="status" className="rounded-lg border border-blue-200 bg-blue-50 text-blue-900 text-xs p-3">{msg}</p>}

        {data && (<>
          <section aria-label="Activity" className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900">Activity</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <Tile label="Online now" value={data.presence.onlineNow} tone="text-emerald-700" note="seen in the last 10 minutes" />
              <Tile label="Active today" value={data.presence.activeToday} />
              <Tile label="Hours online today" value={data.presence.hoursToday} />
              <Tile label="Hours online, 7 days" value={data.presence.hoursWeek} />
              <Tile label="Clinics signed up" value={data.users.total} note={`${data.users.newLast7} new this week`} />
              <Tile label="Gone quiet (30+ days)" value={data.users.quiet30} />
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold text-slate-600 mb-2">Hours online per day (all clinics)</div>
              <div className="flex items-end gap-2 h-24" role="img" aria-label="Hours online per day">
                {data.presence.dayTotals.map((d) => (
                  <div key={d.day} className="flex-1 flex flex-col items-center justify-end h-full">
                    <div className="text-[10px] text-slate-500">{d.hours}</div>
                    <div className="w-full bg-blue-600/80 rounded-t" style={{ height: `${Math.max(3, (d.hours / peak) * 80)}%` }} />
                    <div className="text-[10px] text-slate-500 mt-1">{d.day.slice(5)}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section aria-label="Billing" className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900">Billing</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Tile label="Paying clinics" value={data.billing.paidActive} tone="text-emerald-700" />
              <Tile label="Monthly value" value={rupees(data.billing.monthlyValue)} note="at the list price of each paid plan" />
              <Tile label="Expired plans" value={data.billing.expired} tone={data.billing.expired ? "text-amber-700" : "text-slate-900"} />
              <Tile label="Waiting for approval" value={data.billing.pending} tone={data.billing.pending ? "text-blue-700" : "text-slate-900"} />
            </div>
          </section>

          <section aria-label="Subscription requests" className="space-y-3" data-testid="requests">
            <h2 className="text-sm font-bold text-slate-900">Subscription requests</h2>
            {pending.length === 0 ? <p className="text-xs text-slate-500">No requests waiting.</p> : (
              <ul className="space-y-2">
                {pending.map((r) => (
                  <li key={r.uid} className="rounded-xl border border-blue-200 bg-white p-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm">
                      <div className="font-semibold text-slate-900 break-all">{r.email}{r.clinic ? ` (${r.clinic})` : ""}</div>
                      <div className="text-xs text-slate-600">{planName(r.plan, r.yearly)} · asked {ago(r.createdAt, now)}</div>
                    </div>
                    {confirm === r.uid ? (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-700">Payment received?</span>
                        <button type="button" disabled={!!busy} onClick={() => decide(r, "approve")} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold disabled:opacity-60">Yes, activate</button>
                        <button type="button" onClick={() => setConfirm(null)} className="px-3 py-1.5 rounded-lg border border-slate-300">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex gap-2 text-xs">
                        <button type="button" onClick={() => setConfirm(r.uid)} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold" aria-label={`Approve ${r.email}`}>Approve</button>
                        <button type="button" disabled={!!busy} onClick={() => decide(r, "reject")} className="px-3 py-1.5 rounded-lg border border-slate-300 font-semibold" aria-label={`Reject ${r.email}`}>Reject</button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {decided.length > 0 && <p className="text-[11px] text-slate-500">Recently decided: {decided.map((r) => `${r.email} (${r.status})`).join(", ")}</p>}
            <p className="text-[11px] text-slate-500">Approving switches the plan on for 30 days (365 for yearly). Approve only after you have seen the payment.</p>
          </section>

          <section aria-label="Clinics" className="space-y-3" data-testid="clinics">
            <h2 className="text-sm font-bold text-slate-900">Clinics</h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-xs">
                <thead><tr className="text-left text-slate-500">
                  <th className="p-3">Sign-in email</th><th className="p-3">Status</th><th className="p-3">Today</th><th className="p-3">7 days</th><th className="p-3">Joined</th><th className="p-3">Plan</th><th className="p-3">Request</th>
                </tr></thead>
                <tbody>{data.clinics.map((c) => (
                  <tr key={c.uid} className="border-t border-slate-100">
                    <td className="p-3 break-all">{c.email}</td>
                    <td className="p-3">{c.online ? <span className="text-emerald-700 font-semibold">Online</span> : <span className="text-slate-500">{ago(c.lastLogin, now)}</span>}</td>
                    <td className="p-3 tabular-nums">{mins(c.todayMin)}</td>
                    <td className="p-3 tabular-nums">{mins(c.weekMin)}</td>
                    <td className="p-3">{date(c.created)}</td>
                    <td className="p-3">{c.state === "paid" ? `${planName(c.plan)} until ${date(c.paidUntil)}` : c.state === "expired" ? <span className="text-amber-700">{planName(c.plan)} ended {date(c.paidUntil)}</span> : <span className="text-slate-500">Free trial</span>}</td>
                    <td className="p-3">{c.request === "pending" ? <span className="text-blue-700 font-semibold">Waiting</span> : c.request || "-"}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </section>
        </>)}
      </main>
    </div>
  );
}
