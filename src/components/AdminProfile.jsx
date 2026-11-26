import React, { useEffect, useMemo, useState } from "react";
import { Copy, Download, Plus, Trash2, Hospital, LogOut, Mail, StickyNote, ListChecks, Settings2, TrendingUp, MessageCircle, ShieldCheck, Rocket, UserRound, Megaphone } from "lucide-react";
import UserAvatar from "./UserAvatar.jsx";
import { clinicsCsv, requestsCsv, followUps, emailList, REFRESH_CHOICES, readLocal, writeLocal, cleanTodos, businessStats, goalProgress, TEMPLATES, fillTemplate, whatsappLink, LAUNCH_ITEMS, securityInfo } from "../adminTools.js";

const TODO_KEY = "merident.admin.todos";
const NOTE_KEY = "merident.admin.notes";
const DETAILS_KEY = "merident.admin.details";
const GOAL_KEY = "merident.admin.goal";
const LAUNCH_KEY = "merident.admin.launch";
const card = "rounded-2xl border border-rule bg-white/80 p-4 shadow-card";

function saveFile(name, text) {
  try {
    const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch { return false; }
}

/** Founder's own page: account, who to follow up with, exports, refresh speed, private to-dos and notes. */
export default function AdminProfile({ announceLoad, announceSave, user, email = "", data, now, every, onEvery, onToast, onOpenApp, onLogout }) {
  const t0 = now || Date.now();
  const clinics = data ? data.clinics : [];
  const lists = useMemo(() => followUps(clinics, t0), [clinics, t0]);
  const [todos, setTodos] = useState(() => cleanTodos(readLocal(TODO_KEY, [])));
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState(() => String(readLocal(NOTE_KEY, "")).slice(0, 2000));
  const [open, setOpen] = useState("");
  const [ann, setAnn] = useState({ text: "", level: "info", live: false, busy: false, loaded: false });
  useEffect(() => {
    let alive = true;
    if (announceLoad) announceLoad().then((a) => { if (alive) setAnn((x) => (x.touched ? { ...x, live: !!a.active, loaded: true } : { ...x, text: a.text || "", level: a.level || "info", live: !!a.active, loaded: true })); }).catch(() => { if (alive) setAnn((x) => ({ ...x, loaded: true })); });
    return () => { alive = false; };
  }, [announceLoad]);
  const publish = async (text) => {
    setAnn((x) => ({ ...x, busy: true }));
    try {
      const out = await announceSave({ text, level: ann.level });
      setAnn((x) => ({ ...x, busy: false, live: !!out.active, text: out.text || "" }));
      onToast(out.active ? "Published. Clinics see it within 10 minutes." : "Banner removed.");
    } catch (e) {
      setAnn((x) => ({ ...x, busy: false }));
      onToast((e && e.message) || "Could not save.");
    }
  };
  const [details, setDetails] = useState(() => { const d = readLocal(DETAILS_KEY, {}); return { name: String((d && d.name) || "").slice(0, 60), phone: String((d && d.phone) || "").slice(0, 20) }; });
  const [goal, setGoal] = useState(() => String(readLocal(GOAL_KEY, "") || ""));
  const [launch, setLaunch] = useState(() => { const l = readLocal(LAUNCH_KEY, {}); return l && typeof l === "object" && !Array.isArray(l) ? l : {}; });
  const [tpl, setTpl] = useState(TEMPLATES[0][0]);
  const [who, setWho] = useState("");
  const stats = useMemo(() => businessStats(data), [data]);
  const progress = stats ? goalProgress(stats.paidActive, goal) : null;
  const security = securityInfo(user);
  const message = fillTemplate((TEMPLATES.find((t) => t[0] === tpl) || TEMPLATES[0])[2], { name: who.trim(), sender: details.name.trim() });
  const setDetail = (k, v) => { const next = { ...details, [k]: v }; setDetails(next); writeLocal(DETAILS_KEY, next); };
  const tick = (id) => { const next = { ...launch, [id]: !launch[id] }; setLaunch(next); writeLocal(LAUNCH_KEY, next); };

  const copy = async (text, what) => {
    try { await navigator.clipboard.writeText(text); onToast(`Copied ${what}.`); } catch { onToast("Could not copy. Select the text and copy it yourself."); }
  };
  const saveTodos = (next) => { setTodos(next); writeLocal(TODO_KEY, next); };
  const add = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    saveTodos([...todos, { id: String(Date.now()), text: text.slice(0, 140), done: false }].slice(0, 50));
    setDraft("");
  };
  const download = (name, text) => onToast(saveFile(name, text) ? `Saved ${name}.` : "Could not save the file.");
  const groups = [
    ["renewalsDue", "Renewals due in 7 days", "Plan ends soon. Remind them before it lapses."],
    ["expired", "Plan ended", "Paid before, not renewed."],
    ["quiet", "Not signed in for 30 days", "Ask if they need help getting started."],
    ["fresh", "Joined this week", "Say hello and offer a walkthrough."],
  ];

  return (
    <div className="space-y-5" data-testid="admin-profile">
      <section aria-label="Account" className={`${card} flex flex-wrap items-center gap-4`}>
        <UserAvatar user={user || { email }} className="h-14 w-14" textClass="text-xl" />
        <div className="min-w-0 flex-1">
          <div className="font-display text-lg font-extrabold text-ink">{(user && user.displayName) || "Founder"}</div>
          <div className="truncate text-xs text-slate-600">{email || "Admin account"}</div>
          <div className="mt-1 text-[11px] text-slate-500">Founder access. You see sign-in and usage times only, never patient records.</div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <button type="button" onClick={() => copy(email, "your email")} disabled={!email} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 disabled:opacity-50"><Copy className="h-3.5 w-3.5" /> Copy email</button>
          <button type="button" onClick={onOpenApp} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700"><Hospital className="h-3.5 w-3.5" /> Open my clinic</button>
          <button type="button" onClick={onLogout} className="inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-red-50 px-3 py-1.5 font-semibold text-red-700 hover:bg-red-600 hover:text-white"><LogOut className="h-3.5 w-3.5" /> Sign out</button>
        </div>
      </section>


      {announceSave && (
        <section aria-label="Announcement" className={card} data-testid="announcement-editor">
          <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-ink"><Megaphone className="h-4 w-4 text-brand-600" /> Message to all clinics</h2>
          <p className="mt-1 text-[11px] text-slate-500">Shown as a banner at the top of every clinic's screen. Each clinic can dismiss it. {ann.live ? "A banner is live now." : "No banner is live."}</p>
          <label htmlFor="ann-text" className="mt-3 block text-xs font-semibold text-slate-700">Banner message</label>
          <textarea id="ann-text" rows={2} maxLength={240} value={ann.text} onChange={(e) => setAnn({ ...ann, text: e.target.value, touched: true })} placeholder="For example: MeriDent will be updated tonight at 11 pm. Please save your work." className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" />
          <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Ready-made messages">
            {[["Maintenance soon", "warning", "MeriDent will be briefly unavailable for maintenance tonight. Please save your work before 11 pm."], ["Maintenance done", "success", "Maintenance is finished and MeriDent is working normally. Thank you for waiting."], ["Slow right now", "warning", "MeriDent is running slowly right now. We are fixing it. Your data is safe."]].map(([label, level, text]) => (
              <button key={label} type="button" onClick={() => setAnn({ ...ann, text, level, touched: true })} className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">{label}</button>
            ))}
          </div>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500"><span>{ann.text.length}/240. Plain text only. Do not put patient details here.</span></div>
          <div className="mt-2 flex flex-wrap items-end gap-2 text-xs">
            <div><label htmlFor="ann-level" className="block font-semibold text-slate-700">Style</label>
              <select id="ann-level" value={ann.level} onChange={(e) => setAnn({ ...ann, level: e.target.value, touched: true })} className="mt-1 rounded-lg border border-slate-300 bg-white px-2 py-2"><option value="info">Information (blue)</option><option value="success">Good news (green)</option><option value="warning">Important (amber)</option></select></div>
            <button type="button" disabled={ann.busy || !ann.text.trim()} onClick={() => publish(ann.text)} className="rounded-lg bg-brand-600 px-3 py-2 font-semibold text-white disabled:opacity-50">Publish to all clinics</button>
            <button type="button" disabled={ann.busy || !ann.live} onClick={() => publish("")} className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-700 disabled:opacity-50">Remove banner</button>
          </div>
        </section>
      )}

      {stats && (
        <section aria-label="Business snapshot" className={card} data-testid="business-snapshot">
          <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-ink"><TrendingUp className="h-4 w-4 text-brand-600" /> Business snapshot</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4 text-center">
            {[["Yearly value", `₹${Math.round(stats.yearlyValue).toLocaleString("en-IN")}`, "monthly value x 12"], ["Paying", `${stats.conversion}%`, `${stats.paidActive} of ${stats.total} clinics`], ["Lapsed", `${stats.churn}%`, "of clinics that ever paid"], ["Hours per clinic", String(stats.hoursPerClinic), "this week"]].map(([k, v, n]) => (
              <div key={k} className="rounded-xl border border-rule bg-white p-3"><dd className="text-xl font-extrabold text-ink tabular-nums">{v}</dd><dt className="text-[11px] font-semibold text-slate-700">{k}</dt><div className="text-[10px] text-slate-500">{n}</div></div>
            ))}
          </dl>
          <div className="mt-4">
            <label htmlFor="admin-goal" className="block text-xs font-semibold text-slate-700">My goal: paying clinics</label>
            <input id="admin-goal" type="number" inputMode="numeric" min="1" max="100000" value={goal} onChange={(e) => { const v = e.target.value.slice(0, 6); setGoal(v); writeLocal(GOAL_KEY, v); }} placeholder="For example 25" className="mt-1 w-32 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" />
            {progress && (
              <div className="mt-2" data-testid="goal-progress">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress.percent}%` }} /></div>
                <p className="mt-1 text-xs text-slate-600">{progress.percent}% of the way. {progress.left === 0 ? "Goal reached." : `${progress.left} more paying clinic${progress.left === 1 ? "" : "s"} to go.`}</p>
              </div>
            )}
          </div>
        </section>
      )}

      <section aria-label="Message templates" className={card}>
        <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-ink"><MessageCircle className="h-4 w-4 text-brand-600" /> Ready-made messages</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div><label htmlFor="tpl" className="block text-xs font-semibold text-slate-700">Message</label>
            <select id="tpl" value={tpl} onChange={(e) => setTpl(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm">{TEMPLATES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></div>
          <div><label htmlFor="tpl-who" className="block text-xs font-semibold text-slate-700">Doctor's name</label>
            <input id="tpl-who" maxLength={60} value={who} onChange={(e) => setWho(e.target.value)} placeholder="For example Dr Ravi" className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" /></div>
        </div>
        <p data-testid="template-preview" className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm text-slate-800">{message}</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <button type="button" onClick={() => copy(message, "the message")} className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-2 font-semibold text-white"><Copy className="h-3.5 w-3.5" /> Copy message</button>
          <a href={whatsappLink(message)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 font-semibold text-white"><MessageCircle className="h-3.5 w-3.5" /> Send on WhatsApp</a>
        </div>
      </section>

      <section aria-label="Follow-ups" className={card}>
        <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-ink"><Mail className="h-4 w-4 text-brand-600" /> Who to follow up with</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {groups.map(([key, title, hint]) => {
            const rows = lists[key];
            return (
              <li key={key} className="rounded-xl border border-rule bg-white p-3" data-testid={`follow-${key}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-ink">{title}</div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">{rows.length}</span>
                </div>
                <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p>
                {rows.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <button type="button" onClick={() => copy(emailList(rows), `${rows.length} email${rows.length === 1 ? "" : "s"}`)} aria-label={`Copy emails: ${title}`} className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1.5 font-semibold text-white"><Copy className="h-3 w-3" /> Copy emails</button>
                    <button type="button" onClick={() => setOpen(open === key ? "" : key)} aria-expanded={open === key} className="rounded-lg border border-slate-300 px-2.5 py-1.5 font-semibold text-slate-700">{open === key ? "Hide" : "Show"} list</button>
                  </div>
                )}
                {open === key && <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-slate-700">{rows.map((c) => <li key={c.uid || c.email} className="break-all">{c.email}</li>)}</ul>}
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <section aria-label="Exports" className={card}>
          <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-ink"><Download className="h-4 w-4 text-brand-600" /> Export for your records</h2>
          <p className="mt-1 text-[11px] text-slate-500">Opens in Excel or Google Sheets. Contains sign-in emails and plan dates only.</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <button type="button" onClick={() => download("merident-clinics.csv", clinicsCsv(clinics))} disabled={!data} className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-700 disabled:opacity-50">Clinics (CSV)</button>
            <button type="button" onClick={() => download("merident-plan-requests.csv", requestsCsv(data ? data.requests : []))} disabled={!data} className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-700 disabled:opacity-50">Plan requests (CSV)</button>
          </div>
        </section>

        <section aria-label="Preferences" className={card}>
          <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-ink"><Settings2 className="h-4 w-4 text-brand-600" /> Dashboard settings</h2>
          <label htmlFor="admin-refresh" className="mt-3 block text-xs font-semibold text-slate-700">Refresh the numbers</label>
          <select id="admin-refresh" value={String(every)} onChange={(e) => onEvery(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm">
            {REFRESH_CHOICES.map(([ms, label]) => <option key={ms} value={ms}>{label}</option>)}
          </select>
          <p className="mt-1 text-[11px] text-slate-500">Saved on this device.</p>
        </section>
      </div>


      <div className="grid gap-5 md:grid-cols-2">
        <section aria-label="Your details" className={card}>
          <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-ink"><UserRound className="h-4 w-4 text-brand-600" /> Your details</h2>
          <label htmlFor="admin-name" className="mt-3 block text-xs font-semibold text-slate-700">Name used when you sign messages</label>
          <input id="admin-name" maxLength={60} value={details.name} onChange={(e) => setDetail("name", e.target.value)} placeholder="For example Santhoshkumar" className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" />
          <label htmlFor="admin-phone" className="mt-3 block text-xs font-semibold text-slate-700">Your WhatsApp number</label>
          <input id="admin-phone" type="tel" inputMode="tel" maxLength={20} value={details.phone} onChange={(e) => setDetail("phone", e.target.value.replace(/[^\d+ ]/g, ""))} placeholder="+91 ..." className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" />
          <p className="mt-1 text-[11px] text-slate-500">Saved in this browser only.</p>
        </section>

        <section aria-label="Security" className={card}>
          <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-ink"><ShieldCheck className="h-4 w-4 text-brand-600" /> Sign-in and security</h2>
          <dl className="mt-3 space-y-1.5 text-xs">
            {[["Signed in with", security.method], ["Email verified", security.verified ? "Yes" : "Not shown"], ["This sign-in", security.lastSignIn], ["Account created", security.created]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3"><dt className="text-slate-500">{k}</dt><dd className="font-semibold text-ink text-right">{v}</dd></div>
            ))}
          </dl>
          <p className="mt-3 text-[11px] text-slate-500">Admin access is checked on the server against the founder email list, so nobody else can open this page.</p>
        </section>
      </div>

      <section aria-label="Launch checklist" className={card}>
        <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-ink"><Rocket className="h-4 w-4 text-brand-600" /> Launch checklist</h2>
        <p className="mt-1 text-[11px] text-slate-500">{LAUNCH_ITEMS.filter(([id]) => launch[id]).length} of {LAUNCH_ITEMS.length} done. Saved in this browser only.</p>
        <ul className="mt-3 divide-y divide-rule">
          {LAUNCH_ITEMS.map(([id, text]) => (
            <li key={id} className="flex items-center gap-3 py-2 text-sm">
              <input type="checkbox" id={`launch-${id}`} checked={Boolean(launch[id])} onChange={() => tick(id)} className="h-4 w-4" />
              <label htmlFor={`launch-${id}`} className={`min-w-0 flex-1 break-words ${launch[id] ? "text-slate-400 line-through" : "text-ink"}`}>{text}</label>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="My to-do list" className={card}>
        <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-ink"><ListChecks className="h-4 w-4 text-brand-600" /> My to-do list</h2>
        <form onSubmit={add} className="mt-3 flex gap-2">
          <input aria-label="New to-do" maxLength={140} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="For example: call Smile Care about renewal" className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" />
          <button type="submit" className="inline-flex items-center gap-1 rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" /> Add</button>
        </form>
        {todos.length === 0 ? <p className="mt-3 text-xs text-slate-500">Nothing here yet. Add what you need to do next.</p> : (
          <ul className="mt-3 divide-y divide-rule">
            {todos.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-2 text-sm">
                <input type="checkbox" checked={t.done} aria-label={`Done: ${t.text}`} onChange={() => saveTodos(todos.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))} className="h-4 w-4" />
                <span className={`min-w-0 flex-1 break-words ${t.done ? "text-slate-400 line-through" : "text-ink"}`}>{t.text}</span>
                <button type="button" aria-label={`Remove: ${t.text}`} onClick={() => saveTodos(todos.filter((x) => x.id !== t.id))} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-[11px] text-slate-500">Saved in this browser only.</p>
      </section>

      <section aria-label="Private notes" className={card}>
        <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-ink"><StickyNote className="h-4 w-4 text-brand-600" /> Private notes</h2>
        <textarea aria-label="Private notes" rows={4} maxLength={2000} value={note} onChange={(e) => { setNote(e.target.value); writeLocal(NOTE_KEY, e.target.value); }} placeholder="Ideas, who you spoke to, pricing thoughts. Do not type patient details." className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" />
        <p className="mt-1 text-[11px] text-slate-500">{note.length}/2000. Saved in this browser only.</p>
      </section>
    </div>
  );
}
