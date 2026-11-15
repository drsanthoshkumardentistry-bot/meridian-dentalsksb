import React from "react";
import { PAGE_LANGUAGES } from "../pageText.js";

/** Small English / தமிழ் switch for the public patient pages. */
export default function LangSwitch({ lang, onChange }) {
  return (
    <div className="flex justify-end gap-1 mb-3" role="group" aria-label="Language">
      {PAGE_LANGUAGES.map((l) => (
        <button key={l.id} type="button" onClick={() => onChange(l.id)} aria-pressed={lang === l.id}
          className={`rounded-full px-3 py-1 text-xs font-semibold border ${lang === l.id ? "bg-blue-700 text-white border-blue-700" : "bg-white text-slate-600 border-slate-300"}`}>{l.label}</button>
      ))}
    </div>
  );
}
