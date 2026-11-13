import React, { useEffect, useState } from "react";
import { CloudOff, Cloud } from "lucide-react";

/* Thin bar under the header: tells staff when the internet is gone (work continues, saved on the device)
 * and confirms for a few seconds when it is back. Nothing shows while online. */
export default function ConnectionBar({ onlineNow = () => (typeof navigator === "undefined" ? true : navigator.onLine !== false), backMs = 4000 }) {
  const [online, setOnline] = useState(onlineNow);
  const [justBack, setJustBack] = useState(false);

  useEffect(() => {
    let timer;
    const up = () => { setOnline(true); setJustBack(true); clearTimeout(timer); timer = setTimeout(() => setJustBack(false), backMs); };
    const down = () => { clearTimeout(timer); setJustBack(false); setOnline(false); };
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); clearTimeout(timer); };
  }, [backMs]);

  if (online && !justBack) return null;
  return online ? (
    <div role="status" data-testid="connection-bar" className="flex items-center justify-center gap-2 bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5">
      <Cloud className="w-4 h-4" aria-hidden="true" />Back online. Your changes are syncing to the cloud.
    </div>
  ) : (
    <div role="status" data-testid="connection-bar" className="flex items-center justify-center gap-2 bg-amber-500 text-slate-900 text-xs font-semibold px-3 py-1.5">
      <CloudOff className="w-4 h-4" aria-hidden="true" />You are offline. Keep working: changes are saved on this device and sync when you reconnect.
    </div>
  );
}
