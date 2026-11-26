import React, { useState } from "react";
import { Copy, MessageCircle } from "lucide-react";
import { TEMPLATES, fillTemplate, whatsappLink, readLocal, writeLocal } from "../adminTools.js";
import { clinicAction } from "../adminApi.js";
import { markPaid } from "../planApi.js";
import { PLANS } from "../plan.js";

const KEY = "merident.admin.clinicNotes";

/** Opens under a clinic card: copy the email, send a ready-made message, keep a private note about that clinic. */
export default function ClinicDetail({ clinic, onToast, onChanged, actionFn = clinicAction, planFn = markPaid }) {
  const id = String(clinic.uid || clinic.email);
  const [note, setNote] = useState(() => { const all = readLocal(KEY, {}); return String((all && typeof all === "object" && all[id]) || "").slice(0, 400); });
  const [tpl, setTpl] = useState(clinic.state === "expired" ? "renewal" : clinic.online ? "paid" : "quiet");
  const message = fillTemplate((TEMPLATES.find((t) => t[0] === tpl) || TEMPLATES[0])[2], {});
  const save = (v) => {
    setNote(v);
    const all = readLocal(KEY, {});
    const next = { ...(all && typeof all === "object" && !Array.isArray(all) ? all : {}), [id]: v };
    if (!v) delete next[id];
    writeLocal(KEY, next);
  };
  const [suspended, setSuspended] = useState(!!clinic.suspended);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState(clinic.plan || "standard");
  const [days, setDays] = useState("30");
  const run = async (fn, done) => {
    setBusy(true);
    try { const r = await fn(); onToast(done(r)); if (onChanged) onChanged(r); } catch (e) { onToast((e && e.message) || "Could not save."); } finally { setBusy(false); setConfirm(false); }
  };
  const flip = () => run(() => actionFn({ email: clinic.email, action: suspended ? "resume" : "suspend" }).then((r) => { setSuspended(!suspended); return r; }), () => (suspended ? "Clinic can sign in again." : "Clinic suspended."));
  const applyPlan = () => run(() => planFn({ email: clinic.email, plan, days: Number(days) }), () => "Plan saved. Refresh to see the new date.");
  const copy = async (text, what) => {
    try { await navigator.clipboard.writeText(text); onToast(`Copied ${what}.`); } catch { onToast("Could not copy. Select the text and copy it yourself."); }
  };
  return (
    <div className="mt-3 space-y-3 rounded-xl bg-slate-50 p-3 text-xs" data-testid="clinic-detail">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => copy(clinic.email, "the email")} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-semibold text-slate-700"><Copy className="h-3 w-3" /> Copy email</button>
      </div>
      <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-2.5" data-testid="clinic-controls">
        <div className="font-semibold text-slate-700">Account controls <span className="font-normal text-slate-500">(patient data is never opened)</span></div>
        <div className="flex flex-wrap items-end gap-2">
          <div><label htmlFor={`plan-${id}`} className="block text-slate-600">Plan</label>
            <select id={`plan-${id}`} value={plan} onChange={(e) => setPlan(e.target.value)} className="mt-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5">{PLANS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div><label htmlFor={`days-${id}`} className="block text-slate-600">Add days</label>
            <input id={`days-${id}`} type="number" inputMode="numeric" min="1" max="800" value={days} onChange={(e) => setDays(e.target.value.slice(0, 3))} className="mt-1 w-20 rounded-lg border border-slate-300 bg-white px-2 py-1.5" /></div>
          <button type="button" disabled={busy || !(Number(days) >= 1)} onClick={applyPlan} className="rounded-lg bg-brand-600 px-3 py-1.5 font-semibold text-white disabled:opacity-50">Apply plan</button>
        </div>
        <p className="text-[11px] text-slate-500">Adds paid days from today, or from the end of the current plan. Use it to give a free extension too.</p>
        {!confirm ? (
          <button type="button" disabled={busy} onClick={() => setConfirm(true)} className={`rounded-lg border px-3 py-1.5 font-semibold disabled:opacity-50 ${suspended ? "border-emerald-600 text-emerald-700" : "border-red-300 text-red-700"}`}>{suspended ? "Allow this clinic to sign in again" : "Suspend this clinic"}</button>
        ) : (
          <div role="alertdialog" aria-label="Confirm" className="rounded-lg bg-amber-50 p-2 text-amber-900">
            <p>{suspended ? "Let this clinic sign in again?" : "They will be signed out and cannot sign in until you allow it. Their data stays safe."}</p>
            <div className="mt-2 flex gap-2"><button type="button" disabled={busy} onClick={flip} className="rounded-lg bg-slate-900 px-3 py-1.5 font-semibold text-white">{suspended ? "Yes, allow" : "Yes, suspend"}</button><button type="button" onClick={() => setConfirm(false)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700">Cancel</button></div>
          </div>
        )}
        {suspended && <p className="font-semibold text-red-700">This clinic is suspended.</p>}
      </div>
      <div>
        <label htmlFor={`tpl-${id}`} className="block font-semibold text-slate-700">Message this clinic</label>
        <select id={`tpl-${id}`} value={tpl} onChange={(e) => setTpl(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5">{TEMPLATES.map(([k, label]) => <option key={k} value={k}>{label}</option>)}</select>
        <p className="mt-2 whitespace-pre-wrap rounded-lg bg-white p-2 text-slate-700">{message}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" onClick={() => copy(message, "the message")} className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1.5 font-semibold text-white"><Copy className="h-3 w-3" /> Copy message</button>
          <a href={whatsappLink(message)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 font-semibold text-white"><MessageCircle className="h-3 w-3" /> WhatsApp</a>
        </div>
      </div>
      <div>
        <label htmlFor={`note-${id}`} className="block font-semibold text-slate-700">Private note about this clinic</label>
        <textarea id={`note-${id}`} rows={2} maxLength={400} value={note} onChange={(e) => save(e.target.value)} placeholder="Who you spoke to, what they asked for" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5" />
        <p className="text-[11px] text-slate-500">Saved in this browser only. {note.length}/400</p>
      </div>
    </div>
  );
}
