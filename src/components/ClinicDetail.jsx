import React, { useState } from "react";
import { Copy, MessageCircle } from "lucide-react";
import { TEMPLATES, fillTemplate, whatsappLink, readLocal, writeLocal } from "../adminTools.js";

const KEY = "merident.admin.clinicNotes";

/** Opens under a clinic card: copy the email, send a ready-made message, keep a private note about that clinic. */
export default function ClinicDetail({ clinic, onToast }) {
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
  const copy = async (text, what) => {
    try { await navigator.clipboard.writeText(text); onToast(`Copied ${what}.`); } catch { onToast("Could not copy. Select the text and copy it yourself."); }
  };
  return (
    <div className="mt-3 space-y-3 rounded-xl bg-slate-50 p-3 text-xs" data-testid="clinic-detail">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => copy(clinic.email, "the email")} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-semibold text-slate-700"><Copy className="h-3 w-3" /> Copy email</button>
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
