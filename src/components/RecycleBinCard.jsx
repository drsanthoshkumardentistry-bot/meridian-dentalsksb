import React, { useEffect, useState } from "react";
import { describeEntry, daysLeft } from "../recycleBin.js";

/** Settings card (owner): patients and invoices deleted in the last 30 days, with a Restore button. */
export default function RecycleBinCard({ loadFn, restoreFn, removeFn, onRestored }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    setMsg("");
    try { setRows(await loadFn()); } catch { setRows([]); setMsg("Could not load deleted records. Check your connection and try again."); }
  };
  useEffect(() => { if (open && rows === null) load(); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const restore = async (e) => {
    setBusy(e.id); setMsg("");
    try {
      const ok = await restoreFn(e);
      if (!ok) setMsg("This copy cannot be read, so it cannot be restored.");
      else { setRows((r) => (r || []).filter((x) => x.id !== e.id)); setMsg(`${describeEntry(e).title} was restored.`); if (onRestored) onRestored(e); }
    } catch { setMsg("Could not restore it. Try again."); }
    setBusy("");
  };
  const erase = async (e) => {
    setBusy(e.id); setMsg("");
    try { await removeFn(e); setRows((r) => (r || []).filter((x) => x.id !== e.id)); } catch { setMsg("Could not remove it. Try again."); }
    setBusy("");
  };

  return (
    <section className="rounded-xl border border-rule p-4 space-y-3" aria-label="Recently deleted" data-testid="recycle-bin">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Recently deleted</h3>
          <p className="text-xs text-slate-500">Patients and invoices you delete are kept here for 30 days, so a mistake can be undone.</p>
        </div>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">{open ? "Hide" : "Show"}</button>
      </div>
      {open && (
        <div>
          {rows === null && <p className="text-xs text-slate-500">Loading…</p>}
          {rows && rows.length === 0 && <p className="text-xs text-slate-500">Nothing deleted in the last 30 days.</p>}
          {rows && rows.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {rows.map((e) => { const d = describeEntry(e); return (
                <li key={e.id} className="py-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{d.title}</div>
                    <div className="text-xs text-slate-500 truncate">{d.detail ? `${d.detail} · ` : ""}{e.coll === "invoices" ? "Invoice" : "Patient"}, {daysLeft(e)} days left</div>
                  </div>
                  <div className="shrink-0 flex gap-2">
                    <button type="button" disabled={busy === e.id} onClick={() => restore(e)} aria-label={`Restore ${d.title}`} className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Restore</button>
                    <button type="button" disabled={busy === e.id} onClick={() => erase(e)} aria-label={`Delete ${d.title} for good`} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50">Delete for good</button>
                  </div>
                </li>
              ); })}
            </ul>
          )}
          {msg && <p role="status" className="mt-2 text-xs text-slate-700">{msg}</p>}
        </div>
      )}
    </section>
  );
}
