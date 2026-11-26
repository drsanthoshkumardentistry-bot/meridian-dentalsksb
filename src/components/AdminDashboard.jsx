import React, { useCallback, useEffect, useMemo, useState } from "react";
import { LayoutDashboard, IndianRupee, Users, Menu, X, LogOut, Hospital, UserCog, RefreshCw, CheckCircle2 } from "lucide-react";
import NotificationBell from "./NotificationBell.jsx";
import ClinicDetail from "./ClinicDetail.jsx";
import { planName as planLabel } from "../plan.js";
import AdminProfile from "./AdminProfile.jsx";
import { readLocal, writeLocal, weeklySignups, renewalsTimeline, sortClinics, SORTS } from "../adminTools.js";
import FullscreenButton from "./FullscreenButton.jsx";
import { loadOverview, decideRequest } from "../adminApi.js";
import { loadAnnouncement, saveAnnouncement } from "../announcementApi.js";

export const mins = (m) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : m > 0 ? `${m}m` : "-");
const date = (ms) => (ms ? new Date(ms).toLocaleDateString("en-GB") : "never");
const ago = (ms, now = Date.now()) => {
  if (!ms) return "never";
  const m = Math.max(0, Math.round((now - ms) / 60000));
  return m < 2 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : date(ms);
};
const rupees = (n) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const planName = (p, yearly) => `${planLabel(p)}${yearly ? " (yearly)" : ""}`;
const weekday = (day) => { const d = new Date(`${day}T00:00:00`); return Number.isNaN(d.getTime()) ? day.slice(5) : d.toLocaleDateString("en-GB", { weekday: "short" }); };
const DAY = 86400000;
const AVATARS = ["bg-brand-600", "bg-aqua-600", "bg-emerald-600", "bg-violet-600", "bg-gold-700", "bg-rose-600"];
const avatarOf = (s) => AVATARS[[...String(s)].reduce((n, c) => n + c.charCodeAt(0), 0) % AVATARS.length];

const NAV = [["overview", "Overview", LayoutDashboard], ["billing", "Billing & approvals", IndianRupee], ["clinics", "Clinics", Users], ["profile", "Admin profile", UserCog]];

const Tile = ({ label, value, note, accent = "bg-brand-500", tone = "text-ink" }) => (
  <div className="relative overflow-hidden rounded-2xl border border-rule bg-white p-4 pl-5 shadow-card">
    <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1.5 ${accent}`} />
    <div className={`font-display text-3xl font-extrabold tabular-nums leading-none ${tone}`}>{value}</div>
    <div className="mt-1.5 text-xs font-semibold text-slate-700">{label}</div>
    {note && <div className="text-[11px] text-slate-500 mt-0.5">{note}</div>}
  </div>
);

const Section = ({ title, label, children, right, testId }) => (
  <section aria-label={label || title} data-testid={testId} className="space-y-3">
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-display text-base font-bold text-ink">{title}</h2>
      {right}
    </div>
    {children}
  </section>
);

const Chip = ({ children, tone = "bg-slate-100 text-slate-700" }) => <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>{children}</span>;

/** Founder-only home screen: who is online, time spent, billing, and subscription approvals. No patient data. */
export default function AdminDashboard({ email = "", initial = null, loadFn = loadOverview, decideFn = decideRequest, announceLoad = loadAnnouncement, announceSave = saveAnnouncement, onOpenApp, onLogout, refreshMs = 60000, now, user = null, startView = "overview" }) {
  const [data, setData] = useState(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [updated, setUpdated] = useState(initial ? Date.now() : 0);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [showAll, setShowAll] = useState(false);
  const [sort, setSort] = useState("seen");
  const [openId, setOpenId] = useState("");
  const [view, setView] = useState(NAV.some((n) => n[0] === startView) ? startView : "overview");
  const [menu, setMenu] = useState(false);
  const [every, setEvery] = useState(() => { const v = readLocal("merident.admin.refresh", null); return Number.isFinite(v) ? v : refreshMs; });

  const load = useCallback(async () => {
    try {
      const d = await loadFn();
      if (!d) { setError("This account is not an admin, or your session ended. Sign in again."); return; }
      setData(d); setError(""); setUpdated(Date.now());
    } catch (e) { setError((e && e.message) || "Could not load."); }
  }, [loadFn]);
  useEffect(() => {
    if (!initial) load();
    const t = every > 0 ? setInterval(load, every) : null;
    return () => { if (t) clearInterval(t); };
  }, [load, every]); // eslint-disable-line react-hooks/exhaustive-deps

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

  useEffect(() => {
    if (!msg) return undefined;
    const t = setTimeout(() => setMsg(""), 6000);
    return () => clearTimeout(t);
  }, [msg]);
  const t0 = now || Date.now();
  const clinics = data ? data.clinics : [];
  const counts = useMemo(() => ({
    all: clinics.length,
    online: clinics.filter((c) => c.online).length,
    paying: clinics.filter((c) => c.state === "paid").length,
    requested: clinics.filter((c) => c.request === "pending").length,
    quiet: clinics.filter((c) => !c.online && (!c.lastLogin || t0 - c.lastLogin > 30 * DAY)).length,
  }), [clinics, t0]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sortClinics(clinics, sort).filter((c) => (!q || c.email.toLowerCase().includes(q)) && (
      filter === "all" || (filter === "online" && c.online) || (filter === "paying" && c.state === "paid") ||
      (filter === "requested" && c.request === "pending") || (filter === "quiet" && !c.online && (!c.lastLogin || t0 - c.lastLogin > 30 * DAY))));
  }, [clinics, query, filter, sort, t0]);
  const signups = useMemo(() => weeklySignups(clinics, t0, 8), [clinics, t0]);
  const renewals = useMemo(() => renewalsTimeline(clinics, t0), [clinics, t0]);
  const peakSignups = Math.max(1, ...signups.map((w) => w.count));
  const visible = showAll ? shown : shown.slice(0, 24);

  const peak = data ? Math.max(0.1, ...data.presence.dayTotals.map((d) => d.hours)) : 1;
  const anyTime = data ? data.presence.dayTotals.some((d) => d.hours > 0) : false;
  const pending = data ? data.requests.filter((r) => r.status === "pending") : [];
  const alerts = [
    ...pending.map((r) => ({ id: "p" + r.uid, tone: "amber", kind: "billing", to: "billing", text: `${r.email} asked for ${planName(r.plan, r.yearly)}` })),
    ...(counts.quiet ? [{ id: "quiet", tone: "blue", kind: "clinics", to: "clinics", text: `${counts.quiet} clinic${counts.quiet === 1 ? " has" : "s have"} not signed in for 30 days` }] : []),
  ];
  const decided = data ? data.requests.filter((r) => r.status !== "pending").slice(0, 8) : [];
  const FILTERS = [["all", "All"], ["online", "Online"], ["paying", "Paying"], ["requested", "Requested"], ["quiet", "Quiet"]];

  return (
    <div className="min-h-screen app-backdrop text-slate-800 font-sans" data-testid="admin-dashboard">
      {menu && <button type="button" aria-label="Close menu" onClick={() => setMenu(false)} className="fixed inset-0 z-40 bg-black/40 md:hidden" />}
      <aside aria-label="Admin menu" className={`fixed inset-y-0 left-0 z-50 w-64 side-navy text-white flex flex-col justify-between overflow-y-auto shadow-2xl transition-transform duration-300 md:translate-x-0 ${menu ? "translate-x-0" : "-translate-x-full"}`}>
        <div>
          <div className="p-5 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="" className="w-9 h-9 object-contain" onError={(e) => { e.currentTarget.style.display = "none"; }} />
              <div>
                <div className="font-display text-lg font-extrabold text-white tracking-tight leading-none">MeriDent</div>
                <div className="text-[11px] text-blue-200/70 mt-1">Admin</div>
              </div>
            </div>
            <button type="button" onClick={() => setMenu(false)} className="md:hidden text-blue-200 hover:text-white" aria-label="Close menu"><X className="w-5 h-5" /></button>
          </div>
          <nav className="p-3 space-y-1" aria-label="Admin sections">
            {NAV.map(([id, text, Icon]) => (
              <button key={id} type="button" aria-current={view === id ? "page" : undefined} onClick={() => { setView(id); setMenu(false); window.scrollTo?.(0, 0); }}
                className={`nav-item group w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-[13px] font-medium ${view === id ? "nav-item-active text-white font-semibold" : "text-blue-100/80 hover:text-white"}`}>
                <span className="nav-icon"><Icon className="w-4 h-4" /></span>
                <span className="flex-1 text-left">{text}</span>
                {id === "billing" && data && data.billing.pending > 0 && <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-brand-700" aria-label={`${data.billing.pending} waiting`}>{data.billing.pending}</span>}
              </button>
            ))}
            <button type="button" onClick={onOpenApp} className="nav-item group w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-[13px] font-medium text-blue-100/80 hover:text-white">
              <span className="nav-icon"><Hospital className="w-4 h-4" /></span><span className="flex-1 text-left">Open my clinic</span>
            </button>
          </nav>
        </div>
        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="flex items-center gap-3 min-w-0">
            <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-500 text-sm font-bold">{(email[0] || "A").toUpperCase()}</span>
            <div className="min-w-0"><div className="text-xs font-semibold text-white">Founder</div><div className="truncate text-[11px] text-blue-200/70">{email || "Admin account"}</div></div>
          </div>
          <button type="button" onClick={onLogout} className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-400/60 bg-red-600/15 py-2 text-xs font-semibold text-red-300 hover:bg-red-600 hover:text-white"><LogOut className="w-3.5 h-3.5" /> Sign out</button>
        </div>
      </aside>

      <div className="md:ml-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-white/70 bg-white/55 px-4 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <button type="button" onClick={() => setMenu(true)} className="md:hidden rounded-lg border border-rule p-2" aria-label="Open menu"><Menu className="w-4 h-4" /></button>
            <div className="min-w-0">
              <h1 className="font-display text-lg font-extrabold leading-tight text-ink">{NAV.find((n) => n[0] === view)[1]}</h1>
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${error ? "bg-rose-500" : "bg-emerald-500"}`} />
                {updated ? `Live, updated ${new Date(updated).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}` : "Loading"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={load} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white"><RefreshCw className="w-3.5 h-3.5" /> <span className="max-sm:sr-only">Refresh</span></button>
            <FullscreenButton />
            <NotificationBell items={alerts} onOpen={(to) => setView(to)} />
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-5 space-y-7">
          <p className="text-xs text-slate-500">Only you can see this. Sign-in and usage times only. No patient data is read.</p>
          {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs p-3">{error}</p>}
          {!data && !error && <p className="text-sm text-slate-500">Loading…</p>}
          

        {data && (<>
          {view === "overview" && <Section title="Activity" label="Activity">
            <div className="rounded-3xl bg-gradient-to-br from-navy-900 via-navy-800 to-brand-700 p-5 text-white shadow-lift grid grid-cols-2 gap-4 items-end">
              <div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5" aria-hidden="true"><span className={`absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 ${data.presence.onlineNow ? "animate-ping" : ""}`} /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" /></span>
                  <span className="text-[11px] text-blue-200">last 10 minutes</span>
                </div>
                <div className="font-display text-6xl font-extrabold leading-none tabular-nums mt-2">{data.presence.onlineNow}</div>
                <div className="mt-1 text-sm font-semibold">Online now</div>
              </div>
              <div className="text-right">
                <div className="font-display text-4xl font-extrabold leading-none tabular-nums">{data.presence.activeToday}</div>
                <div className="mt-1 text-sm font-semibold text-blue-100">Active today</div>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Tile label="Hours online today" value={data.presence.hoursToday} accent="bg-aqua-500" />
              <Tile label="Hours online, 7 days" value={data.presence.hoursWeek} accent="bg-aqua-500" />
              <Tile label="Clinics signed up" value={data.users.total} note={`${data.users.newLast7} new this week`} accent="bg-brand-500" />
              <Tile label="Gone quiet (30+ days)" value={data.users.quiet30} accent="bg-gold-500" tone={data.users.quiet30 ? "text-gold-700" : "text-ink"} />
            </div>
            <div className="rounded-2xl border border-rule bg-white p-4 shadow-card">
              <div className="text-xs font-semibold text-slate-700 mb-3">Hours online per day, all clinics</div>
              {anyTime ? (
                <div className="flex items-end gap-2 h-28" role="img" aria-label="Hours online per day">
                  {data.presence.dayTotals.map((d, i, a) => (
                    <div key={d.day} className="flex-1 flex flex-col items-center justify-end h-full">
                      <div className="text-[10px] text-slate-500 tabular-nums">{d.hours > 0 ? d.hours : ""}</div>
                      <div className={`w-full rounded-t-md ${i === a.length - 1 ? "bg-brand-600" : "bg-brand-100"}`} style={{ height: `${Math.max(4, (d.hours / peak) * 78)}%` }} />
                      <div className={`text-[10px] mt-1 ${i === a.length - 1 ? "font-bold text-brand-700" : "text-slate-500"}`}>{weekday(d.day)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-4">No online time recorded yet. It builds up as clinics keep MeriDent open.</p>
              )}
            </div>
          <div className="rounded-2xl border border-rule bg-white p-4 shadow-card" data-testid="signups-chart">
              <div className="text-xs font-semibold text-slate-700 mb-3">New clinics per week, last 8 weeks</div>
              <div className="flex items-end gap-2 h-24" role="img" aria-label="New clinics per week">
                {signups.map((w, i, a) => (
                  <div key={w.end} className="flex-1 flex flex-col items-center justify-end h-full">
                    <div className="text-[10px] text-slate-500 tabular-nums">{w.count > 0 ? w.count : ""}</div>
                    <div className={`w-full rounded-t-md ${i === a.length - 1 ? "bg-emerald-600" : "bg-emerald-200"}`} style={{ height: `${Math.max(4, (w.count / peakSignups) * 78)}%` }} />
                    <div className="text-[10px] mt-1 text-slate-500">{i === a.length - 1 ? "Now" : `-${a.length - 1 - i}w`}</div>
                  </div>
                ))}
              </div>
            </div>
          </Section>}

          {view === "billing" && <Section title="Billing" label="Billing">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Tile label="Paying clinics" value={data.billing.paidActive} accent="bg-emerald-500" tone="text-emerald-700" />
              <Tile label="Monthly value" value={rupees(data.billing.monthlyValue)} note="at the list price of each paid plan" accent="bg-emerald-500" />
              <Tile label="Expired plans" value={data.billing.expired} accent="bg-gold-500" tone={data.billing.expired ? "text-gold-700" : "text-ink"} />
              <Tile label="Waiting for approval" value={data.billing.pending} accent="bg-brand-500" tone={data.billing.pending ? "text-brand-700" : "text-ink"} />
            </div>
          </Section>}

          {view === "billing" && <Section title="Renewals coming up" label="Renewals" testId="renewals" right={<span className="text-[11px] text-slate-500">{renewals.length} paying</span>}>
            {renewals.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-rule bg-white p-4 text-xs text-slate-500">No paid plans yet. Active plans show here with the days left.</div>
            ) : (
              <ul className="divide-y divide-rule rounded-2xl border border-rule bg-white shadow-card">
                {renewals.slice(0, 12).map((c) => (
                  <li key={c.uid || c.email} className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs">
                    <span className="min-w-0 break-all font-semibold text-ink">{c.email}</span>
                    <span className="flex shrink-0 items-center gap-2"><Chip tone="bg-brand-50 text-brand-700">{planName(c.plan)}</Chip><Chip tone={c.urgent ? "bg-rose-100 text-rose-700" : "bg-emerald-50 text-emerald-700"}>{c.daysLeft} day{c.daysLeft === 1 ? "" : "s"} left</Chip></span>
                  </li>
                ))}
              </ul>
            )}
          </Section>}

          {view === "billing" && <Section title="Subscription requests" label="Subscription requests" testId="requests" right={pending.length > 0 && <Chip tone="bg-brand-100 text-brand-700">{pending.length} waiting</Chip>}>
            {pending.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-rule bg-white p-4 text-xs text-slate-500">All caught up. No requests waiting. When a clinic asks for a plan in Settings, it shows here.</div>
            ) : (
              <ul className="space-y-2">
                {pending.map((r) => (
                  <li key={r.uid} className="rounded-2xl border border-brand-100 bg-white p-4 shadow-card space-y-3">
                    <div className="flex items-center gap-3">
                      <span aria-hidden="true" className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white ${avatarOf(r.email)}`}>{(r.email[0] || "?").toUpperCase()}</span>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-ink break-all">{r.email}{r.clinic ? ` (${r.clinic})` : ""}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500"><Chip tone="bg-brand-50 text-brand-700">{planName(r.plan, r.yearly)}</Chip> asked {ago(r.createdAt, now)}</div>
                      </div>
                    </div>
                    {confirm === r.uid ? (
                      <div className="flex flex-wrap items-center gap-2 text-xs rounded-xl bg-emerald-50 p-2.5">
                        <span className="font-semibold text-emerald-900">Payment received?</span>
                        <button type="button" disabled={!!busy} onClick={() => decide(r, "approve")} className="rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white disabled:opacity-60">Yes, activate</button>
                        <button type="button" onClick={() => setConfirm(null)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5">Cancel</button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 text-xs sm:max-w-sm">
                        <button type="button" onClick={() => setConfirm(r.uid)} className="rounded-xl bg-emerald-600 px-3 py-2.5 font-semibold text-white" aria-label={`Approve ${r.email}`}>Approve</button>
                        <button type="button" disabled={!!busy} onClick={() => decide(r, "reject")} className="rounded-xl border border-slate-300 px-3 py-2.5 font-semibold" aria-label={`Reject ${r.email}`}>Reject</button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {decided.length > 0 && <p className="text-[11px] text-slate-500">Recently decided: {decided.map((r) => `${r.email} (${r.status})`).join(", ")}</p>}
            <p className="text-[11px] text-slate-500">Approving switches the plan on for 30 days (365 for yearly). Approve only after you have seen the payment.</p>
          </Section>}

          {view === "clinics" && <Section title="Clinics" label="Clinics" testId="clinics" right={<span className="text-[11px] text-slate-500">{shown.length} of {counts.all}</span>}>
            <div className="space-y-2">
              <input type="search" aria-label="Search clinics" maxLength={100} placeholder="Search by sign-in email" value={query} onChange={(e) => { setQuery(e.target.value); setShowAll(false); }} className="w-full rounded-xl border border-rule bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
              <label className="flex items-center gap-2 text-xs text-slate-600">Sort by
                <select aria-label="Sort clinics" value={sort} onChange={(e) => { setSort(e.target.value); setShowAll(false); }} className="rounded-lg border border-rule bg-white px-2 py-1 text-xs">
                  {SORTS.map(([id, text]) => <option key={id} value={id}>{text}</option>)}
                </select>
              </label>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter clinics">
                {FILTERS.map(([id, text]) => (
                  <button key={id} type="button" aria-pressed={filter === id} onClick={() => { setFilter(id); setShowAll(false); }} className={`rounded-full border px-3 py-1 text-xs font-semibold ${filter === id ? "border-brand-600 bg-brand-600 text-white" : "border-rule bg-white text-slate-700"}`}>
                    {text} <span className={filter === id ? "text-blue-100" : "text-slate-400"}>{counts[id]}</span>
                  </button>
                ))}
              </div>
            </div>
            {visible.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-rule bg-white p-6 text-center text-xs text-slate-500">No clinics match.</div>
            ) : (
              <ul className="grid gap-2 lg:grid-cols-2">
                {visible.map((c) => (
                  <li key={c.uid} className="flex items-start gap-3 rounded-2xl border border-rule bg-white p-3.5 shadow-card">
                    <span aria-hidden="true" className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white ${avatarOf(c.email)}`}>{(c.email[0] || "?").toUpperCase()}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-ink break-all">{c.email}</div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {c.online ? <Chip tone="bg-emerald-50 text-emerald-700"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Online</Chip> : <Chip>{`Seen ${ago(c.lastLogin, now)}`}</Chip>}
                        {c.state === "paid" ? <Chip tone="bg-brand-50 text-brand-700">{`${planName(c.plan)} until ${date(c.paidUntil)}`}</Chip>
                          : c.state === "expired" ? <Chip tone="bg-gold-50 text-gold-700">{`${planName(c.plan)} ended ${date(c.paidUntil)}`}</Chip>
                          : <Chip>Free trial</Chip>}
                        {c.request === "pending" && <Chip tone="bg-brand-600 text-white">Plan requested</Chip>}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-slate-500 [&>span]:whitespace-nowrap">
                        <span>Today <b className="text-slate-800 tabular-nums">{mins(c.todayMin)}</b></span>
                        <span>7 days <b className="text-slate-800 tabular-nums">{mins(c.weekMin)}</b></span>
                        <span>Joined {date(c.created)}</span>
                      </div>
                      <button type="button" aria-expanded={openId === c.uid} aria-label={`${openId === c.uid ? "Hide" : "Show"} details for ${c.email}`} onClick={() => setOpenId(openId === c.uid ? "" : c.uid)} className="mt-2 text-[11px] font-semibold text-brand-700 underline underline-offset-2">{openId === c.uid ? "Hide details" : "Details and message"}</button>
                      {openId === c.uid && <ClinicDetail clinic={c} onToast={setMsg} />}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {!showAll && shown.length > visible.length && (
              <button type="button" onClick={() => setShowAll(true)} className="w-full rounded-xl border border-rule bg-white py-2.5 text-xs font-semibold text-brand-700">Show all {shown.length}</button>
            )}
          </Section>}
          {view === "profile" && <AdminProfile announceLoad={announceLoad} announceSave={announceSave} user={user} email={email} data={data} now={now} every={every} onEvery={(ms) => { setEvery(ms); writeLocal("merident.admin.refresh", ms); }} onToast={setMsg} onOpenApp={onOpenApp} onLogout={onLogout} />}
        </>)}
        </main>
      </div>
      {msg && (
        <div role="status" className="fixed bottom-20 right-5 z-50 flex max-w-[calc(100vw-2.5rem)] items-center gap-2.5 rounded-xl border border-slate-700 bg-ink px-4 py-2.5 text-xs text-white shadow-xl animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" /> <span>{msg}</span>
        </div>
      )}
    </div>
  );
}
