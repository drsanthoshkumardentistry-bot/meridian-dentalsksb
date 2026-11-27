import React from "react";
import { PLANS } from "../plan.js";

const DAY = 86400000;
const TRIAL_DAYS = 30;
const money = (n) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/** Revenue and risk numbers worked out from the clinic list. Pure, so it can be tested. */
export function insightsOf(clinics = [], now = Date.now()) {
  const paid = clinics.filter((c) => c.state === "paid");
  const price = (id) => (PLANS.find((p) => p.id === id) || {}).monthly || 0;
  const mrr = paid.reduce((n, c) => n + price(c.plan), 0);
  const byPlan = PLANS.map((p) => ({ id: p.id, name: p.name, count: paid.filter((c) => c.plan === p.id).length }));
  const quiet = paid.filter((c) => !c.suspended && (c.weekMin || 0) === 0);
  const endingSoon = paid.filter((c) => c.paidUntil - now <= 7 * DAY).sort((a, b) => a.paidUntil - b.paidUntil);
  const trialEnding = clinics
    .filter((c) => c.state === "unpaid" && !c.suspended && c.created && c.created + TRIAL_DAYS * DAY > now && c.created + TRIAL_DAYS * DAY - now <= 7 * DAY)
    .sort((a, b) => a.created - b.created);
  const neverUsed = clinics.filter((c) => c.state === "unpaid" && !c.suspended && c.created && now - c.created > 3 * DAY && (c.weekMin || 0) === 0 && !c.lastLogin);
  const total = clinics.length;
  return { mrr, arr: mrr * 12, avg: paid.length ? mrr / paid.length : 0, paidCount: paid.length, conversion: total ? Math.round((paid.length / total) * 100) : 0, byPlan, quiet, endingSoon, trialEnding, neverUsed, total };
}

/** Signups per week for the last `weeks` weeks, oldest first. */
export const weeklySignups = (clinics = [], now = Date.now(), weeks = 8) => {
  const WEEK = 7 * DAY;
  const out = Array.from({ length: weeks }, (_, k) => ({ start: now - (weeks - k) * WEEK, count: 0 }));
  clinics.forEach((c) => { const age = now - (c.created || 0); if (c.created && age >= 0 && age < weeks * WEEK) out[weeks - 1 - Math.floor(age / WEEK)].count += 1; });
  return out;
};

const List = ({ title, hint, rows, note }) => (
  <div className="rounded-xl border border-slate-100 bg-white p-3">
    <div className="flex items-baseline justify-between gap-2"><h3 className="text-xs font-bold text-slate-800">{title}</h3><span className="text-[11px] font-semibold text-slate-500">{rows.length}</span></div>
    <p className="text-[11px] text-slate-500">{hint}</p>
    {rows.length === 0 ? <p className="mt-2 text-[11px] text-slate-400">None right now.</p> : (
      <ul className="mt-2 space-y-1">{rows.slice(0, 6).map((c) => <li key={c.uid} className="break-all text-xs text-slate-700">{c.email}<span className="text-slate-400">{note ? ` · ${note(c)}` : ""}</span></li>)}</ul>
    )}
  </div>
);

const Trend = ({ clinics, now }) => {
  const weeks = weeklySignups(clinics, now);
  const max = Math.max(1, ...weeks.map((w) => w.count));
  return (
    <div className="mt-3 rounded-xl border border-slate-100 bg-white p-3" data-testid="signup-trend">
      <h3 className="text-xs font-bold text-slate-800">New clinics per week</h3>
      <div className="mt-2 flex h-20 items-end gap-1.5" role="img" aria-label={`New clinics per week, oldest to newest: ${weeks.map((w) => w.count).join(", ")}`}>
        {weeks.map((w, k) => (
          <div key={w.start} className="flex flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[10px] text-slate-500">{w.count}</span>
            <div className={`w-full rounded-t ${k === weeks.length - 1 ? "bg-brand-600" : "bg-blue-200"}`} style={{ height: `${Math.max(4, (w.count / max) * 52)}px` }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-400"><span>8 weeks ago</span><span>This week</span></div>
    </div>
  );
};

export default function Insights({ clinics, now = Date.now(), className = "" }) {
  const i = insightsOf(clinics, now);
  const left = (c) => `${Math.max(0, Math.ceil((c.paidUntil - now) / DAY))} days left`;
  const trial = (c) => `${Math.max(0, Math.ceil((c.created + TRIAL_DAYS * DAY - now) / DAY))} days of trial left`;
  return (
    <section aria-label="Revenue and risk" className={className} data-testid="insights">
      <h2 className="font-display text-base font-extrabold text-ink">Revenue and risk</h2>
      <p className="mt-1 text-[11px] text-slate-500">Worked out from the plans clinics are on today. Nobody is charged until pricing is switched on, so treat these as what it would be.</p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[["Monthly", money(i.mrr)], ["Yearly (×12)", money(i.arr)], ["Per paying clinic", money(i.avg)], ["Signups paying", `${i.conversion}%`]].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-slate-50 p-3"><div className="text-[11px] text-slate-500">{k}</div><div className="font-display text-lg font-extrabold text-ink">{v}</div></div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-slate-600" data-testid="plan-mix">{i.byPlan.map((p) => `${p.name} ${p.count}`).join(" · ")}</p>
      <Trend clinics={clinics} now={now} />
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <List title="Paying but quiet" hint="Paid, yet nobody signed in this week. Check in before they leave." rows={i.quiet} note={left} />
        <List title="Renewing within 7 days" hint="Paid time is about to run out." rows={i.endingSoon} note={left} />
        <List title="Trials ending soon" hint="A good moment to offer a plan." rows={i.trialEnding} note={trial} />
        <List title="Signed up, never opened" hint="Created over 3 days ago with no sign-in time." rows={i.neverUsed} />
      </div>
    </section>
  );
}
