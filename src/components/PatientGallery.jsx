import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, FileCheck2, Trash2, X } from "lucide-react";
import { IMAGE_KINDS, NOC_KIND, MAX_IMAGES_PER_PATIENT, buildImageDoc, canAddMore, nocImages, sortImages, suggestPair } from "../gallery.js";
import { formatDateLong, dateKey } from "../reminders.js";
import DmyDateInput from "./DmyDateInput.jsx";

const field = "px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-500 text-xs";
const label = (i) => [i.kind, i.tooth && `tooth ${i.tooth}`, i.caption].filter(Boolean).join(" · ");

/** Photos and X-ray pictures for one patient, with a before and after comparison. */
export default function PatientGallery({ patient, api, compress, canWrite = true, authorName = "", showToast, newId }) {
  const [state, setState] = useState({ status: "loading", images: [] });
  const [form, setForm] = useState({ kind: "Before", caption: "", tooth: "", takenOn: dateKey() });
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(null);
  const [pairIds, setPairIds] = useState({ before: "", after: "" });
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    try { setState({ status: "ready", images: sortImages(await api.list(patient.id)) }); } catch { setState({ status: "error", images: [] }); }
  }, [api, patient.id]);
  useEffect(() => { setState({ status: "loading", images: [] }); load(); }, [load]);

  const { images } = state;
  const suggested = useMemo(() => suggestPair(images), [images]);
  const before = images.find((i) => i.id === (pairIds.before || suggested.before?.id));
  const after = images.find((i) => i.id === (pairIds.after || suggested.after?.id));
  const nocs = useMemo(() => nocImages(images), [images]);
  const isNoc = form.kind === NOC_KIND;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const startNoc = () => { setForm({ ...form, kind: NOC_KIND }); setTimeout(() => fileRef.current && fileRef.current.click(), 0); };

  const onFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!canAddMore(images.length)) return showToast(`Up to ${MAX_IMAGES_PER_PATIENT} pictures per patient. Delete one first.`);
    setBusy(true);
    try {
      const data = await compress(file);
      const r = buildImageDoc({ ...form, patientId: patient.id, data }, newId("IMG"), new Date(), authorName);
      if (!r.ok) return showToast(r.error);
      await api.add(r.image);
      setForm({ ...form, caption: "", tooth: "" });
      showToast("Picture saved");
      await load();
    } catch (err) {
      showToast(err && err.message ? err.message : "Could not save the picture. Try again.");
    } finally { setBusy(false); }
  };
  const remove = async (img) => {
    try { await api.remove(img.id); setOpen(null); showToast("Picture deleted"); await load(); } catch { showToast("Could not delete. Try again."); }
  };
  const Pick = ({ kind, value, onChange }) => (
    <select aria-label={`${kind} picture`} value={value} onChange={onChange} className={field}>
      <option value="">Choose {kind.toLowerCase()}</option>
      {images.map((i) => <option key={i.id} value={i.id}>{formatDateLong(i.takenOn)} · {label(i)}</option>)}
    </select>
  );

  return (
    <div className="space-y-4" data-testid="patient-gallery">
      <div>
        <div className="text-xs font-bold uppercase text-slate-800 tracking-wider">Photos and X-rays</div>
        <p className="text-[11px] text-slate-500 mt-0.5">Kept in your clinic's private records, shrunk to fit. Never shown on the patient portal.</p>
      </div>

      {canWrite && (
        <div className="rounded-xl border border-rule bg-enamel p-3 space-y-2 text-xs">
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label htmlFor="gal-kind" className="block text-[11px] font-semibold text-slate-600 mb-1">Shows</label>
              <select id="gal-kind" value={form.kind} onChange={set("kind")} className={field}>{IMAGE_KINDS.map((k) => <option key={k}>{k}</option>)}</select>
            </div>
            <div>
              <label htmlFor="gal-tooth" className="block text-[11px] font-semibold text-slate-600 mb-1">Tooth (optional)</label>
              <input id="gal-tooth" value={form.tooth} onChange={set("tooth")} maxLength={20} placeholder="e.g. 26" className={`${field} w-24`} />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label htmlFor="gal-caption" className="block text-[11px] font-semibold text-slate-600 mb-1">{isNoc ? "Physician and what it clears" : "Note (optional)"}</label>
              <input id="gal-caption" value={form.caption} onChange={set("caption")} maxLength={80} placeholder={isNoc ? "e.g. Dr Rao, cardiologist, fit for extraction" : "e.g. Before crown prep"} className={`${field} w-full`} />
            </div>
            <div>
              <label htmlFor="gal-date" className="block text-[11px] font-semibold text-slate-600 mb-1">{isNoc ? "Certificate dated" : "Taken on"}</label>
              <DmyDateInput id="gal-date" ariaLabel="Taken on (dd/mm/yyyy)" max={dateKey()} value={form.takenOn} onChange={(v) => setForm({ ...form, takenOn: v })} className={`${field} w-32`} />
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" aria-label="Choose a photo" onChange={onFile} className="hidden" />
          <button type="button" disabled={busy} onClick={() => fileRef.current && fileRef.current.click()} className="px-3 py-2 rounded-lg bg-[#1d4ed8] hover:bg-blue-700 disabled:opacity-60 text-white font-semibold inline-flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5" /> {busy ? "Saving…" : isNoc ? "Take or choose a photo of the NOC" : "Take or choose a photo"}
          </button>
          <button type="button" disabled={busy} onClick={startNoc} className="ml-2 px-3 py-2 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-60 text-emerald-900 font-semibold inline-flex items-center gap-1.5">
            <FileCheck2 className="w-3.5 h-3.5" /> Add physician NOC
          </button>
          <span className="ml-2 text-slate-500">{images.length} of {MAX_IMAGES_PER_PATIENT} used</span>
        </div>
      )}

      {state.status === "loading" && <p role="status" className="text-xs text-slate-500">Loading pictures…</p>}
      {state.status === "error" && <p role="alert" className="text-xs text-amber-900 rounded-lg border border-amber-300 bg-amber-50 p-3">Could not load pictures. Check your connection and reload.</p>}
      {state.status === "ready" && images.length === 0 && <p className="rounded-xl border border-dashed border-rule p-6 text-center text-xs text-slate-500">No pictures yet. Add a before photo, an X-ray or a physician NOC above.</p>}

      {nocs.length > 0 && (
        <section aria-label="Physician NOC" data-testid="noc-section" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 space-y-2">
          <div className="text-xs font-bold text-emerald-900 inline-flex items-center gap-1.5"><FileCheck2 className="w-3.5 h-3.5" /> Physician NOC on file ({nocs.length})</div>
          <ul className="flex flex-wrap gap-2">
            {nocs.map((i) => (
              <li key={i.id}>
                <button type="button" onClick={() => setOpen(i)} className="flex items-center gap-2 text-left rounded-lg border border-emerald-200 bg-white hover:border-emerald-400 p-1.5 pr-3">
                  <img src={i.data} alt={label(i)} className="w-12 h-12 object-cover rounded" loading="lazy" />
                  <span className="text-[11px]"><span className="block font-semibold text-slate-800">{i.caption || "Physician NOC"}</span><span className="block text-slate-500">{formatDateLong(i.takenOn)}</span></span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {images.length > 0 && (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2" aria-label="Pictures">
          {images.map((i) => (
            <li key={i.id}>
              <button type="button" onClick={() => setOpen(i)} className="block w-full text-left rounded-lg overflow-hidden border border-rule bg-white hover:border-blue-400">
                <img src={i.data} alt={label(i)} className="w-full h-28 object-cover" loading="lazy" />
                <span className="block px-2 py-1 text-[11px]"><span className="font-semibold text-slate-800">{label(i)}</span><span className="block text-slate-500">{formatDateLong(i.takenOn)}</span></span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {images.length > 1 && (
        <section className="rounded-xl border border-rule bg-white p-3 space-y-2" aria-label="Before and after">
          <div className="text-xs font-bold text-slate-800">Compare before and after</div>
          <div className="flex flex-wrap gap-2">
            <Pick kind="Before" value={before?.id || ""} onChange={(e) => setPairIds({ ...pairIds, before: e.target.value })} />
            <Pick kind="After" value={after?.id || ""} onChange={(e) => setPairIds({ ...pairIds, after: e.target.value })} />
          </div>
          {before && after ? (
            <div className="grid grid-cols-2 gap-2">
              {[["Before", before], ["After", after]].map(([t, i]) => (
                <figure key={t} className="space-y-1">
                  <img src={i.data} alt={`${t}: ${label(i)}`} className="w-full rounded-lg border border-rule" />
                  <figcaption className="text-[11px] text-slate-600"><strong>{t}</strong> · {formatDateLong(i.takenOn)}</figcaption>
                </figure>
              ))}
            </div>
          ) : <p className="text-[11px] text-slate-500">Choose a before and an after picture to see them side by side.</p>}
        </section>
      )}

      {open && (
        <div role="dialog" aria-modal="true" aria-label="Picture" className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4" onClick={() => setOpen(null)}>
          <div className="max-w-3xl w-full space-y-2" onClick={(e) => e.stopPropagation()}>
            <img src={open.data} alt={label(open)} className="w-full max-h-[75vh] object-contain rounded-lg bg-black" />
            <div className="flex items-center justify-between gap-2 text-white text-xs">
              <span>{label(open)} · {formatDateLong(open.takenOn)}{open.by ? ` · ${open.by}` : ""}</span>
              <span className="flex gap-2">
                {canWrite && <button type="button" onClick={() => remove(open)} className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 font-semibold inline-flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Delete</button>}
                <button type="button" onClick={() => setOpen(null)} aria-label="Close picture" className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 font-semibold inline-flex items-center gap-1"><X className="w-3.5 h-3.5" /> Close</button>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
