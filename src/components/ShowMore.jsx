import React from "react";

/** The "Show more" row under a long list. Renders nothing when everything is already shown. */
export default function ShowMore({ paged, noun = "rows", colSpan }) {
  if (!paged.hasMore) return null;
  const btn = (
    <button type="button" onClick={paged.more} className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-blue-50">
      Show {Math.min(paged.remaining, 50)} more {noun} ({paged.remaining} not shown yet)
    </button>
  );
  return colSpan ? <tr><td colSpan={colSpan} className="p-4 text-center">{btn}</td></tr> : <div className="text-center pt-1">{btn}</div>;
}
