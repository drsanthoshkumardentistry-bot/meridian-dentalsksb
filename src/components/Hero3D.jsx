import React, { useRef } from "react";
import { MessageCircle, CalendarDays } from "lucide-react";

/** A glossy molar drawn in SVG. It floats in front of the odontogram card. */
function Tooth3D() {
  return (
    <svg viewBox="0 0 100 116" aria-hidden="true" className="w-full h-auto drop-shadow-[0_18px_22px_rgba(29,78,216,0.28)]">
      <defs>
        <radialGradient id="th-body" cx="34%" cy="26%" r="85%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#eaf2ff" />
          <stop offset="1" stopColor="#b9d0f7" />
        </radialGradient>
        <linearGradient id="th-edge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9db9ee" />
          <stop offset="1" stopColor="#5b86dc" />
        </linearGradient>
      </defs>
      <path d="M50 9C31 3 12 15 14 41c2 22 8 30 10 52 1 12 8 14 12 2 4-12 8-18 14-18s10 6 14 18c4 12 11 10 12-2 2-22 8-30 10-52C88 15 69 3 50 9Z" fill="url(#th-body)" stroke="url(#th-edge)" strokeWidth="1.6" />
      <path d="M26 26c3-9 11-13 19-12" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.85" />
      <ellipse cx="66" cy="60" rx="8" ry="16" fill="#8fb0ee" opacity="0.18" />
    </svg>
  );
}

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

          <div className="scene3d-layer scene3d-tooth float-a" aria-hidden="true">
            <Tooth3D />
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
