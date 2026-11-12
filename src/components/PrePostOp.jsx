import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { MAX_IMAGES_PER_PATIENT, buildImageDoc, canAddMore, sortImages, prePostPair, prePostTeeth } from "../gallery.js";
import { formatDateLong, dateKey } from "../reminders.js";
import DmyDateInput from "./DmyDateInput.jsx";

const field = "px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-500 text-xs";

/** Add pre-op and post-op pictures for a patient and compare them side by side. Saved with the patient's photos and X-rays. */
export default function PrePostOp({ patient, api, compress, canWrite = true, authorName = "", showToast, newId }) {
  const [state, setState] = useState({ status: "loading", images: [] });
  const [tooth, setTooth] = useState("");
  const [takenOn, setTakenOn] = useState(dateKey());
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState("Pre-op");
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    try { setState({ status: "ready", images: sortImages(await api.list(patient.id)) }); } catch { setState({ status: "error", images: [] }); }
  }, [api, patient.id]);
  useEffect(() => { setState({ status: "loading", images: [] }); load(); }, [load]);

  const { images } = state;
  const [viewTooth, setViewTooth] = useState("");
  const teeth = useMemo(() => prePostTeeth(images), [images]);
  const { pre, post } = useMemo(() => prePostPair(images, viewTooth), [images, viewTooth]);

  const choose = (kind) => { setPending(kind); fileRef.current && fileRef.current.click(); };
  const onFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!canAddMore(images.length)) return showToast(`Up to ${MAX_IMAGES_PER_PATIENT} pictures per patient. Delete one in Photos and X-rays first.`);
    setBusy(true);
    try {
      const data = await compress(file);
      const r = buildImageDoc({ patientId: patient.id, kind: pending, caption: note, tooth, takenOn, data }, newId("IMG"), new Date(), authorName);
      if (!r.ok) return showToast(r.error);
      await api.add(r.image);
      setNote("");
      showToast(`${pending} picture saved`);
      await load();
    } catch (err) {
      showToast(err && err.message ? err.message : "Could not save the picture. Try again.");
    } finally { setBusy(false); }
  };

  if (!patient) return null;
  return (
    <section className="bg-white border border-rule rounded-xl p-4 space-y-3" aria-label="Pre-op and post-op" data-testid="pre-post-op">
      <div>
        <h2 className="text-sm font-bold text-slate-900">Pre-op and post-op</h2>
        <p className="text-[11px] text-slate-500">X-rays or photos before and after a treatment. They are also kept under Photos and X-rays in the patient's chart.</p>
      </div>

      {canWrite && (
        <div className="rounded-xl border border-rule bg-enamel p-3 space-y-2 text-xs">
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label htmlFor="pp-tooth" className="block text-[11px] font-semibold text-slate-600 mb-1">Tooth (optional)</label>
              <input id="pp-tooth" value={tooth} onChange={(e) => setTooth(e.target.value)} maxLength={20} placeholder="e.g. 36" className={`${field} w-24`} />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label htmlFor="pp-note" className="block text-[11px] font-semibold text-slate-600 mb-1">Note (optional)</label>
              <input id="pp-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={80} placeholder="e.g. Working length IOPA" className={`${field} w-full`} />
            </div>
            <div>
              <label htmlFor="pp-date" className="block text-[11px] font-semibold text-slate-600 mb-1">Taken on</label>
              <DmyDateInput id="pp-date" ariaLabel="Taken on (dd/mm/yyyy)" max={dateKey()} value={takenOn} onChange={setTakenOn} className={`${field} w-32`} />
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" aria-label="Choose a picture" onChange={onFile} className="hidden" />
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => choose("Pre-op")} className="px-3 py-2 rounded-lg bg-[#1d4ed8] hover:bg-blue-700 disabled:opacity-60 text-white font-semibold inline-flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" /> {busy && pending === "Pre-op" ? "Saving…" : "Add pre-op"}
            </button>
            <button type="button" disabled={busy} onClick={() => choose("Post-op")} className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold inline-flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" /> {busy && pending === "Post-op" ? "Saving…" : "Add post-op"}
            </button>
          </div>
        </div>
      )}

      {state.status === "loading" && <p role="status" className="text-xs text-slate-500">Loading pictures…</p>}
      {state.status === "error" && <p role="alert" className="text-xs text-amber-900 rounded-lg border border-amber-300 bg-amber-50 p-3">Could not load pictures. Check your connection and reload.</p>}

      {state.status === "ready" && (
        <>
          {teeth.length > 0 && (
            <label className="block text-[11px] font-semibold text-slate-600">Compare for tooth
              <select value={viewTooth} onChange={(e) => setViewTooth(e.target.value)} className={`${field} ml-2`} aria-label="Compare for tooth">
                <option value="">Latest of each</option>
                {teeth.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
          )}
          {pre || post ? (
            <div className="grid grid-cols-2 gap-2">
              {[["Pre-op", pre], ["Post-op", post]].map(([t, i]) => (
                <figure key={t} className="space-y-1">
                  {i ? <img src={i.data} alt={`${t}${i.tooth ? `, tooth ${i.tooth}` : ""}`} className="w-full rounded-lg border border-rule" /> : <div className="rounded-lg border border-dashed border-rule p-6 text-center text-[11px] text-slate-500">No {t.toLowerCase()} picture yet</div>}
                  <figcaption className="text-[11px] text-slate-600"><strong>{t}</strong>{i ? ` · ${formatDateLong(i.takenOn)}${i.tooth ? ` · tooth ${i.tooth}` : ""}${i.caption ? ` · ${i.caption}` : ""}` : ""}</figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-rule p-4 text-center text-xs text-slate-500">No pre-op or post-op pictures yet. Add a pre-op picture before treatment and a post-op picture after.</p>
          )}
        </>
      )}
    </section>
  );
}
