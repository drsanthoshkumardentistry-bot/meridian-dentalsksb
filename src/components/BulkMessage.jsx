import { useMemo, useState } from "react";
import { Send, X, Check } from "lucide-react";
import { GROUPS, TEMPLATES, groupRecipients, messageLink, fillMessage } from "../bulkMessage.js";

export default function BulkMessage({ patients, shown, appointments, invoices, clinicName, onClose }) {
  const [group, setGroup] = useState("shown");
  const [text, setText] = useState(TEMPLATES[0].text);
  const [sent, setSent] = useState(() => new Set());
  const { recipients, skipped } = useMemo(
    () => groupRecipients(group, { patients, shown, appointments, invoices }),
    [group, patients, shown, appointments, invoices]
  );
  const ready = text.trim().length > 0;
  const send = (p) => {
    const link = messageLink(p, text, clinicName);
    if (!link) return;
    window.open(link, "_blank", "noopener,noreferrer");
    setSent((s) => new Set(s).add(String(p.id)));
  };
  const first = recipients.find((p) => !sent.has(String(p.id)));
  return (
    <div role="dialog" aria-modal="true" aria-label="Message a group of patients" className="fixed inset-0 z-50 bg-slate-900/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Message a group</h2>
            <p className="text-xs text-slate-500">Pick a group, write one message, then send to each patient with one tap. Only patients with a valid mobile and WhatsApp allowed are listed.</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>
        <label className="block text-xs font-semibold text-slate-700">Who to message
          <select value={group} onChange={(e) => { setGroup(e.target.value); setSent(new Set()); }} className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-normal">
            {GROUPS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
          </select>
        </label>
        <div>
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {TEMPLATES.map((t) => <button key={t.id} type="button" onClick={() => setText(t.text)} className="px-2.5 py-1 rounded-full border border-slate-300 text-xs text-slate-600 hover:bg-blue-50">{t.label}</button>)}
          </div>
          <label className="block text-xs font-semibold text-slate-700">Message
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-normal focus:outline-none" />
          </label>
          <p className="text-[11px] text-slate-500 mt-1">{"{name}"} becomes the patient's name and {"{clinic}"} your clinic name.</p>
          {recipients[0] && ready && <p className="mt-1 text-xs rounded-lg bg-slate-50 border border-rule p-2 whitespace-pre-wrap" aria-label="Preview">{fillMessage(text, { patient: recipients[0], clinicName })}</p>}
        </div>
        <div className="text-xs text-slate-600" role="status">
          {recipients.length} {recipients.length === 1 ? "patient" : "patients"} to message{skipped ? `, ${skipped} skipped (no valid mobile or WhatsApp switched off)` : ""}. Sent: {sent.size}.
        </div>
        {first && ready && (
          <button type="button" onClick={() => send(first)} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#25D366] text-white text-xs font-semibold"><Send className="w-4 h-4" /> Send to next: {first.name}</button>
        )}
        <ul className="divide-y divide-rule border border-rule rounded-xl">
          {recipients.slice(0, 200).map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
              <span className="font-semibold text-slate-900 truncate">{p.name} <span className="font-normal text-slate-500">{p.phone}</span></span>
              {sent.has(String(p.id))
                ? <span className="inline-flex items-center gap-1 text-emerald-700"><Check className="w-3.5 h-3.5" /> Opened</span>
                : <button type="button" disabled={!ready} onClick={() => send(p)} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold disabled:opacity-50">WhatsApp</button>}
            </li>
          ))}
          {recipients.length === 0 && <li className="px-3 py-4 text-xs text-slate-500">Nobody in this group can be messaged right now.</li>}
        </ul>
      </div>
    </div>
  );
}
