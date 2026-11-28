import React, { useState, lazy, Suspense } from "react";
import DmyDateInput from "./DmyDateInput.jsx";
import { RESTORATIONS, MATERIALS, STAGES, STAGE_LABEL, STAGE_ACTION, validateCase, createCase, advanceCase, nextStage, attachScan } from "../cadcam.js";
import { dateKey } from "../reminders.js";

const StlViewer = lazy(() => import("./StlViewer.jsx"));
const field = "w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-aqua-400";
const blank = (now = new Date()) => ({ restoration: "Crown", material: "Zirconia", teeth: "", shade: "", scanner: "", software: "", mill: "", scannedOn: dateKey(now), note: "" });

/** A patient's chairside CAD/CAM work: scan, design, mill, finish and fit, with a 3D look at the scan. */
export default function CadCam({ patient, newId, onChange, canWrite = true }) {
  const cases = patient.cadCases || [];
  const [form, setForm] = useState(blank());
  const [error, setError] = useState("");
  const [viewing, setViewing] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    const err = validateCase(form);
    if (err) return setError(err);
    setError("");
    onChange([createCase(form, newId()), ...cases]);
    setForm(blank());
  };
  const update = (id, fn) => onChange(cases.map((c) => (c.id === id ? fn(c) : c)));

  return (
    <div className="space-y-4" data-testid="cadcam">
      {canWrite && (
        <form onSubmit={submit} noValidate aria-label="New CAD/CAM case" className="bg-white border border-rule rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Start a CAD/CAM case</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label htmlFor="cc-type" className="block text-xs font-semibold text-slate-600 mb-1">Restoration</label>
              <select id="cc-type" className={field} value={form.restoration} onChange={set("restoration")}>{RESTORATIONS.map((t) => <option key={t}>{t}</option>)}</select></div>
            <div><label htmlFor="cc-material" className="block text-xs font-semibold text-slate-600 mb-1">Material</label>
              <select id="cc-material" className={field} value={form.material} onChange={set("material")}>{MATERIALS.map((t) => <option key={t}>{t}</option>)}</select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label htmlFor="cc-teeth" className="block text-xs font-semibold text-slate-600 mb-1">Teeth</label>
                <input id="cc-teeth" className={field} value={form.teeth} onChange={set("teeth")} placeholder="e.g. 36" /></div>
              <div><label htmlFor="cc-shade" className="block text-xs font-semibold text-slate-600 mb-1">Shade</label>
                <input id="cc-shade" className={field} maxLength={20} value={form.shade} onChange={set("shade")} placeholder="e.g. A2" /></div>
            </div>
            <div><label htmlFor="cc-date" className="block text-xs font-semibold text-slate-600 mb-1">Scanned on</label>
              <DmyDateInput id="cc-date" ariaLabel="Scan date (dd/mm/yyyy)" className={field} value={form.scannedOn} onChange={(v) => setForm({ ...form, scannedOn: v })} /></div>
            <div><label htmlFor="cc-scanner" className="block text-xs font-semibold text-slate-600 mb-1">Scanner (optional)</label>
              <input id="cc-scanner" className={field} maxLength={60} value={form.scanner} onChange={set("scanner")} placeholder="e.g. Medit i700" /></div>
            <div><label htmlFor="cc-software" className="block text-xs font-semibold text-slate-600 mb-1">Design software (optional)</label>
              <input id="cc-software" className={field} maxLength={60} value={form.software} onChange={set("software")} placeholder="e.g. exocad" /></div>
            <div><label htmlFor="cc-mill" className="block text-xs font-semibold text-slate-600 mb-1">Mill (optional)</label>
              <input id="cc-mill" className={field} maxLength={60} value={form.mill} onChange={set("mill")} placeholder="e.g. in-house or lab name" /></div>
          </div>
          <div><label htmlFor="cc-note" className="block text-xs font-semibold text-slate-600 mb-1">Note (optional)</label>
            <textarea id="cc-note" rows={2} maxLength={300} className={field} value={form.note} onChange={set("note")} placeholder="Margin, bur, firing programme" /></div>
          {error && <p role="alert" className="text-xs text-rose-700 font-medium">{error}</p>}
          <button type="submit" className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold">Save case</button>
        </form>
      )}

      {cases.length === 0 ? (
        <p className="text-sm text-slate-500">No CAD/CAM cases for this patient yet.</p>
      ) : (
        <ul className="space-y-3">
          {cases.map((c) => {
            const step = STAGES.indexOf(c.stage);
            const next = nextStage(c);
            return (
              <li key={c.id} className="bg-white border border-rule rounded-xl p-4 space-y-3" data-testid="cadcam-case">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-bold text-slate-900">{c.restoration}, tooth {c.teeth}{c.shade ? `, shade ${c.shade}` : ""}</div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${c.stage === "fitted" ? "bg-emerald-50 text-emerald-700" : c.stage === "cancelled" ? "bg-slate-100 text-slate-600" : "bg-brand-50 text-brand-700"}`}>{STAGE_LABEL[c.stage]}</span>
                </div>
                <div className="text-xs text-slate-600">{c.material}{c.scanner ? ` · scanner ${c.scanner}` : ""}{c.software ? ` · ${c.software}` : ""}{c.mill ? ` · mill ${c.mill}` : ""}</div>
                {c.note && <div className="text-xs text-slate-600">{c.note}</div>}
                <ol className="grid grid-cols-5 gap-1" aria-label="Progress">
                  {STAGES.map((s, i) => (
                    <li key={s} className={`rounded-md px-1 py-1.5 text-center text-[10px] font-semibold ${c.stage !== "cancelled" && i <= step ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                      {STAGE_LABEL[s]}{c.dates?.[s] ? <div className="font-normal opacity-90">{c.dates[s]}</div> : null}
                    </li>
                  ))}
                </ol>
                {c.scanFile && <div className="text-xs text-slate-600">Scan viewed: {c.scanFile.name} ({c.scanFile.triangles.toLocaleString("en-IN")} triangles, {(c.scanFile.bytes / 1048576).toFixed(1)} MB)</div>}
                <div className="flex flex-wrap gap-2">
                  {canWrite && next && <button type="button" onClick={() => update(c.id, (x) => advanceCase(x, next))} className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-bold">{STAGE_ACTION[next]}</button>}
                  {canWrite && next && <button type="button" onClick={() => update(c.id, (x) => advanceCase(x, "cancelled"))} className="px-3 py-1.5 rounded-lg border border-rule text-xs font-bold text-slate-700">Cancel case</button>}
                  <button type="button" aria-expanded={viewing === c.id} onClick={() => setViewing(viewing === c.id ? null : c.id)} className="px-3 py-1.5 rounded-lg border border-rule text-xs font-bold text-slate-700">{viewing === c.id ? "Hide 3D scan" : "View 3D scan"}</button>
                </div>
                {viewing === c.id && (
                  <Suspense fallback={<p className="text-xs text-slate-500">Loading viewer</p>}>
                    <StlViewer onLoaded={canWrite ? (info) => update(c.id, (x) => attachScan(x, info)) : undefined} />
                  </Suspense>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
