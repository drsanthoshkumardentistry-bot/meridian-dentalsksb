import React, { useEffect, useRef, useState } from "react";

const LINES = [
  "Hi, I'm Meridee, the MeriDent tooth fairy!",
  "Chart the tooth, and I'll keep the visit tidy.",
  "Reminder ready? One tap opens WhatsApp.",
  "Free during early access. Come and try me!",
];

const Sparkle = ({ x, y, s = 1, delay = 0 }) => (
  <path
    className="fairy-sparkle"
    style={{ animationDelay: `${delay}ms`, transformOrigin: `${x}px ${y}px` }}
    d={`M${x} ${y - 7 * s}L${x + 2 * s} ${y - 2 * s}L${x + 7 * s} ${y}L${x + 2 * s} ${y + 2 * s}L${x} ${y + 7 * s}L${x - 2 * s} ${y + 2 * s}L${x - 7 * s} ${y}L${x - 2 * s} ${y - 2 * s}Z`}
    fill="#f5a524"
  />
);

/** Meridee, the MeriDent tooth fairy. Pure SVG and CSS, original character. `still` freezes the motion for small uses. */
export function FairySvg({ className = "", still = false, burst = 0, happy = false }) {
  return (
    <svg viewBox="0 0 170 176" aria-hidden="true" className={`fairy ${still ? "fairy-still" : ""} ${className}`}>
      <defs>
        <radialGradient id="fy-body" cx="34%" cy="24%" r="88%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#eef5ff" />
          <stop offset="1" stopColor="#bcd3f8" />
        </radialGradient>
        <linearGradient id="fy-wing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c9f2f8" stopOpacity="0.95" />
          <stop offset="1" stopColor="#8fd9e6" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <g className="fairy-float">
        {/* wings */}
        <g className="fairy-wing fairy-wing-l" style={{ transformOrigin: "62px 92px" }}>
          <path d="M62 92C34 56 8 52 8 80c0 22 30 28 54 16Z" fill="url(#fy-wing)" stroke="#6fcbdc" strokeWidth="1.4" />
          <path d="M60 94C38 80 22 76 16 82" fill="none" stroke="#fff" strokeWidth="1.4" opacity="0.7" />
        </g>
        <g className="fairy-wing fairy-wing-r" style={{ transformOrigin: "108px 92px" }}>
          <path d="M108 92c28-36 54-40 54-12 0 22-30 28-54 16Z" fill="url(#fy-wing)" stroke="#6fcbdc" strokeWidth="1.4" />
          <path d="M110 94c22-14 38-18 44-12" fill="none" stroke="#fff" strokeWidth="1.4" opacity="0.7" />
        </g>
        {/* body (a happy molar) */}
        <path d="M85 34c-22-7-44 8-41 40 2 26 9 36 12 62 2 14 10 16 15 2 5-14 9-21 14-21s9 7 14 21c5 14 13 12 15-2 3-26 10-36 12-62 3-32-19-47-41-40Z"
          fill="url(#fy-body)" stroke="#8fb0ea" strokeWidth="2" />
        <path d="M58 56c4-11 13-16 23-15" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity="0.85" />
        {/* face */}
        {happy ? (
          <g fill="none" stroke="#0b1b3a" strokeWidth="3" strokeLinecap="round">
            <path d="M66 85q6-9 12 0" />
            <path d="M92 85q6-9 12 0" />
          </g>
        ) : (
          <g className="fairy-look">
            <g className="fairy-eyes">
              <ellipse cx="72" cy="82" rx="4.6" ry="6" fill="#0b1b3a" />
              <ellipse cx="98" cy="82" rx="4.6" ry="6" fill="#0b1b3a" />
              <circle cx="73.6" cy="79.6" r="1.5" fill="#fff" />
              <circle cx="99.6" cy="79.6" r="1.5" fill="#fff" />
            </g>
          </g>
        )}
        <circle cx="62" cy="95" r="5.5" fill="#ff9fb1" opacity="0.55" />
        <circle cx="108" cy="95" r="5.5" fill="#ff9fb1" opacity="0.55" />
        <path d="M76 96c5 7 13 7 18 0" fill="none" stroke="#0b1b3a" strokeWidth="2.4" strokeLinecap="round" />
        {/* star hairpin */}
        <path d="M85 14l3.2 7.4 8 .8-6 5.4 1.8 7.9L85 31.4l-7 4.1 1.8-7.9-6-5.4 8-.8Z" fill="#f5a524" stroke="#fff" strokeWidth="1.2" />
        {/* wand arm */}
        <path d="M112 112c10 4 17 0 22-9" fill="none" stroke="#8fb0ea" strokeWidth="4" strokeLinecap="round" />
        <g className="fairy-wand" style={{ transformOrigin: "134px 100px" }}>
          <path d="M134 103L148 62" stroke="#9a5200" strokeWidth="3" strokeLinecap="round" />
          <path d="M149 40l4.4 10 10.6 1-8 7.2 2.4 10.4-9.4-5.6-9.4 5.6 2.4-10.4-8-7.2 10.6-1Z" fill="#ffd166" stroke="#f5a524" strokeWidth="1.4" />
        </g>
      </g>
      <Sparkle x={22} y={40} s={1} delay={0} />
      <Sparkle x={150} y={24} s={0.8} delay={500} />
      <Sparkle x={30} y={140} s={0.7} delay={900} />
      <Sparkle x={140} y={140} s={1} delay={300} />
      <Sparkle x={162} y={96} s={0.6} delay={1200} />
      {burst > 0 && (
        <g key={burst} className="fairy-burst">
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <circle key={a} cx="150" cy="56" r="3" fill="#f5a524" style={{ "--a": `${a}deg` }} />
          ))}
        </g>
      )}
    </svg>
  );
}

/** Clickable Meridee with a speech bubble that cycles through a few friendly lines. */
export default function ToothFairy({ className = "" }) {
  const [step, setStep] = useState(-1);
  const [burst, setBurst] = useState(0);
  const [happy, setHappy] = useState(false);
  const box = useRef(null);
  const timer = useRef(null);

  // Her eyes follow the mouse a little (laptops only). Touch screens skip this.
  useEffect(() => {
    const move = (e) => {
      if (e.pointerType !== "mouse" || !box.current) return;
      const r = box.current.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
      const dy = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
      box.current.style.setProperty("--lx", `${Math.max(-3, Math.min(3, dx * 9)).toFixed(2)}px`);
      box.current.style.setProperty("--ly", `${Math.max(-2, Math.min(2.5, dy * 7)).toFixed(2)}px`);
    };
    window.addEventListener("pointermove", move);
    return () => { window.removeEventListener("pointermove", move); clearTimeout(timer.current); };
  }, []);

  const next = () => {
    setStep((s) => (s + 1) % LINES.length);
    setBurst((b) => b + 1);
    setHappy(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setHappy(false), 1400);
  };
  return (
    <div ref={box} data-mood={happy ? "happy" : "idle"} className={`fairy-wrap ${happy ? "fairy-jump" : ""} relative ${className}`}>
      {step >= 0 && (
        <div role="status" className="fairy-bubble absolute right-full top-2 mr-2 w-44 rounded-xl bg-white border border-rule shadow-lift px-3 py-2 text-[12px] leading-snug text-ink">
          {LINES[step]}
        </div>
      )}
      <button type="button" onClick={next} aria-label="Say hi to Meridee, the MeriDent tooth fairy" className="block w-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-full">
        <FairySvg burst={burst} happy={happy} />
      </button>
    </div>
  );
}
