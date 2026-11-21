import React, { useCallback, useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { MAX_IMAGES_PER_PATIENT, buildImageDoc, canAddMore, sortImages, batchPlan, fileDateKey, recentImageFiles } from "../gallery.js";
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
  const [folder, setFolder] = useState(null); // { name, files } picked from the RVG export folder
  const [picked, setPicked] = useState({});
  const canPickFolder = typeof window !== "undefined" && typeof window.showDirectoryPicker === "function";
  const pickFolder = async () => {
    try {
      const dir = await window.showDirectoryPicker({ mode: "read" });
      const found = [];
      for await (const [, handle] of dir.entries()) {
        if (handle.kind === "file") { try { found.push(await handle.getFile()); } catch { /* skip unreadable file */ } }
      }
      const files = recentImageFiles(found);
      setFolder({ name: dir.name, files });
      setPicked(Object.fromEntries(files.map((f, i) => [i, true])));
    } catch (err) {
      if (!err || err.name !== "AbortError") showToast("Could not open that folder. Use Choose pictures instead.");
    }
  };
  const addFromFolder = async () => {
    const chosen = folder.files.filter((_, i) => picked[i]);
    await importFiles(chosen);
    setFolder(null);
  };

  const load = useCallback(async () => {
    try { setState({ status: "ready", images: sortImages(await api.list(patient.id)).filter((i) => RADIOGRAPH_KINDS.includes(i.kind)) }); } catch { setState({ status: "error", images: [] }); }
  }, [api, patient.id]);
  useEffect(() => { setState({ status: "loading", images: [] }); load(); }, [load]);

  const { images } = state;
  const onFile = async (e) => {
    const files = Array.from((e.target.files) || []);
    e.target.value = "";
    await importFiles(files);
  };
  const importFiles = async (files) => {
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
          <button type="button" onClick={() => setShowForm((v) => !v)} className="shrink-0 px-3 py-2 rounded-lg bg-[#0f172a] hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        )}
      </div>

      {canWrite && showForm && (
        <div className="rounded-xl border border-rule bg-enamel p-3 space-y-2 text-xs">
          <div role="group" aria-label="Type of radiograph" className="flex flex-wrap gap-1.5">
            {RADIOGRAPH_KINDS.map((k) => (
              <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${kind === k ? "bg-[#0f172a] text-white border-transparent" : "bg-white text-slate-700 border-slate-300"}`}>{k}</button>
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
          {canPickFolder && (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-2.5 space-y-2">
              <button type="button" disabled={busy} onClick={pickFolder} className="px-3 py-2 rounded-lg border border-blue-600 text-blue-700 font-semibold disabled:opacity-60">Pick my RVG folder</button>
              <p className="text-[11px] text-slate-500">Choose the folder your RVG software saves to. MeriDent lists pictures saved in the last 3 days. It only reads the files you tick.</p>
              {folder && (folder.files.length === 0
                ? <p role="status" className="text-[11px] text-amber-800">No pictures from the last 3 days in "{folder.name}".</p>
                : (
                  <div>
                    <ul aria-label="Recent pictures in the folder" className="max-h-40 overflow-y-auto divide-y divide-rule">
                      {folder.files.map((f, i) => (
                        <li key={`${f.name}-${i}`} className="flex items-center gap-2 py-1">
                          <input type="checkbox" id={`rvg-${i}`} checked={!!picked[i]} onChange={() => setPicked({ ...picked, [i]: !picked[i] })} />
                          <label htmlFor={`rvg-${i}`} className="min-w-0 flex-1 truncate">{f.name}</label>
                          <span className="text-[11px] text-slate-500">{new Date(f.lastModified).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>
                        </li>
                      ))}
                    </ul>
                    <button type="button" disabled={busy || !Object.values(picked).some(Boolean)} onClick={addFromFolder} className="mt-2 px-3 py-2 rounded-lg bg-emerald-600 text-white font-semibold disabled:opacity-60">Add ticked pictures as {kind}</button>
                  </div>
                ))}
            </div>
          )}
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
