import React, { useMemo, useState } from "react";
import { FIELDS, GROUPS, newExam, setField, setMouthOpening, setNotes, findings, hasEntries, saveExam, changes } from "../extraoral.js";
import { formatDateLong } from "../reminders.js";

/** Extra-oral examination: face, jaw joints, lymph nodes, lips and skin, saved as dated exams. */
export default function ExtraOralExam({ exams = [], canWrite = true, onSave, newId, today, showToast }) {
  const [exam, setExam] = useState(() => (exams[0] ? exams[0] : newExam(newId(), today)));
  const [dirty, setDirty] = useState(false);
  const edit = (fn) => (...a) => { setExam((e) => fn(e, ...a)); setDirty(true); };
  const found = useMemo(() => findings(exam), [exam]);
  const prev = exams.find((e) => e.id !== exam.id && e.date <= exam.date);
  const diff = prev ? changes(prev, exam) : [];
  const save = () => {
    if (!hasEntries(exam)) return showToast("Record at least one finding first.");
    onSave(saveExam(exams, exam));
    setDirty(false);
    showToast("Extra-oral exam saved");
  };
  const sel = "px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-sm";
  return (
    <section className="space-y-4" aria-label="Extra-oral examination" data-testid="extra-oral">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <label className="font-semibold text-slate-600" htmlFor="eo-exam">Exam</label>
        <select id="eo-exam" className={sel} value={exam.id} onChange={(e) => { const f = exams.find((x) => x.id === e.target.value); if (f) { setExam(f); setDirty(false); } }}>
          {!exams.some((x) => x.id === exam.id) && <option value={exam.id}>New exam (unsaved)</option>}
          {exams.map((x) => <option key={x.id} value={x.id}>{formatDateLong(x.date)}</option>)}
        </select>
        {canWrite && <button type="button" onClick={() => { setExam(newExam(newId(), today)); setDirty(false); }} className="px-3 py-1.5 rounded-lg border border-rule font-semibold text-slate-700">New exam</button>}
        {canWrite && <button type="button" onClick={save} disabled={!dirty} className="px-3 py-1.5 rounded-lg bg-[#1d4ed8] disabled:opacity-50 text-white font-semibold">Save exam</button>}
      </div>

      <div className="rounded-xl border border-rule bg-white p-3 text-xs" data-testid="eo-summary">
        <div className="font-semibold text-slate-600 mb-1">Findings that differ from usual</div>
        {found.length === 0 ? <p className="text-slate-500">Nothing abnormal recorded.</p> : (
          <ul className="flex flex-wrap gap-2">{found.map((f) => <li key={f.label} className="rounded-full bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-1"><strong>{f.label}:</strong> {f.value}</li>)}</ul>
        )}
        {diff.length > 0 && <p className="mt-2 text-slate-600" data-testid="eo-compare">Since {formatDateLong(prev.date)}: {diff.map((d) => `${d.label} ${d.from.toLowerCase()} to ${d.to.toLowerCase()}`).join("; ")}.</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {GROUPS.map((g) => (
          <fieldset key={g} className="rounded-xl border border-rule bg-white p-3 space-y-2">
            <legend className="px-1 text-xs font-bold text-slate-700">{g}</legend>
            {FIELDS.filter((f) => f.group === g).map((f) => (
              <div key={f.key} className="flex items-center justify-between gap-3 text-sm">
                <label htmlFor={`eo-${f.key}`} className="text-slate-600">{f.label}</label>
                <select id={`eo-${f.key}`} disabled={!canWrite} className={sel} value={exam.fields[f.key] || ""} onChange={(e) => edit(setField)(f.key, e.target.value)}>
                  <option value="">Not recorded</option>
                  {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
            {g === "Jaw joint (TMJ)" && (
              <div className="flex items-center justify-between gap-3 text-sm">
                <label htmlFor="eo-opening" className="text-slate-600">Mouth opening (mm)</label>
                <input id="eo-opening" inputMode="numeric" maxLength={2} disabled={!canWrite} value={exam.mouthOpening == null ? "" : exam.mouthOpening} onChange={(e) => edit(setMouthOpening)(e.target.value)} className={`${sel} w-20 text-center`} />
              </div>
            )}
          </fieldset>
        ))}
      </div>
      <div>
        <label htmlFor="eo-notes" className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
        <textarea id="eo-notes" rows={2} disabled={!canWrite} value={exam.notes || ""} onChange={(e) => edit(setNotes)(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
      </div>
      <p className="text-[11px] text-slate-500">This records what you observed. Mouth opening under 35 mm is flagged as limited. The diagnosis stays with the dentist.</p>
    </section>
  );
}
