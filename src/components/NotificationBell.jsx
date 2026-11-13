import React, { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";

const DOT = { red: "bg-rose-500", amber: "bg-amber-500", blue: "bg-sky-500" };

/** Bell with a count. Opens a short list of low stock and upcoming appointments; each row opens its screen. */
export default function NotificationBell({ items = [], onOpen }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="true" aria-expanded={open}
        aria-label={items.length ? `Notifications, ${items.length}` : "Notifications, none"}
        className="relative p-2 rounded-full text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">
        <Bell className="w-5 h-5" />
        {items.length > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">{items.length > 9 ? "9+" : items.length}</span>}
      </button>
      {open && (
        <div role="menu" aria-label="Notifications" className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] max-h-[70vh] overflow-y-auto rounded-xl bg-white border border-slate-200 shadow-2xl z-50">
          <div className="px-4 py-3 border-b border-slate-100 text-sm font-bold text-slate-900">Notifications</div>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-xs text-slate-500 text-center">You are all caught up. Nothing needs your attention.</p>
          ) : (
            <ul>
              {items.map((n) => (
                <li key={n.id}>
                  <button type="button" role="menuitem" onClick={() => { setOpen(false); onOpen(n.to); }} className="w-full text-left flex items-start gap-3 px-4 py-2.5 hover:bg-slate-50 text-xs text-slate-800">
                    <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${DOT[n.tone] || DOT.blue}`} aria-hidden="true" />
                    <span className="flex-1">{n.text}<span className="block text-[10px] text-slate-400 mt-0.5">{n.kind === "stock" ? "Stock" : n.kind === "backup" ? "Backup" : "Appointments"}</span></span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
