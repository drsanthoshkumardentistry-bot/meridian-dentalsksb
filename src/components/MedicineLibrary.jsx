import React, { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import MedicineForm from "./MedicineForm.jsx";
import { medicinesOf, upsertMedicine, removeMedicine, resetMedicines } from "../medicines.js";

/** Practice Profile: the medicines staff pick from on prescriptions. */
export default function MedicineLibrary({ profile, onProfile, newId, showToast }) {
  const list = medicinesOf(profile);
  const custom = Array.isArray(profile?.medicines);
  const [editing, setEditing] = useState(null);

  const save = (med) => {
    const r = upsertMedicine(profile, med, () => newId("MED"));
    if (r.error) return showToast(r.error);
    onProfile(r.profile);
    setEditing(null);
    showToast(editing ? "Medicine updated" : "Medicine added");
  };
  return (
    <div className="rounded-xl border border-rule bg-white p-4 text-xs space-y-3" data-testid="medicine-library">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="font-bold text-slate-800">Your medicines for prescriptions</div>
          <p className="text-slate-500 mt-0.5">These appear as quick buttons on the prescription slip. Past prescriptions keep what they were written with. Check every dose before you use it.</p>
        </div>
        {custom && <button type="button" onClick={() => { onProfile(resetMedicines(profile)); setEditing(null); }} className="text-[11px] text-blue-700 hover:underline">Reset to standard list</button>}
      </div>
      <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
        {list.length === 0 && <li className="p-3 text-slate-500 italic">No medicines yet. Add your first below.</li>}
        {list.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-2 p-2.5">
            <div className="min-w-0">
              <div className="font-semibold text-slate-800 truncate">{m.name} <span className="font-normal text-slate-500">· {m.dosage} · {m.frequency} · {m.duration}</span></div>
              <div className="text-[11px] text-slate-500 truncate">{[m.generic, m.instruction].filter(Boolean).join(" · ")}</div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button type="button" aria-label={`Edit ${m.name}`} onClick={() => setEditing(m)} className="p-1.5 text-slate-500 hover:text-blue-700"><Pencil className="w-3.5 h-3.5" /></button>
              <button type="button" aria-label={`Remove ${m.name}`} onClick={() => { onProfile(removeMedicine(profile, m.id)); if (editing?.id === m.id) setEditing(null); }} className="p-1.5 text-slate-500 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </li>
        ))}
      </ul>
      <div className="rounded-lg bg-enamel border border-slate-200 p-3">
        <div className="font-semibold text-slate-700 mb-2">{editing ? `Edit ${editing.name}` : "Add a medicine"}</div>
        <MedicineForm key={editing?.id || "new"} idPrefix="lib" initial={editing} submitLabel={editing ? "Save changes" : "Add medicine"} onSubmit={save} onCancel={editing ? () => setEditing(null) : undefined} />
      </div>
    </div>
  );
}
