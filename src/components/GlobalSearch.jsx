import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { globalSearch } from "../search.js";
import { formatTime12 } from "../reminders";
import { balancePaise, formatINR, normalizeInvoice } from "../billing.js";

/** One box that finds patients, appointments and invoices. "/" or Ctrl/Cmd+K focuses it. */
export default function GlobalSearch({ patients, appointments, invoices, onPick }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const boxRef = useRef(null);

  const results = useMemo(() => globalSearch({ patients, appointments, invoices }, q), [patients, appointments, invoices, q]);
  const flat = useMemo(
    () => [
      ...results.patients.map((item) => ({ type: "patient", item })),
      ...results.appointments.map((item) => ({ type: "appointment", item })),
      ...results.invoices.map((item) => ({ type: "invoice", item })),
    ],
    [results]
  );

  useEffect(() => setActive(0), [q]);

  useEffect(() => {
    const onKey = (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "");
      if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  const pick = (entry) => {
    if (!entry) return;
    onPick(entry.type, entry.item);
    setOpen(false);
    setQ("");
  };

  const onInputKey = (e) => {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(flat[active]);
    }
  };

  const showPanel = open && q.trim().length >= 2;
  let index = -1;
  const row = (type, item, title, sub) => {
    index += 1;
    const i = index;
    return (
      <li key={`${type}-${item.id}`} role="option" aria-selected={i === active}>
        <button
          type="button"
          onMouseEnter={() => setActive(i)}
          onClick={() => pick({ type, item })}
          className={`w-full text-left px-3 py-2 flex flex-col ${i === active ? "bg-blue-50" : "hover:bg-enamel"}`}
        >
          <span className="text-sm font-semibold text-slate-900">{title}</span>
          <span className="text-[11px] text-slate-500">{sub}</span>
        </button>
      </li>
    );
  };
  const group = (label, entries) =>
    entries.length ? (
      <div key={label}>
        <div className="px-3 pt-2 pb-1 text-[11px] font-bold text-slate-500">{label}</div>
        <ul>{entries}</ul>
      </div>
    ) : null;

  return (
    <div ref={boxRef} className="relative flex-1 max-w-md min-w-0">
      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" aria-hidden="true" />
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls="global-search-results"
        aria-label="Search patients, appointments and invoices"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onInputKey}
        placeholder="Search patients, visits, invoices  ( / )"
        className="w-full pl-9 pr-3 py-1.5 bg-enamel border border-rule rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />
      {showPanel && (
        <div id="global-search-results" role="listbox" className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-rule rounded-xl shadow-xl max-h-[70vh] overflow-y-auto z-50 pb-1">
          {flat.length === 0 ? (
            <p className="px-3 py-4 text-xs text-slate-500">Nothing found for "{q.trim()}". Try a name, phone number or invoice number.</p>
          ) : (
            <>
              {group("Patients", results.patients.map((p) => row("patient", p, p.name, [p.phone, p.age ? `${p.age} yrs` : "", p.id].filter(Boolean).join(" · "))))}
              {group("Appointments", results.appointments.map((a) => row("appointment", a, `${a.patientName}: ${a.procedure}`, `${a.date} at ${formatTime12(a.time)} · ${a.status || "Confirmed"}`)))}
              {group(
                "Invoices",
                results.invoices.map((inv) => {
                  const n = normalizeInvoice(inv);
                  const bal = balancePaise(n);
                  return row("invoice", inv, `${inv.id} · ${inv.patient}`, bal > 0 ? `₹${formatINR(bal)} due of ₹${formatINR(n.totalP)}` : `₹${formatINR(n.totalP)} paid`);
                })
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
