import React, { useEffect, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

export const canFullscreen = () => typeof document !== "undefined" && Boolean(document.documentElement && document.documentElement.requestFullscreen);

/** Header button that fills the whole screen (clinic desktops and wall monitors). Hidden where the browser cannot do it. */
export default function FullscreenButton() {
  const [on, setOn] = useState(() => typeof document !== "undefined" && Boolean(document.fullscreenElement));
  useEffect(() => {
    const sync = () => setOn(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  if (!canFullscreen()) return null;
  const toggle = () => {
    const p = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    if (p && p.catch) p.catch(() => {});
  };
  const label = on ? "Exit full screen" : "Full screen";
  return (
    <button type="button" onClick={toggle} aria-label={label} title={label} className="hidden md:inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-blue-50 hover:text-blue-700">
      {on ? <Minimize2 className="h-[18px] w-[18px]" aria-hidden="true" /> : <Maximize2 className="h-[18px] w-[18px]" aria-hidden="true" />}
    </button>
  );
}
