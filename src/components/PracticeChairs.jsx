import React, { createContext, useContext, useState } from "react";
import { Plus, Trash2, StickyNote } from "lucide-react";
import { chairsOf, addChair, updateChair, removeChair, nameProblem, MAX_NOTE, MAX_CHAIRS } from "../chairs.js";

export const ProfileNotesContext = createContext({ notes: {}, setNote: () => {} });

/** Optional extra text under any profile option. Collapsed until used. */
export function ProfileNote({ k }) {
  const { notes, setNote } = useContext(ProfileNotesContext);
  const text = notes?.[k] || "";
  const [open, setOpen] = useState(Boolean(text));
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-1 text-[11px] font-semibold text-blue-700 hover:underline inline-flex items-center gap-1">
        <StickyNote className="w-3 h-3" /> Add a note
      </button>
    );
  }
  return (
    <textarea
      aria-label={`Note for ${k}`}
      rows={2}
      maxLength={MAX_NOTE}
      value={text}
      onChange={(e) => setNote(k, e.target.value)}
      placeholder="Anything extra for this option (optional)"
      className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-[11px] bg-slate-50 focus:outline-none focus:border-blue-400"
    />
  );
}

/** Add, rename and remove the clinic's chairs. Each chair has its own note. */
export default function PracticeChairs({ profile, newId, onChange, onRenamed, showToast }) {
  const chairs = chairsOf(profile);
  const commit = (next) => onChange(next);
  const rename = (c, name) => {
    commit(updateChair(chairs, c.id, { name }));
  };
  const finishRename = (c, original) => {
    const problem = nameProblem(chairs, c.id, c.name);
    if (problem) {
      showToast(problem);
      commit(updateChair(chairs, c.id, { name: original }));
      return;
    }
    const trimmed = c.name.trim();
    if (trimmed !== c.name) commit(updateChair(chairs, c.id, { name: trimmed }));
    if (trimmed !== original) onRenamed?.(original, trimmed);
  };
  return (
    <div className="rounded-xl border border-rule bg-white p-4 text-xs space-y-3" data-testid="chair-editor">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold text-slate-800">Dental chairs</div>
          <p className="text-slate-500 mt-0.5">These appear in the diary and when booking. Renaming a chair updates its existing bookings.</p>
        </div>
        <span className="text-[11px] text-slate-500">{chairs.length} of {MAX_CHAIRS}</span>
      </div>
      <ul className="space-y-2">
        {chairs.map((c) => (
          <li key={c.id} className="rounded-lg border border-slate-200 p-2.5 space-y-1.5">
            <div className="flex items-center gap-2">
              <input
                aria-label="Chair name"
                value={c.name}
                onFocus={(e) => { e.target.dataset.original = c.name; }}
                onChange={(e) => rename(c, e.target.value)}
                onBlur={(e) => finishRename({ ...c, name: e.target.value }, e.target.dataset.original ?? c.name)}
                className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                aria-label={`Remove ${c.name}`}
                onClick={() => {
                  const r = removeChair(chairs, c.id);
                  if (r.error) return showToast(r.error);
                  commit(r.chairs);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <textarea
              aria-label={`Note for ${c.name}`}
              rows={1}
              maxLength={MAX_NOTE}
              value={c.note || ""}
              onChange={(e) => commit(updateChair(chairs, c.id, { note: e.target.value }))}
              placeholder="Note (optional), e.g. X-ray unit, pediatric chair"
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-[11px] focus:outline-none focus:border-blue-400"
            />
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => {
          const r = addChair(chairs, newId());
          if (r.error) return showToast(r.error);
          commit(r.chairs);
        }}
        className="px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 font-semibold hover:bg-blue-50 inline-flex items-center gap-1.5"
      >
        <Plus className="w-3.5 h-3.5" /> Add a chair
      </button>
    </div>
  );
}
