import React from "react";

/** Small bar chart for a stat card. data: numbers. Thin rounded bars at any card width. */
export function MiniBars({ data = [], color = "#2563eb", highlight = true, className = "" }) {
  const max = Math.max(0, ...data);
  if (!data.length) return null;
  return (
    <div className={`flex items-end justify-between h-9 ${className}`} role="img" aria-label="Last 7 days">
      {data.map((v, i) => {
        const h = max > 0 ? Math.max(10, (v / max) * 100) : 10;
        const last = highlight && i === data.length - 1;
        return <span key={i} className="w-2 rounded-full" style={{ height: `${h}%`, background: color, opacity: last ? 1 : 0.3 }} />;
      })}
    </div>
  );
}

/** Line and area chart. series: [{ name, color, data: number[] }], labels: string[] (same length). */
export function AreaLine({ series = [], labels = [], height = 160, showLabels = true }) {
  const n = labels.length;
  if (!n) return null;
  const W = 600, H = height, padL = 4, padR = 4, padT = 8, padB = 6;
  const max = Math.max(1, ...series.flatMap((s) => s.data));
  const x = (i) => padL + (n === 1 ? 0 : (i * (W - padL - padR)) / (n - 1));
  const y = (v) => padT + (1 - v / max) * (H - padT - padB);
  const every = Math.ceil(n / 6);
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full block" style={{ height }} role="img" aria-label={series.map((s) => s.name).join(" and ")} preserveAspectRatio="none">
        {[0, 0.5, 1].map((t) => <line key={t} x1={padL} x2={W - padR} y1={padT + t * (H - padT - padB)} y2={padT + t * (H - padT - padB)} stroke="#e6ecf7" strokeWidth="1" vectorEffect="non-scaling-stroke" />)}
        {series.map((s) => {
          const pts = s.data.map((v, i) => `${x(i)},${y(v)}`);
          return (
            <g key={s.name}>
              <polygon points={`${x(0)},${H - padB} ${pts.join(" ")} ${x(n - 1)},${H - padB}`} fill={s.color} opacity="0.1" />
              <polyline points={pts.join(" ")} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </g>
          );
        })}
      </svg>
      {showLabels && (
        <div className="flex justify-between text-[10px] text-slate-400 mt-1" aria-hidden="true">
          {labels.filter((_, i) => i % every === 0).map((l) => <span key={l}>{l}</span>)}
        </div>
      )}
    </div>
  );
}
