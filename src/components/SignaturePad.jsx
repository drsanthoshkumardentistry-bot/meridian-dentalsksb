import React, { useRef, useEffect } from "react";

/** A box to sign in with a finger, pen or mouse. Calls onChange with a PNG data URL, or "" when cleared. */
export default function SignaturePad({ onChange, resetKey = 0, label = "Signature" }) {
  const canvas = useRef(null);
  const drawing = useRef(false);
  const inked = useRef(false);

  const clear = () => {
    const c = canvas.current;
    const ctx = c && c.getContext && c.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, c.width, c.height);
    inked.current = false;
    onChange("");
  };
  useEffect(clear, [resetKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const point = (e) => {
    const c = canvas.current;
    const r = c.getBoundingClientRect();
    return [((e.clientX - r.left) / (r.width || 1)) * c.width, ((e.clientY - r.top) / (r.height || 1)) * c.height];
  };
  const down = (e) => {
    const c = canvas.current;
    const ctx = c.getContext && c.getContext("2d");
    if (!ctx) return;
    e.preventDefault();
    c.setPointerCapture?.(e.pointerId);
    drawing.current = true;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f1c33";
    ctx.beginPath();
    const [x, y] = point(e);
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();
    inked.current = true;
  };
  const move = (e) => {
    if (!drawing.current) return;
    const ctx = canvas.current.getContext("2d");
    const [x, y] = point(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (inked.current) onChange(canvas.current.toDataURL("image/png"));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-slate-600">{label}</span>
        <button type="button" onClick={clear} className="text-xs font-semibold text-slate-500 hover:text-rose-700">Clear</button>
      </div>
      <canvas
        ref={canvas}
        width={600}
        height={180}
        role="img"
        aria-label="Signature box. Sign here with a finger, pen or mouse."
        className="w-full h-36 bg-white border border-dashed border-slate-400 rounded-lg"
        style={{ touchAction: "none" }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerLeave={up}
      />
    </div>
  );
}
