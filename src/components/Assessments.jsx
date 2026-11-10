import React, { useState } from "react";
import { CARIES_FACTORS, BPE_SEXTANTS, BPE_CODES, buildAssessment, scoreCaries } from "../assessments.js";

const tone = { Low: "text-emerald-700 bg-emerald-50 border-emerald-200", Moderate: "text-amber-700 bg-amber-50 border-amber-200", High: "text-rose-700 bg-rose-50 border-rose-200" };
const fmt = (ymd) => new Date(`${ymd}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/** Caries risk and gum (BPE) screening, saved on the patient. */
export default function Assessments({ patient, onSave, onRemove, newId }) {
  const [caries, setCaries] = useState({});
  const [bpe, setBpe] = useState({});
  const [error, setError] = useState("");
  const live = scoreCaries(caries);
  const history = patient.assessments || [];

  const saveCaries = () => { setError(""); onSave(buildAssessment("caries", caries, newId("AS")).assessment); setCaries({}); };
  const saveBpe = () => {
    const b = buildAssessment("bpe", bpe, newId("AS"));
    if (!b.ok) { setError(b.error); return; }
    setError(""); onSave(b.assessment); setBpe({});
  };

  return (
    <div className="space-y-5" data-testid="assessments">
      <div className="grid lg:grid-cols-2 gap-4">
        <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-xs space-y-3" aria-label="Caries risk">
          <h3 className="text-sm font-bold text-slate-900">Caries risk</h3>
          {CARIES_FACTORS.map((f) => (
            <label key={f.id} className="flex items-start gap-2 text-slate-700">
              <input type="checkbox" checked={Boolean(caries[f.id])} onChange={(e) => setCaries({ ...caries, [f.id]: e.target.checked })} className="mt-0.5" />
              <span>{f.label}</span>
            </label>
          ))}
          <div className={`rounded-lg border px-3 py-2 font-semibold ${tone[live.level]}`}>
            {live.level} risk · recall every {live.recallMonths} months
            <ul className="font-normal mt-1 list-disc ml-4">{live.advice.map((a) => <li key={a}>{a}</li>)}</ul>
          </div>
          <button type="button" onClick={saveCaries} className="px-4 py-2 rounded-lg bg-[#1d4ed8] text-white font-semibold">Save caries risk</button>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-xs space-y-3" aria-label="Gum screening (BPE)">
          <h3 className="text-sm font-bold text-slate-900">Gum screening (BPE)</h3>
          <p className="text-slate-500">Score the worst reading in each sextant. Use * if there is furcation involvement.</p>
          <div className="grid grid-cols-2 gap-2">
            {BPE_SEXTANTS.map((s) => (
              <div key={s.id}>
                <label htmlFor={`bpe-${s.id}`} className="block font-semibold text-slate-600 mb-1">{s.label}</label>
                <select id={`bpe-${s.id}`} value={bpe[s.id] ?? ""} onChange={(e) => setBpe({ ...bpe, [s.id]: e.target.value })} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white">
                  <option value="">Score</option>
                  {BPE_CODES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            ))}
          </div>
          <button type="button" onClick={saveBpe} className="px-4 py-2 rounded-lg bg-[#1d4ed8] text-white font-semibold">Save gum screening</button>
        </section>
      </div>
      {error && <p role="alert" className="text-xs text-rose-600 font-medium">{error}</p>}
      <p className="text-[11px] text-slate-400">Screening aids only. The dentist makes the final diagnosis.</p>

      <section aria-label="Assessment history" className="space-y-2">
        <h3 className="text-sm font-bold text-slate-900">History</h3>
        {history.length === 0 ? <p className="text-xs text-slate-500">No assessments saved yet.</p> : history.map((a) => (
          <div key={a.id} className="rounded-xl border border-slate-200 p-3 text-xs flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold text-slate-900">{a.type === "caries" ? `Caries risk: ${a.result.level}` : `BPE: highest score ${a.result.highest}${a.result.furcation ? " (furcation)" : ""}`} <span className="font-normal text-slate-500">· {fmt(a.date)}</span></div>
              <div className="text-slate-600 mt-0.5">{a.type === "caries" ? `Recall every ${a.result.recallMonths} months. ${a.result.advice.join(". ")}.` : a.result.guidance}</div>
            </div>
            <button type="button" onClick={() => onRemove(a)} aria-label="Delete assessment" className="text-slate-400 hover:text-rose-600 font-semibold">Delete</button>
          </div>
        ))}
      </section>
    </div>
  );
}
