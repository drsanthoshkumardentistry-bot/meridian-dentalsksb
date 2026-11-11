import React, { useState } from "react";
import { X, ArrowUp, ArrowDown } from "lucide-react";
import { LIST_DEFS, listOf, addOption, removeOption, moveOption, setList, resetList } from "../optionLists.js";

function ListEditor({ k, profile, onProfile, showToast }) {
  const [draft, setDraft] = useState("");
  const list = listOf(profile, k);
  const custom = Boolean(profile?.lists?.[k]?.length);
  const add = () => {
    const r = addOption(list, draft);
    if (r.error) return showToast(r.error);
    onProfile(setList(profile, k, r.list));
    setDraft("");
  };
  return (
    <div className="rounded-lg border border-slate-200 p-3 space-y-2" data-testid={`list-${k}`}>
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-700">{LIST_DEFS[k].label}</span>
        {custom && <button type="button" onClick={() => onProfile(resetList(profile, k))} className="text-[11px] text-blue-700 hover:underline">Reset to standard</button>}
      </div>
      <ul className="flex flex-wrap gap-1.5">
        {list.map((o) => (
          <li key={o} className="inline-flex items-center gap-0.5 pl-2.5 pr-1 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-blue-800">
            {o}
            <button type="button" aria-label={`Move ${o} earlier`} onClick={() => onProfile(setList(profile, k, moveOption(list, o, -1)))} className="p-0.5 text-blue-400 hover:text-blue-700"><ArrowUp className="w-3 h-3" /></button>
            <button type="button" aria-label={`Move ${o} later`} onClick={() => onProfile(setList(profile, k, moveOption(list, o, 1)))} className="p-0.5 text-blue-400 hover:text-blue-700"><ArrowDown className="w-3 h-3" /></button>
            <button type="button" aria-label={`Remove ${o}`} onClick={() => { const r = removeOption(list, o); if (r.error) return showToast(r.error); onProfile(setList(profile, k, r.list)); }} className="p-0.5 text-blue-400 hover:text-rose-600"><X className="w-3 h-3" /></button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input aria-label={`Add to ${LIST_DEFS[k].label}`} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} placeholder="Add an option" className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500" />
        <button type="button" onClick={add} className="px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 font-semibold hover:bg-blue-50">Add</button>
      </div>
    </div>
  );
}

/** Lets the clinic edit the choices that appear in its dropdowns. */
export default function OptionLists({ profile, onProfile, showToast }) {
  return (
    <div className="rounded-xl border border-rule bg-white p-4 text-xs space-y-3" data-testid="option-lists">
      <div>
        <div className="font-bold text-slate-800">Your dropdown choices</div>
        <p className="text-slate-500 mt-0.5">Change the choices staff pick from when booking, adding staff or adding stock. Past records keep what they were saved with.</p>
      </div>
      {Object.keys(LIST_DEFS).map((k) => <ListEditor key={k} k={k} profile={profile} onProfile={onProfile} showToast={showToast} />)}
    </div>
  );
}
