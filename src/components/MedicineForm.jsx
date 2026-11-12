import React, { useEffect, useState } from "react";
import { cleanMedicine, FREQUENCY_HINTS, DURATION_HINTS } from "../medicines.js";

const empty = { name: "", generic: "", dosage: "1 Tab", frequency: "", duration: "", instruction: "After food" };
const input = "w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-500";

/** One medicine: name, generic, dose, how often, how long, instruction. Used for the clinic list and for a prescription line. */
export default function MedicineForm({ initial, submitLabel = "Save", onSubmit, onCancel, saveToListOption = false, idPrefix = "med" }) {
  const [f, setF] = useState({ ...empty, ...(initial || {}) });
  const [saveToList, setSaveToList] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { setF({ ...empty, ...(initial || {}) }); setError(""); }, [initial]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    const r = cleanMedicine(f, initial?.id);
    if (!r.ok) return setError(r.error);
    setError("");
    onSubmit(r.med, saveToList);
    if (!initial) { setF({ ...empty }); setSaveToList(false); }
  };
  const field = (k, label, props = {}) => (
    <div>
      <label htmlFor={`${idPrefix}-${k}`} className="block text-[11px] font-semibold text-slate-600 mb-1">{label}</label>
      <input id={`${idPrefix}-${k}`} value={f[k]} onChange={set(k)} className={input} {...props} />
    </div>
  );
  return (
    <form onSubmit={submit} noValidate className="space-y-2 text-xs" aria-label="Medicine details">
      <div className="grid sm:grid-cols-2 gap-2">
        {field("name", "Medicine name", { placeholder: "e.g. Dolo 650" })}
        {field("generic", "Generic / composition (optional)", { placeholder: "e.g. Paracetamol 650mg" })}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {field("dosage", "Dose", { placeholder: "1 Tab" })}
        {field("frequency", "How often", { list: `${idPrefix}-freq`, placeholder: "1-0-1" })}
        {field("duration", "For how long", { list: `${idPrefix}-dur`, placeholder: "5 Days" })}
        {field("instruction", "Instruction", { placeholder: "After food" })}
      </div>
      <datalist id={`${idPrefix}-freq`}>{FREQUENCY_HINTS.map((h) => <option key={h} value={h} />)}</datalist>
      <datalist id={`${idPrefix}-dur`}>{DURATION_HINTS.map((h) => <option key={h} value={h} />)}</datalist>
      {saveToListOption && !initial && (
        <label className="flex items-center gap-2 text-slate-600"><input type="checkbox" checked={saveToList} onChange={(e) => setSaveToList(e.target.checked)} /> Also save to my medicine list for next time</label>
      )}
      {error && <p role="alert" className="text-rose-700 font-semibold">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" className="px-3 py-1.5 rounded-lg bg-[#1d4ed8] hover:bg-blue-700 text-white font-semibold">{submitLabel}</button>
        {onCancel && <button type="button" onClick={onCancel} className="px-3 py-1.5 rounded-lg border border-rule text-slate-600 font-semibold">Cancel</button>}
      </div>
    </form>
  );
}
