import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { rxSetsOf, saveRxSet, removeRxSet, resetRxSets, newLinesFromSet } from "../rxSets.js";

/** One-tap prescription sets, plus saving the current slip as a new set. */
export default function RxSets({ profile, onProfile, slip, onApply, newId, showToast }) {
  const sets = rxSetsOf(profile);
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const save = () => {
    const r = saveRxSet(profile, name, (slip || []).map((l) => ({ ...l, name: l.drug })), () => newId("SET"));
    if (r.error) { showToast(r.error); return; }
    onProfile(r.profile);
    setName(""); setOpen(false);
    showToast(`Saved set "${r.set.name}"`);
  };
  return (
    <div data-testid="rx-sets">
      <div className="mb-1.5 text-[11px] font-bold uppercase text-slate-500">Prescription sets (add all in one tap):</div>
      <div className="flex flex-wrap items-center gap-2">
        {sets.length === 0 && <span className="text-xs text-slate-500">No sets yet. Write a slip, then save it as a set.</span>}
        {sets.map((s) => (
          <span key={s.id} className="inline-flex items-center overflow-hidden rounded-lg border border-blue-200 bg-blue-50 text-xs">
            <button type="button" onClick={() => onApply(s, newLinesFromSet(s, slip))} className="inline-flex items-center gap-1 px-2.5 py-1 font-semibold text-blue-800 hover:bg-blue-100">
              <Plus className="h-3 w-3" aria-hidden="true" />{s.name} <span className="font-normal text-blue-700">({s.items.length})</span>
            </button>
            <button type="button" aria-label={`Delete set ${s.name}`} onClick={() => onProfile(removeRxSet(profile, s.id))} className="border-l border-blue-200 px-1.5 py-1 text-blue-500 hover:bg-blue-100 hover:text-rose-600">
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </span>
        ))}
        <button type="button" onClick={() => setOpen((v) => !v)} className="rounded-lg border border-rule px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-enamel">Save this slip as a set</button>
        {profile && Array.isArray(profile.rxSets) && <button type="button" onClick={() => onProfile(resetRxSets(profile))} className="text-[11px] text-slate-500 underline">Restore starter sets</button>}
      </div>
      {open && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input value={name} onChange={(e) => setName(e.target.value.slice(0, 40))} aria-label="Set name" placeholder="Set name, e.g. After wisdom tooth surgery" className="min-w-0 flex-1 rounded-lg border border-rule px-3 py-2 text-xs" />
          <button type="button" onClick={save} className="rounded-lg bg-[#2563eb] px-3 py-2 text-xs font-semibold text-white">Save set</button>
        </div>
      )}
      <p className="mt-1.5 text-[10px] text-slate-500">Sets are starting points. You decide what to prescribe for each patient.</p>
    </div>
  );
}
