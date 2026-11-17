import React, { useMemo, useState } from "react";
import { Copy, Download, Plus, Trash2, Hospital, LogOut, Mail, StickyNote, ListChecks, Settings2 } from "lucide-react";
import UserAvatar from "./UserAvatar.jsx";
import { clinicsCsv, requestsCsv, followUps, emailList, REFRESH_CHOICES, readLocal, writeLocal, cleanTodos } from "../adminTools.js";

const TODO_KEY = "merident.admin.todos";
const NOTE_KEY = "merident.admin.notes";
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
export default function AdminProfile({ user, email = "", data, now, every, onEvery, onToast, onOpenApp, onLogout }) {
  const t0 = now || Date.now();
  const clinics = data ? data.clinics : [];
  const lists = useMemo(() => followUps(clinics, t0), [clinics, t0]);
  const [todos, setTodos] = useState(() => cleanTodos(readLocal(TODO_KEY, [])));
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState(() => String(readLocal(NOTE_KEY, "")).slice(0, 2000));
  const [open, setOpen] = useState("");

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
