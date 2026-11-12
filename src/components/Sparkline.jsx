import React from "react";

/** Small bar chart for a stat card. data: numbers. Bars stay round at any width. */
export function MiniBars({ data = [], color = "#2563eb", highlight = true, className = "" }) {
  const max = Math.max(0, ...data);
  if (!data.length) return null;
  return (
    <div className={`flex items-end gap-1.5 h-8 ${className}`} role="img" aria-label="Last 7 days">
      {data.map((v, i) => {
        const h = max > 0 ? Math.max(8, (v / max) * 100) : 8;
        const last = highlight && i === data.length - 1;
        return <span key={i} className="flex-1 rounded-full" style={{ height: `${h}%`, background: color, opacity: last ? 1 : 0.28 }} />;
      })}
    </div>
  );
}

/** Line and area chart. series: [{ name, color, data: number[] }], labels: string[] (same length). */
export function AreaLine({ series = [], labels = [], height = 160 }) {
  const n = labels.length;
  if (!n) return null;
  const W = 600, H = height, padL = 8, padR = 8, padT = 10, padB = 18;
  const max = Math.max(1, ...series.flatMap((s) => s.data));
  const x = (i) => padL + (n === 1 ? 0 : (i * (W - padL - padR)) / (n - 1));
  const y = (v) => padT + (1 - v / max) * (H - padT - padB);
  const every = Math.ceil(n / 6);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} role="img" aria-label={series.map((s) => s.name).join(" and ")} preserveAspectRatio="none">
      {[0, 0.5, 1].map((t) => <line key={t} x1={padL} x2={W - padR} y1={padT + t * (H - padT - padB)} y2={padT + t * (H - padT - padB)} stroke="#e6ecf7" strokeWidth="1" />)}
      {series.map((s) => {
        const pts = s.data.map((v, i) => `${x(i)},${y(v)}`);
        return (
          <g key={s.name}>
            <polygon points={`${x(0)},${H - padB} ${pts.join(" ")} ${x(n - 1)},${H - padB}`} fill={s.color} opacity="0.08" />
            <polyline points={pts.join(" ")} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </g>
        );
      })}
      {labels.map((l, i) => (i % every === 0 ? <text key={i} x={x(i)} y={H - 3} fontSize="10" fill="#94a3b8" textAnchor="middle">{l}</text> : null))}
    </svg>
  );
}
