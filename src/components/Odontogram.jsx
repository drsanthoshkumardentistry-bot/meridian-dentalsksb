import React, { useMemo } from "react";
import { toothInfo, groupFindings, STATUS_COLORS, archLayout } from "../odontogram.js";

const PERMANENT_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const PERMANENT_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const DECIDUOUS_UPPER = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
const DECIDUOUS_LOWER = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

function Tooth({ t, code, activeLabel, label, onTap }) {
  const info = toothInfo(t.num);
  const colors = STATUS_COLORS[code || "HLT"] || STATUS_COLORS.HLT;
  const charted = Boolean(code);
  const aria = `Tooth ${t.num}, ${info.name}, ${charted ? label : "healthy"}. Press to mark as ${activeLabel}.`;
  const press = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onTap(t.num);
    }
  };
  const r = t.type === "canine" ? t.w / 2 : Math.min(t.w, t.h) / 2.3;
  return (
    <g>
      <g
        className="odo-tooth"
        role="button"
        tabIndex={0}
        aria-label={aria}
        onClick={() => onTap(t.num)}
        onKeyDown={press}
        transform={`translate(${t.x.toFixed(1)} ${t.y.toFixed(1)}) rotate(${t.rot.toFixed(1)})`}
      >
        <title>{`${t.num} · ${info.name}${charted ? ` · ${label}` : ""}`}</title>
        {/* generous invisible hit area for fingers */}
        <rect x={-t.w / 2 - 3} y={-t.h / 2 - 3} width={t.w + 6} height={t.h + 6} fill="transparent" />
        <rect
          x={-t.w / 2}
          y={-t.h / 2}
          width={t.w}
          height={t.h}
          rx={r}
          fill={colors.fill}
          stroke={colors.stroke}
          strokeWidth={code === "FRC" ? 2.6 : 1.7}
          strokeDasharray={colors.dash}
        />
        {info.type === "molar" && (
          <path d={`M${-t.w / 2 + 6} 0 H${t.w / 2 - 6} M0 ${-t.h / 2 + 6} V${t.h / 2 - 6}`} stroke={colors.stroke} strokeOpacity="0.35" strokeWidth="1" fill="none" />
        )}
        {info.type === "premolar" && (
          <path d={`M0 ${-t.h / 2 + 6} V${t.h / 2 - 6}`} stroke={colors.stroke} strokeOpacity="0.35" strokeWidth="1" fill="none" />
        )}
      </g>
      {charted && (
        <text
          x={t.x.toFixed(1)}
          y={(t.y + 3).toFixed(1)}
          textAnchor="middle"
          fontSize="8.5"
          fontWeight="700"
          fill={colors.stroke}
          pointerEvents="none"
        >
          {code}
        </text>
      )}
      <text x={t.lx.toFixed(1)} y={(t.ly + 3.5).toFixed(1)} textAnchor="middle" fontSize="10" fill="#51638c" pointerEvents="none" style={{ fontVariantNumeric: "tabular-nums" }}>
        {t.num}
      </text>
    </g>
  );
}

export default function Odontogram({
  conditions = {},
  palette,
  activeStatus,
  onSelectStatus,
  onTap,
  onClear,
  isDeciduous,
  onToggleDeciduous
}) {
  const labelOf = (code) => palette.find((p) => p.id === code)?.label || code;
  const active = palette.find((p) => p.id === activeStatus) || palette[0];

  const upper = useMemo(
    () => archLayout(isDeciduous ? DECIDUOUS_UPPER : PERMANENT_UPPER, { upper: true, cy: 162, rx: isDeciduous ? 200 : 250, ry: isDeciduous ? 96 : 112 }).map((t) => ({ ...t, type: toothInfo(t.num).type })),
    [isDeciduous]
  );
  const lower = useMemo(
    () => archLayout(isDeciduous ? DECIDUOUS_LOWER : PERMANENT_LOWER, { upper: false, cy: 252, rx: isDeciduous ? 200 : 250, ry: isDeciduous ? 96 : 112 }).map((t) => ({ ...t, type: toothInfo(t.num).type })),
    [isDeciduous]
  );
  const findings = groupFindings(conditions, palette);
  const count = Object.keys(conditions).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="font-display text-base font-bold text-ink">Dental chart</div>
          <div className="text-xs text-slate-500">
            Pick a finding, then tap teeth to mark them. Tap a marked tooth again to clear it.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{isDeciduous ? "Primary teeth (20)" : "Adult teeth (32)"}</span>
          <button
            type="button"
            onClick={onToggleDeciduous}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
          >
            {isDeciduous ? "Switch to adult (32)" : "Switch to primary (20)"}
          </button>
        </div>
      </div>

      {/* Finding picker */}
      <div role="radiogroup" aria-label="Finding to apply" className="flex flex-wrap gap-1.5">
        {palette.map((item) => {
          const c = STATUS_COLORS[item.id] || STATUS_COLORS.HLT;
          const selected = activeStatus === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelectStatus(item.id)}
              className={`inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 rounded-full text-xs border transition-colors ${
                selected ? "bg-ink text-white border-ink font-bold" : "bg-white text-slate-700 border-rule hover:bg-mist font-medium"
              }`}
            >
              <svg width="12" height="12" aria-hidden="true">
                <rect x="1" y="1" width="10" height="10" rx="3.5" fill={c.fill} stroke={c.stroke} strokeWidth="1.5" strokeDasharray={c.dash} />
              </svg>
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-rule bg-enamel p-3 sm:p-4 overflow-x-auto">
        <svg
          viewBox="0 0 600 425"
          role="group"
          aria-label={isDeciduous ? "Primary dentition chart" : "Adult dentition chart"}
          className="w-full h-auto min-w-[520px] max-w-[760px] mx-auto block select-none"
        >
          <text x="300" y="192" textAnchor="middle" fontSize="11" fill="#6b7fa8">Upper jaw</text>
          <text x="300" y="212" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0b1b3a">Marking: {active.label}</text>
          <text x="300" y="232" textAnchor="middle" fontSize="11" fill="#6b7fa8">Lower jaw</text>
          <text x="10" y="212" fontSize="11" fill="#6b7fa8">Patient's right</text>
          <text x="590" y="212" textAnchor="end" fontSize="11" fill="#6b7fa8">Patient's left</text>
          {[...upper, ...lower].map((t) => (
            <Tooth key={t.num} t={t} code={conditions[t.num]} label={labelOf(conditions[t.num])} activeLabel={active.label} onTap={onTap} />
          ))}
        </svg>
      </div>

      {/* Findings summary */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-bold text-ink">
            Findings {count > 0 && <span className="font-normal text-slate-500">({count} {count === 1 ? "tooth" : "teeth"})</span>}
          </div>
          {count > 0 && (
            <button type="button" onClick={onClear} className="text-xs font-semibold text-slate-500 hover:text-rose-600">
              Clear chart
            </button>
          )}
        </div>
        {count === 0 ? (
          <p className="text-sm text-slate-500">Nothing recorded yet. Pick a finding above and tap a tooth.</p>
        ) : (
          <ul className="space-y-1.5">
            {findings.map(({ code, teeth }) => {
              const c = STATUS_COLORS[code] || STATUS_COLORS.HLT;
              return (
                <li key={code} className="flex items-start gap-2.5 text-sm">
                  <svg width="14" height="14" className="mt-0.5 shrink-0" aria-hidden="true">
                    <rect x="1" y="1" width="12" height="12" rx="4" fill={c.fill} stroke={c.stroke} strokeWidth="1.6" strokeDasharray={c.dash} />
                  </svg>
                  <span>
                    <strong className="text-ink">{labelOf(code)}</strong>
                    <span className="text-slate-600">
                      {" "}
                      {teeth.length === 1 ? "tooth" : "teeth"} {teeth.join(", ")}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
