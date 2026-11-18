import React, { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";
import { loadAnnouncement } from "../announcementApi.js";

const TONE = { info: "border-sky-200 bg-sky-50 text-sky-900", success: "border-emerald-200 bg-emerald-50 text-emerald-900", warning: "border-amber-300 bg-amber-50 text-amber-900" };
const KEY = "merident.announcement.dismissed";
const read = () => { try { return localStorage.getItem(KEY) || ""; } catch { return ""; } };

/** The founder's message to every clinic. Plain text, dismissed per message, checked again every 10 minutes. */
export default function AnnouncementBanner({ loadFn = loadAnnouncement, everyMs = 600000 }) {
  const [a, setA] = useState(null);
  const [gone, setGone] = useState(read);
  useEffect(() => {
    let live = true;
    const go = async () => { const d = await loadFn(); if (live) setA(d); };
    go();
    const t = everyMs > 0 ? setInterval(go, everyMs) : null;
    return () => { live = false; if (t) clearInterval(t); };
  }, [loadFn, everyMs]);
  if (!a || !a.active || a.id === gone) return null;
  const close = () => { setGone(a.id); try { localStorage.setItem(KEY, a.id); } catch { /* ignore */ } };
  return (
    <div role="status" data-testid="announcement" className={`print:hidden flex items-start gap-3 border-b px-4 py-2.5 text-sm ${TONE[a.level] || TONE.info}`}>
      <Megaphone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p className="min-w-0 flex-1 break-words">{a.text}</p>
      <button type="button" onClick={close} aria-label="Dismiss message" className="rounded p-1 hover:bg-black/5"><X className="h-4 w-4" /></button>
    </div>
  );
}
