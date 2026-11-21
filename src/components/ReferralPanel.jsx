import { useState } from "react";
import { Printer, Trash2 } from "lucide-react";
import { DEPARTMENTS, URGENCY, STATUSES, cleanReferral, statusOf, urgencyOf } from "../referrals.js";

const input = "w-full px-3 py-1.5 rounded-lg border border-rule bg-white";
const urgencyTone = { Routine: "bg-slate-100 text-slate-700", Urgent: "bg-amber-100 text-amber-800", Emergency: "bg-rose-100 text-rose-700" };
const statusTone = { Pending: "bg-blue-50 text-blue-700 border-blue-200", Seen: "bg-amber-50 text-amber-700 border-amber-200", Completed: "bg-emerald-50 text-emerald-700 border-emerald-200", Declined: "bg-slate-100 text-slate-600 border-slate-200" };
const blank = { treatment: "", toothRegion: "", department: "CONS", outside: "", urgency: "Routine", note: "" };

export default function ReferralPanel({ referrals = [], canWrite = true, onAdd, onStatus, onRemove, onPrint, newId, today }) {
  const [f, setF] = useState(blank);
  const [error, setError] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    const r = cleanReferral(f, { id: newId(), today: today() });
    if (!r.ok) return setError(r.error);
    setError("");
    onAdd(r.referral);
    setF({ ...blank, department: f.department });
  };
  return (
    <div className="space-y-4">
      {canWrite && (
        <form onSubmit={submit} noValidate aria-label="New referral" className="p-4 rounded-xl bg-enamel border border-rule space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2"><label htmlFor="ref-treatment" className="font-bold text-slate-600 block mb-1">Treatment needed</label>
              <input id="ref-treatment" className={input} placeholder="e.g. Extraction, scaling, root canal" value={f.treatment} onChange={set("treatment")} /></div>
            <div><label htmlFor="ref-tooth" className="font-bold text-slate-600 block mb-1">Tooth / region</label>
              <input id="ref-tooth" className={input} placeholder="e.g. 18 or 46" value={f.toothRegion} onChange={set("toothRegion")} /></div>
            <div><label htmlFor="ref-urgency" className="font-bold text-slate-600 block mb-1">Urgency</label>
              <select id="ref-urgency" className={input} value={f.urgency} onChange={set("urgency")}>{URGENCY.map((u) => <option key={u}>{u}</option>)}</select></div>
            <div><label htmlFor="ref-dept" className="font-bold text-slate-600 block mb-1">Department</label>
              <select id="ref-dept" className={input} value={f.department} onChange={set("department")}>
                {DEPARTMENTS.map((d) => <option key={d.id} value={d.code}>{d.code} ({d.room})</option>)}
                <option value="">Outside specialist</option>
              </select></div>
            {f.department === "" && (
              <div className="sm:col-span-3"><label htmlFor="ref-outside" className="font-bold text-slate-600 block mb-1">Specialist or hospital</label>
                <input id="ref-outside" className={input} placeholder="e.g. Dr. Rao, OMFS, City Hospital" value={f.outside} onChange={set("outside")} /></div>
            )}
          </div>
          <div><label htmlFor="ref-note" className="font-bold text-slate-600 block mb-1">Reason and notes (optional)</label>
            <textarea id="ref-note" rows={2} className={input} placeholder="Why the patient is being referred, findings, anything the specialist should know" value={f.note} onChange={set("note")} /></div>
          {error && <p role="alert" className="text-rose-700 font-semibold">{error}</p>}
          <button type="submit" className="px-4 py-1.5 rounded-lg bg-[#1d4ed8] text-white font-bold">Add referral</button>
        </form>
      )}
      <div className="space-y-2">
        {(referrals = referrals.filter((r) => r && typeof r === "object")).length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-enamel rounded-xl">No referrals yet. Send this patient to another department or an outside specialist above.</div>
        ) : referrals.map((r, i) => (
          <div key={r.id || i} className="p-3 rounded-xl border border-rule bg-white text-xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-bold text-slate-900">{r.treatment}</span>
                <span className="text-slate-500 ml-2">Tooth/region: <strong>{r.toothRegion}</strong></span>
                <span className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold ${urgencyTone[urgencyOf(r)]}`}>{urgencyOf(r)}</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-semibold">{r.department}{r.roomNo && r.roomNo !== "Outside" ? ` (${r.roomNo})` : ""}</span>
            </div>
            {r.note && <p className="text-slate-600 whitespace-pre-line">{r.note}</p>}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-slate-500">Referred {r.date}{r.closedDate ? `, closed ${r.closedDate}` : ""}</span>
              <div className="flex items-center gap-2">
                {canWrite ? (
                  <select aria-label={`Status of referral for ${r.treatment}`} value={statusOf(r)} onChange={(e) => onStatus(r.id, e.target.value)} className={`px-2 py-1 rounded border font-semibold ${statusTone[statusOf(r)]}`}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                ) : <span className={`px-2 py-1 rounded border font-semibold ${statusTone[statusOf(r)]}`}>{statusOf(r)}</span>}
                <button type="button" aria-label={`Print referral slip for ${r.treatment}`} onClick={() => onPrint(r)} className="p-1.5 rounded-lg border border-rule text-slate-600 hover:bg-slate-50"><Printer className="w-3.5 h-3.5" /></button>
                {canWrite && <button type="button" aria-label={`Remove referral for ${r.treatment}`} onClick={() => onRemove(r.id)} className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5" /></button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
