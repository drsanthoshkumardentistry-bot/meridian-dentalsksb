import React, { useEffect, useRef, useState } from "react";
import { Hospital, Settings, LogOut } from "lucide-react";
import UserAvatar from "./UserAvatar.jsx";

/** Avatar button that opens a small menu: Practice Profile, Settings, and a red Log out. */
export default function AccountMenu({ user, canProfile = true, canSettings = true, onGo, onLogout }) {
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
  const item = "w-full text-left flex items-center gap-2 px-4 py-2.5 text-xs font-semibold hover:bg-slate-50";
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="true" aria-expanded={open} aria-label="Account menu" title={user.email}
        className="rounded-full hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">
        <UserAvatar user={user} className="w-8 h-8" />
      </button>
      {open && (
        <div role="menu" aria-label="Account" className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="text-xs font-bold text-slate-900 truncate">{user.displayName || "Signed in"}</div>
            <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
          </div>
          {canProfile && <button type="button" role="menuitem" onClick={() => { setOpen(false); onGo("Practice Profile"); }} className={`${item} text-slate-700`}><Hospital className="w-4 h-4" /> Practice Profile</button>}
          {canSettings && <button type="button" role="menuitem" onClick={() => { setOpen(false); onGo("Settings"); }} className={`${item} text-slate-700`}><Settings className="w-4 h-4" /> Settings</button>}
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onLogout(); }} className={`${item} text-red-600 hover:bg-red-50 border-t border-slate-100`}><LogOut className="w-4 h-4" /> Log out</button>
        </div>
      )}
    </div>
  );
}
