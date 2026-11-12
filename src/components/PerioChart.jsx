import React, { useMemo, useState } from "react";
import { UPPER, LOWER, SITES, newExam, setDepth, toggleBop, setMobility, summarize, compareExams, hasReadings, saveExam } from "../perio.js";
import { formatDateLong } from "../reminders.js";

const depthClass = (d) => (d == null ? "bg-white" : d >= 6 ? "bg-rose-100 text-rose-800 font-bold" : d >= 4 ? "bg-amber-100 text-amber-900 font-semibold" : "bg-emerald-50 text-emerald-800");

function Arch({ title, teeth, exam, canWrite, onDepth, onBop, onMob }) {
  const cell = (tooth, site) => {
    const v = (exam.teeth[tooth] || {}).pd?.[site];
    return (
      <input
        key={site}
        inputMode="numeric"
        maxLength={2}
        aria-label={`Tooth ${tooth} ${SITES[site]}`}
        disabled={!canWrite}
        value={v == null ? "" : v}
        onChange={(e) => onDepth(tooth, site, e.target.value)}
        className={`w-6 h-6 text-center text-[11px] border border-slate-200 rounded ${depthClass(v)}`}
      />
    );
  };
  return (
    <div className="overflow-x-auto">
      <div className="text-xs font-bold text-slate-700 mb-1">{title}</div>
      <table className="text-[11px] border-separate border-spacing-x-1.5 border-spacing-y-1">
        <thead>
          <tr><th className="text-left font-medium text-slate-500 pr-2"> </th>{teeth.map((t) => <th key={t} className="font-bold text-slate-800">{t}</th>)}</tr>
        </thead>
        <tbody>
          <tr><th className="text-left font-medium text-slate-500 pr-2 whitespace-nowrap">Cheek side</th>{teeth.map((t) => <td key={t}><div className="flex gap-0.5">{[0, 1, 2].map((s) => cell(t, s))}</div></td>)}</tr>
          <tr><th className="text-left font-medium text-slate-500 pr-2 whitespace-nowrap">Tongue / palate</th>{teeth.map((t) => <td key={t}><div className="flex gap-0.5">{[3, 4, 5].map((s) => cell(t, s))}</div></td>)}</tr>
          <tr><th className="text-left font-medium text-slate-500 pr-2">Bleeding</th>{teeth.map((t) => <td key={t} className="text-center"><input type="checkbox" disabled={!canWrite} aria-label={`Tooth ${t} bleeding`} checked={Boolean((exam.teeth[t] || {}).bop)} onChange={() => onBop(t)} /></td>)}</tr>
          <tr><th className="text-left font-medium text-slate-500 pr-2">Mobility</th>{teeth.map((t) => (
            <td key={t} className="text-center">
              <select disabled={!canWrite} aria-label={`Tooth ${t} mobility`} value={(exam.teeth[t] || {}).mob || 0} onChange={(e) => onMob(t, e.target.value)} className="w-9 text-[11px] border border-slate-200 rounded bg-white">
                {[0, 1, 2, 3].map((g) => <option key={g} value={g}>{g === 0 ? "-" : g}</option>)}
              </select>
            </td>
          ))}</tr>
        </tbody>
      </table>
    </div>
  );
}

/** Periodontal chart: probing depths in mm at six sites per tooth, bleeding on probing and mobility, saved as dated exams. */
export default function PerioChart({ exams = [], canWrite = true, onSave, newId, today, showToast }) {
  const [exam, setExam] = useState(() => (exams[0] ? exams[0] : newExam(newId(), today)));
  const [dirty, setDirty] = useState(false);
  const edit = (fn) => (...a) => { setExam((e) => fn(e, ...a)); setDirty(true); };
  const s = useMemo(() => summarize(exam), [exam]);
  const prev = exams.find((e) => e.id !== exam.id && e.date <= exam.date);
  const cmp = prev ? compareExams(prev, exam) : null;
  const save = () => {
    if (!hasReadings(exam)) return showToast("Enter at least one reading first.");
    onSave(saveExam(exams, exam));
    setDirty(false);
    showToast("Perio exam saved");
  };
  return (
    <section className="space-y-4" aria-label="Periodontal chart" data-testid="perio-chart">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <label className="font-semibold text-slate-600" htmlFor="perio-exam">Exam</label>
        <select id="perio-exam" className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white" value={exam.id} onChange={(e) => { const f = exams.find((x) => x.id === e.target.value); if (f) { setExam(f); setDirty(false); } }}>
          {!exams.some((x) => x.id === exam.id) && <option value={exam.id}>New exam (unsaved)</option>}
          {exams.map((x) => <option key={x.id} value={x.id}>{formatDateLong(x.date)}</option>)}
        </select>
        {canWrite && <button type="button" onClick={() => { setExam(newExam(newId(), today)); setDirty(false); }} className="px-3 py-1.5 rounded-lg border border-rule font-semibold text-slate-700">New exam</button>}
        {canWrite && <button type="button" onClick={save} disabled={!dirty} className="px-3 py-1.5 rounded-lg bg-[#1d4ed8] disabled:opacity-50 text-white font-semibold">Save exam</button>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs" data-testid="perio-summary">
        <div className="rounded-xl border border-rule bg-white p-3"><div className="text-slate-500">Sites measured</div><div className="text-lg font-bold tabular">{s.sites}</div></div>
        <div className="rounded-xl border border-rule bg-white p-3"><div className="text-slate-500">4 mm or deeper</div><div className="text-lg font-bold tabular text-amber-700">{s.sites4} <span className="text-xs font-medium text-slate-500">({s.pct4}%)</span></div></div>
        <div className="rounded-xl border border-rule bg-white p-3"><div className="text-slate-500">6 mm or deeper</div><div className="text-lg font-bold tabular text-rose-700">{s.sites6}</div></div>
        <div className="rounded-xl border border-rule bg-white p-3"><div className="text-slate-500">Teeth bleeding</div><div className="text-lg font-bold tabular">{s.bopTeeth} <span className="text-xs font-medium text-slate-500">({s.bopPct}%)</span></div></div>
        <div className="rounded-xl border border-rule bg-white p-3"><div className="text-slate-500">Deepest</div><div className="text-lg font-bold tabular">{s.deepest ? `${s.deepest.depth} mm` : "-"}</div>{s.deepest && <div className="text-[11px] text-slate-500">tooth {s.deepest.tooth}, {s.deepest.site}</div>}</div>
      </div>
      {cmp && (cmp.better + cmp.worse + cmp.same) > 0 && (
        <p className="text-xs text-slate-600" data-testid="perio-compare">Compared with {formatDateLong(prev.date)}: {cmp.better} site{cmp.better === 1 ? "" : "s"} shallower, {cmp.worse} deeper, {cmp.same} unchanged.</p>
      )}

      <Arch title="Upper teeth" teeth={UPPER} exam={exam} canWrite={canWrite} onDepth={edit(setDepth)} onBop={edit(toggleBop)} onMob={edit(setMobility)} />
      <Arch title="Lower teeth" teeth={LOWER} exam={exam} canWrite={canWrite} onDepth={edit(setDepth)} onBop={edit(toggleBop)} onMob={edit(setMobility)} />
      <p className="text-[11px] text-slate-500">Cheek side sites are distal, mid and mesial; tongue/palate side the same. Pocket depth in mm: green under 4, amber 4 to 5, red 6 or more. This records measurements. The diagnosis and treatment decision stay with the dentist.</p>
    </section>
  );
}
