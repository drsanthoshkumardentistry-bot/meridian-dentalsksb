import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";

const PAGES = [["overview", "Overview"], ["billing", "Billing & approvals"], ["clinics", "Clinics"], ["profile", "Admin profile"]];

/** Pure: pages and clinics that match what was typed (clinics by email, at most 8). */
export const searchAdmin = (text, clinics = []) => {
  const q = String(text || "").trim().toLowerCase();
  if (!q) return { pages: PAGES, clinics: [] };
  return {
    pages: PAGES.filter(([, label]) => label.toLowerCase().includes(q)),
    clinics: clinics.filter((c) => String(c.email || "").toLowerCase().includes(q)).slice(0, 8),
  };
};

/** Jump to a clinic or a page from anywhere in the admin. Opens with the search button, "/" or Ctrl+K. */
export default function QuickSearch({ clinics, onClinic, onPage }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const input = useRef(null);
  useEffect(() => {
    const key = (e) => {
      const typing = /^(input|textarea|select)$/i.test((e.target && e.target.tagName) || "");
      if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !typing)) { e.preventDefault(); setOpen(true); }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => { if (open && input.current) input.current.focus(); }, [open]);
  const found = useMemo(() => searchAdmin(text, clinics), [text, clinics]);
  const close = () => { setOpen(false); setText(""); };
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Search clinics and pages" className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white"><Search className="h-3.5 w-3.5" aria-hidden="true" /><span className="hidden sm:inline">Search</span></button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-16" onClick={close} data-testid="quick-search">
          <div role="dialog" aria-label="Search" className="w-full max-w-md rounded-2xl bg-white p-3 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
              <input ref={input} value={text} onChange={(e) => setText(e.target.value)} aria-label="Search by clinic email or page" placeholder="Clinic email or page name" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
              <button type="button" onClick={close} aria-label="Close search" className="text-slate-500"><X className="h-4 w-4" /></button>
            </div>
            <ul className="mt-2 max-h-72 divide-y divide-slate-100 overflow-y-auto text-sm">
              {found.clinics.map((c) => (
                <li key={c.uid}><button type="button" onClick={() => { onClinic(c); close(); }} className="flex w-full items-center justify-between gap-2 px-2 py-2 text-left hover:bg-slate-50"><span className="break-all font-medium text-slate-800">{c.email}</span><span className="shrink-0 text-[11px] text-slate-500">{c.state}</span></button></li>
              ))}
              {found.pages.map(([id, label]) => (
                <li key={id}><button type="button" onClick={() => { onPage(id); close(); }} className="w-full px-2 py-2 text-left text-slate-700 hover:bg-slate-50">Go to {label}</button></li>
              ))}
              {found.clinics.length === 0 && found.pages.length === 0 && <li className="px-2 py-3 text-xs text-slate-500">No clinic or page matches that.</li>}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
