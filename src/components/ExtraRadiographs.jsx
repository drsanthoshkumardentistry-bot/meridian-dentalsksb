import React, { useCallback, useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { MAX_IMAGES_PER_PATIENT, buildImageDoc, canAddMore, sortImages, batchPlan, fileDateKey } from "../gallery.js";
import { formatDateLong, dateKey } from "../reminders.js";
import DmyDateInput from "./DmyDateInput.jsx";

export const RADIOGRAPH_KINDS = ["OPG", "IOPA", "CBCT", "X-ray"];
const field = "px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-500 text-xs";

/** Add more radiographs (OPG, IOPA, CBCT, other X-ray) for a patient. Kept with the patient's Photos and X-rays. */
export default function ExtraRadiographs({ patient, api, compress, canWrite = true, authorName = "", showToast, newId }) {
  const [state, setState] = useState({ status: "loading", images: [] });
  const [kind, setKind] = useState("IOPA");
  const [tooth, setTooth] = useState("");
  const [takenOn, setTakenOn] = useState(dateKey());
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [useFileDates, setUseFileDates] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [open, setOpen] = useState(null);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    try { setState({ status: "ready", images: sortImages(await api.list(patient.id)).filter((i) => RADIOGRAPH_KINDS.includes(i.kind)) }); } catch { setState({ status: "error", images: [] }); }
  }, [api, patient.id]);
  useEffect(() => { setState({ status: "loading", images: [] }); load(); }, [load]);

  const { images } = state;
  const onFile = async (e) => {
    const files = Array.from((e.target.files) || []);
    e.target.value = "";
    if (!files.length) return;
    const { take, skipped } = batchPlan(files, images.length);
    if (!take.length) return showToast(`Up to ${MAX_IMAGES_PER_PATIENT} pictures per patient. Delete one in Photos and X-rays first.`);
    setBusy(true);
    let saved = 0;
    let failed = 0;
    let lastError = "";
    for (const file of take) {
      try {
        const data = await compress(file);
        const day = take.length > 1 && useFileDates ? fileDateKey(file) : takenOn;
        const r = buildImageDoc({ patientId: patient.id, kind, caption: take.length > 1 ? "" : note, tooth: take.length > 1 ? "" : tooth, takenOn: day, data }, newId("IMG"), new Date(), authorName);
        if (!r.ok) { failed += 1; lastError = r.error; continue; }
        await api.add(r.image);
        saved += 1;
      } catch (err) {
        failed += 1;
        lastError = err && err.message ? err.message : "Could not save the picture. Try again.";
      }
    }
    if (saved) { setNote(""); setShowForm(false); await load(); }
    setBusy(false);
    if (files.length === 1) return showToast(saved ? `${kind} saved` : lastError);
    const parts = [`Saved ${saved} of ${files.length} pictures`];
    if (skipped) parts.push(`${skipped} not added because the limit is ${MAX_IMAGES_PER_PATIENT} per patient`);
    if (failed) parts.push(`${failed} failed: ${lastError}`);
    showToast(parts.join(". ") + ".");
  };

  if (!patient) return null;
  return (
    <section className="bg-white border border-rule rounded-xl p-4 space-y-3" aria-label="More radiographs" data-testid="extra-radiographs">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-900">More radiographs</h2>
          <p className="text-[11px] text-slate-500">Add another OPG, IOPA, CBCT or X-ray. They are also kept under Photos and X-rays in the patient's chart.</p>
        </div>
        {canWrite && (
          <button type="button" onClick={() => setShowForm((v) => !v)} className="shrink-0 px-3 py-2 rounded-lg bg-[#1d4ed8] hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        )}
      </div>

      {canWrite && showForm && (
        <div className="rounded-xl border border-rule bg-enamel p-3 space-y-2 text-xs">
          <div role="group" aria-label="Type of radiograph" className="flex flex-wrap gap-1.5">
            {RADIOGRAPH_KINDS.map((k) => (
              <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${kind === k ? "bg-[#1d4ed8] text-white border-transparent" : "bg-white text-slate-700 border-slate-300"}`}>{k}</button>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label htmlFor="xr-tooth" className="block text-[11px] font-semibold text-slate-600 mb-1">Tooth (optional)</label>
              <input id="xr-tooth" value={tooth} onChange={(e) => setTooth(e.target.value)} maxLength={20} placeholder="e.g. 36" className={`${field} w-24`} />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label htmlFor="xr-note" className="block text-[11px] font-semibold text-slate-600 mb-1">Note (optional)</label>
              <input id="xr-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={80} placeholder="e.g. Working length" className={`${field} w-full`} />
            </div>
            <div>
              <label htmlFor="xr-date" className="block text-[11px] font-semibold text-slate-600 mb-1">Taken on</label>
              <DmyDateInput id="xr-date" ariaLabel="Taken on (dd/mm/yyyy)" max={dateKey()} value={takenOn} onChange={setTakenOn} className={`${field} w-32`} />
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple aria-label="Choose a radiograph" onChange={onFile} className="hidden" />
          <button type="button" disabled={busy} onClick={() => fileRef.current && fileRef.current.click()} className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold">
            {busy ? "Saving…" : `Choose ${kind} pictures`}
          </button>
          <label className="flex items-center gap-2 text-[11px] text-slate-600"><input type="checkbox" checked={useFileDates} onChange={(e) => setUseFileDates(e.target.checked)} /> When I choose several, use the date each file was saved (RVG software stamps it at capture)</label>
          <p className="text-[11px] text-slate-500">Export from your RVG software to a folder, then select all the images at once. Tooth and note apply when you add one picture.</p>
        </div>
      )}

      {state.status === "loading" && <p role="status" className="text-xs text-slate-500">Loading pictures…</p>}
      {state.status === "error" && <p role="alert" className="text-xs text-amber-900 rounded-lg border border-amber-300 bg-amber-50 p-3">Could not load pictures. Check your connection and reload.</p>}
      {state.status === "ready" && (images.length === 0
        ? <p className="rounded-xl border border-dashed border-rule p-4 text-center text-xs text-slate-500">No extra radiographs yet. Use Add to attach an OPG, IOPA, CBCT or X-ray.</p>
        : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {images.map((i) => (
              <li key={i.id}>
                <button type="button" onClick={() => setOpen(i)} className="block w-full text-left space-y-1">
                  <img src={i.data} alt={`${i.kind}${i.tooth ? `, tooth ${i.tooth}` : ""}`} className="w-full h-24 object-cover rounded-lg border border-rule bg-black" />
                  <span className="block text-[11px] text-slate-600"><strong>{i.kind}</strong> · {formatDateLong(i.takenOn)}{i.tooth ? ` · tooth ${i.tooth}` : ""}</span>
                </button>
              </li>
            ))}
          </ul>
        ))}

      {open && (
        <div role="dialog" aria-label={`${open.kind} picture`} className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setOpen(null)}>
          <button type="button" aria-label="Close picture" onClick={() => setOpen(null)} className="absolute top-4 right-4 p-2 rounded-full bg-white/90"><X className="w-5 h-5" /></button>
          <img src={open.data} alt={open.kind} className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </section>
  );
}
