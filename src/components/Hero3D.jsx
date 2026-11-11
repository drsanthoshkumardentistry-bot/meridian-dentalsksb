import React, { useRef } from "react";
import { MessageCircle, CalendarDays } from "lucide-react";
import ToothFairy from "./ToothFairy.jsx";

/**
 * Product artwork in a gently moving 3D scene. Pure CSS 3D, no library, so it stays light on older clinic PCs.
 * `chart` is the odontogram card and `bill` the sample invoice, both passed in by the landing page.
 * Motion stops for people who ask for reduced motion (see index.css).
 */
export default function Hero3D({ chart, bill }) {
  const tilt = useRef(null);

  const onMove = (e) => {
    if (e.pointerType !== "mouse" || !tilt.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    tilt.current.style.setProperty("--ry", `${(px * 14).toFixed(2)}deg`);
    tilt.current.style.setProperty("--rx", `${(-py * 10).toFixed(2)}deg`);
  };
  const onLeave = () => {
    if (!tilt.current) return;
    tilt.current.style.setProperty("--ry", "0deg");
    tilt.current.style.setProperty("--rx", "0deg");
  };

  return (
    <div className="scene3d relative" onPointerMove={onMove} onPointerLeave={onLeave} data-testid="hero-3d">
      <div className="scene3d-glow" aria-hidden="true" />
      <div ref={tilt} className="scene3d-tilt">
        <div className="scene3d-stage">
          <div className="scene3d-layer scene3d-back" aria-hidden="true" />
          <div className="scene3d-layer scene3d-mid">{chart}</div>

          <div className="scene3d-layer scene3d-tooth float-a">
            <ToothFairy />
          </div>

          <div className="scene3d-layer scene3d-bill float-b">{bill}</div>

          <div className="scene3d-layer scene3d-wa float-c hidden sm:block" aria-hidden="true">
            <div className="bg-white border border-rule rounded-xl shadow-lift p-3 w-[210px] text-[11px] leading-snug text-ink">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-700 mb-1">
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp reminder
              </div>
              <p className="rounded-lg bg-emerald-50 px-2.5 py-2 text-slate-700">Hello Asha, a reminder of your appointment tomorrow at 10:30. Reply to change the time.</p>
            </div>
          </div>

          <div className="scene3d-layer scene3d-appt float-b hidden sm:block" aria-hidden="true">
            <div className="bg-brand-600 text-white rounded-xl shadow-lift px-3 py-2 text-[11px] leading-tight">
              <div className="flex items-center gap-1.5 font-semibold"><CalendarDays className="w-3.5 h-3.5" /> 10:30 Root canal</div>
              <div className="text-blue-100">Chair 2, Dr Sample</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
