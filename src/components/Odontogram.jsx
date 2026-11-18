import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CARIES_CLASSES, SURFACES, DEPTHS, surfaceName, cariesText } from "../caries.js";
import { toothInfo, groupFindings, STATUS_COLORS, archLayout, codesOf, primaryCode, normalizeConditions, groupPalette, colorOf, findingLabel, customCode, isCustomCode, MAX_CUSTOM_CHARS } from "../odontogram.js";

const PERMANENT_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const PERMANENT_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const DECIDUOUS_UPPER = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
const DECIDUOUS_LOWER = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

function ToothImpl({ t, codes, labelOf, onTap, planned, activeLabel }) {
  const info = toothInfo(t.num);
  const code = primaryCode(codes);
  const colors = colorOf(code || "HLT");
  const charted = codes.length > 0;
  const extras = codes.filter((c) => c !== code);
  const names = codes.map(labelOf).join(" + ");
  const aria = `Tooth ${t.num}, ${info.name}, ${charted ? names : "healthy"}${planned ? ", treatment planned" : ""}. ${activeLabel === "choose findings" ? "Press to choose its findings." : `Press to toggle ${activeLabel}.`}`;
  const label = names;
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
        {planned && (
          <rect
            x={-t.w / 2 - 4}
            y={-t.h / 2 - 4}
            width={t.w + 8}
            height={t.h + 8}
            rx={r + 3}
            fill="none"
            stroke="#1d4ed8"
            strokeWidth="1.8"
            strokeDasharray="4 3"
          />
        )}
        {info.type === "molar" && (
          <path d={`M${-t.w / 2 + 6} 0 H${t.w / 2 - 6} M0 ${-t.h / 2 + 6} V${t.h / 2 - 6}`} stroke={colors.stroke} strokeOpacity="0.35" strokeWidth="1" fill="none" />
        )}
        {info.type === "premolar" && (
          <path d={`M0 ${-t.h / 2 + 6} V${t.h / 2 - 6}`} stroke={colors.stroke} strokeOpacity="0.35" strokeWidth="1" fill="none" />
        )}
        {extras.slice(0, 3).map((c, i, arr) => (
          <circle
            key={c}
            cx={(i - (arr.length - 1) / 2) * 8}
            cy={t.h / 2 - 5}
            r="3"
            fill={colorOf(c).stroke}
            stroke="#fff"
            strokeWidth="1"
          />
        ))}
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
          {isCustomCode(code) ? "•" : code}
          {extras.length > 0 ? `+${extras.length}` : ""}
        </text>
      )}
      <text x={t.lx.toFixed(1)} y={(t.ly + 3.5).toFixed(1)} textAnchor="middle" fontSize="10" fill="#51638c" pointerEvents="none" style={{ fontVariantNumeric: "tabular-nums" }}>
        {t.num}
      </text>
    </g>
  );
}

// Only a tooth whose own findings changed is drawn again, so a 32-tooth chart stays smooth on a low-spec tablet.
const Tooth = React.memo(ToothImpl, (a, b) => a.t === b.t && a.planned === b.planned && a.activeLabel === b.activeLabel && a.codes.join("|") === b.codes.join("|") && a.labelOf === b.labelOf && a.onTap === b.onTap);

// Surfaces, G.V. Black class (one tap) and depth for one carious tooth. Used in the tooth pop-up and in the list under the chart.
function CariesEditor({ tooth, d, onCaries, compact = false }) {
  const front = ["incisor", "canine"].includes((toothInfo(tooth) || {}).type);
  const depth = DEPTHS.find((x) => x.id === d.depth);
  const cls = CARIES_CLASSES.find((c) => c.id === d.cls);
  const set = (patch) => onCaries(Number(tooth), patch);
  return (
    <div className="rounded-xl border border-rule bg-white p-3 text-sm space-y-2.5" aria-label={`Caries details for tooth ${tooth}`} data-testid={compact ? "caries-editor-sheet" : undefined}>
      <div className="flex flex-wrap items-center gap-2">
        <strong className="text-ink">Caries details ({tooth})</strong>
        <span className="text-xs text-slate-600">{cariesText(d) || "Not detailed yet"}</span>
      </div>
      <div>
        <div className="mb-1 text-[11px] font-semibold text-slate-500">Surfaces (tap all that are affected)</div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Surfaces on tooth ${tooth}`}>
          {SURFACES.map((sf) => {
            const on = (d.surfaces || []).includes(sf);
            return (
              <button key={sf} type="button" aria-pressed={on} title={surfaceName(sf, tooth)} onClick={() => set({ surfaces: on ? (d.surfaces || []).filter((x) => x !== sf) : [...(d.surfaces || []), sf] })}
                className={`min-w-[2.75rem] px-3 py-2 rounded-full border text-xs font-semibold ${on ? "bg-[#1d4ed8] text-white border-[#1d4ed8]" : "bg-white text-slate-700 border-rule"}`}>
                {sf === "O" && front ? "I" : sf}
              </button>
            );
          })}
          <label className="inline-flex items-center gap-1 text-xs text-slate-700 ml-1">
            <input type="checkbox" checked={!!d.cervical} onChange={(e) => set({ cervical: e.target.checked })} /> Near the gum
          </label>
          <label className="inline-flex items-center gap-1 text-xs text-slate-700">
            <input type="checkbox" checked={!!d.tip} onChange={(e) => set({ tip: e.target.checked })} /> {front ? "Incisal edge" : "Cusp tip"}
          </label>
        </div>
      </div>
      <div>
        <div className="mb-1 text-[11px] font-semibold text-slate-500">G.V. Black class (suggested from the surfaces; tap to change)</div>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={`Black class for tooth ${tooth}`}>
          {CARIES_CLASSES.map((c) => (
            <button key={c.id} type="button" role="radio" aria-checked={d.cls === c.id} onClick={() => set({ cls: d.cls === c.id ? "" : c.id })}
              className={`px-3 py-2 rounded-lg border text-xs font-semibold ${d.cls === c.id ? "bg-ink text-white border-ink" : "bg-white text-slate-700 border-rule"}`}>
              {c.label}
            </button>
          ))}
        </div>
        {cls && <p className="mt-1 text-[11px] text-slate-500">{cls.text}.</p>}
      </div>
      <div>
        <div className="mb-1 text-[11px] font-semibold text-slate-500">Depth</div>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={`Depth for tooth ${tooth}`}>
          {DEPTHS.map((x) => (
            <button key={x.id} type="button" role="radio" aria-checked={d.depth === x.id} onClick={() => set({ depth: d.depth === x.id ? "" : x.id })}
              className={`px-3 py-2 rounded-lg border text-xs font-semibold ${d.depth === x.id ? "bg-ink text-white border-ink" : "bg-white text-slate-700 border-rule"}`}>
              {x.label}
            </button>
          ))}
        </div>
        {depth && <p className="mt-1 text-[11px] text-slate-500">{depth.hint}.</p>}
      </div>
    </div>
  );
}

export default function Odontogram({
  conditions: rawConditions = {},
  palette,
  activeStatus,
  onSelectStatus,
  onTap,
  onRemoveFinding,
  caries = {},
  onCaries,
  onClear,
  isDeciduous,
  onToggleDeciduous,
  plannedTeeth = new Set()
}) {
  const conditions = useMemo(() => normalizeConditions(rawConditions), [rawConditions]);
  const labelOf = useCallback((code) => findingLabel(code, palette), [palette]);
  const readMode = () => { try { return localStorage.getItem("merident.odo.mode") === "finding" ? "finding" : "tooth"; } catch { return "tooth"; } };
  const [mode, setModeState] = useState(readMode);
  const [full, setFull] = useState(false);
  const [sheet, setSheet] = useState(null); // tooth number whose finding sheet is open
  const [query, setQuery] = useState("");
  const setMode = (m) => { setModeState(m); setSheet(null); try { localStorage.setItem("merident.odo.mode", m); } catch { /* ignore */ } };
  const tapRef = useRef(onTap);
  tapRef.current = onTap;
  const modeRef = useRef(mode);
  modeRef.current = mode;
  // "Finding first" paints the chosen finding on every tooth you tap. "Tooth first" opens a sheet for that one tooth.
  useEffect(() => { setQuery(""); }, [sheet]);
  const stableTap = useCallback((num) => { if (modeRef.current === "finding") tapRef.current(num); else setSheet(num); }, []);

  // Full screen: cover the page, lock page scrolling, ask the browser for real full screen where it allows it, and leave on Esc.
  useEffect(() => {
    if (!full) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    try { const el = document.documentElement; if (el.requestFullscreen && !document.fullscreenElement) el.requestFullscreen().catch(() => {}); } catch { /* optional */ }
    const onFs = () => { if (!document.fullscreenElement) setFull(false); };
    const onKey = (e) => { if (e.key === "Escape") { if (sheetRef.current !== null) setSheet(null); else setFull(false); } };
    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("fullscreenchange", onFs);
      document.removeEventListener("keydown", onKey);
      try { if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {}); } catch { /* optional */ }
    };
  }, [full]);
  const sheetRef = useRef(null);
  sheetRef.current = sheet;
  useEffect(() => {
    if (full || sheet === null) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setSheet(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [full, sheet]);
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

  const sheetInfo = sheet !== null ? toothInfo(sheet) : null;
  const sheetCodes = sheet !== null ? codesOf(conditions[sheet]) : [];
  const q = query.trim().toLowerCase();
  const sheetGroups = groupPalette(palette)
    .map((g) => ({ ...g, items: q ? g.items.filter((i) => i.label.toLowerCase().includes(q)) : g.items }))
    .filter((g) => g.items.length);
  const sheetCustoms = sheetCodes.filter(isCustomCode);
  const typedCode = customCode(query);
  const typedExists = !!typedCode && (palette.some((p) => p.label.toLowerCase() === q) || sheetCustoms.some((c) => c.toLowerCase() === typedCode.toLowerCase()));
  const toggleOn = (code) => { if (sheet === null) return; if (onRemoveFinding) onRemoveFinding(sheet, code); };

  const modeSwitch = (
    <div role="group" aria-label="How to mark teeth" className="inline-flex rounded-lg border border-rule bg-white p-0.5 text-xs font-semibold">
      {[["tooth", "Tap a tooth first"], ["finding", "Choose a finding first"]].map(([id, label]) => (
        <button key={id} type="button" aria-pressed={mode === id} onClick={() => setMode(id)} className={`rounded-md px-2.5 py-1.5 ${mode === id ? "bg-ink text-white" : "text-slate-600 hover:bg-mist"}`}>{label}</button>
      ))}
    </div>
  );

  const findingChips = (
    <div role="radiogroup" aria-label="Finding to apply" className="space-y-2">
      {groupPalette(palette).map((g) => (
      <div key={g.title}>
      <div className="mb-1 text-[11px] font-semibold text-slate-500">{g.title}</div>
      <div className="flex flex-wrap gap-1.5">
      {g.items.map((item) => {
        const c = colorOf(item.id);
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
      </div>
      ))}
    </div>
  );

  const chartSvg = (big) => (
    <svg
      viewBox="0 0 600 425"
      role="group"
      aria-label={isDeciduous ? "Primary dentition chart" : "Adult dentition chart"}
      className={big ? "mx-auto block h-full w-full max-h-full select-none" : "w-full h-auto min-w-[520px] max-w-[760px] mx-auto block select-none"}
    >
      <text x="300" y="192" textAnchor="middle" fontSize="11" fill="#6b7fa8">Upper jaw</text>
      <text x="300" y="212" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0b1b3a">{mode === "finding" ? `Marking: ${active.label}` : sheet !== null ? `Tooth ${sheet} selected` : "Tap a tooth"}</text>
      <text x="300" y="232" textAnchor="middle" fontSize="11" fill="#6b7fa8">Lower jaw</text>
      <text x="10" y="212" fontSize="11" fill="#6b7fa8">Patient's right</text>
      <text x="590" y="212" textAnchor="end" fontSize="11" fill="#6b7fa8">Patient's left</text>
      {[...upper, ...lower].map((t) => (
        <Tooth key={t.num} t={t} codes={conditions[t.num] || []} labelOf={labelOf} activeLabel={mode === "finding" ? active.label : "choose findings"} onTap={stableTap} planned={plannedTeeth.has(t.num)} />
      ))}
    </svg>
  );

  // One tooth's findings, all in one place: no scrolling back to a list above the chart.
  const toothSheet = sheet !== null && (
    <div role="dialog" aria-label={`Findings for tooth ${sheet}`} data-testid="tooth-sheet" className={`fixed inset-x-0 bottom-0 mx-auto w-full rounded-t-2xl border border-rule bg-white p-4 shadow-2xl overflow-y-auto ${full ? "z-[70] max-h-[58vh] md:inset-x-auto md:bottom-0 md:right-0 md:top-14 md:mx-0 md:max-h-none md:w-[24rem] md:rounded-none md:rounded-tl-2xl" : "z-40 max-w-2xl max-h-[60vh]"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-display text-base font-bold text-ink">Tooth {sheet}</div>
          <div className="text-xs text-slate-500">{sheetInfo.name}. Tap to add or remove. A tooth can have several findings.</div>
        </div>
        <div className="flex shrink-0 items-center gap-2">{sheetCodes.length > 0 && <button type="button" onClick={() => sheetCodes.forEach((c) => toggleOn(c))} className="rounded-lg border border-rule px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-mist">Clear tooth</button>}<button type="button" onClick={() => setSheet(null)} className="rounded-lg bg-ink px-4 py-2 text-xs font-bold text-white">Done</button></div>
      </div>
      <div className="mt-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value.slice(0, MAX_CUSTOM_CHARS))}
          maxLength={MAX_CUSTOM_CHARS}
          aria-label="Type a finding"
          placeholder="Type a finding, e.g. sensitivity"
          className="w-full rounded-lg border border-rule px-3 py-2 text-sm"
        />
        {typedCode && !typedExists && !sheetGroups.some((g) => g.items.some((i) => i.label.toLowerCase() === q)) && (
          <button type="button" onClick={() => { toggleOn(typedCode); setQuery(""); }} className="mt-2 w-full rounded-lg border border-dashed border-blue-300 bg-blue-50 px-3 py-2 text-left text-sm font-semibold text-blue-700">
            Add "{typedCode.slice(2)}" as your own finding
          </button>
        )}
        {sheetCustoms.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Your own findings on this tooth">
            {sheetCustoms.map((c) => (
              <button key={c} type="button" aria-pressed="true" onClick={() => toggleOn(c)} className="rounded-full border border-ink bg-ink px-3 py-1 text-xs font-semibold text-white">
                {findingLabel(c, palette)} ✕
              </button>
            ))}
          </div>
        )}
      </div>
      {onCaries && sheetCodes.includes("CAR") && (
        <div className="mt-3"><CariesEditor tooth={sheet} d={(caries && caries[sheet]) || {}} onCaries={onCaries} compact /></div>
      )}
      <div className="mt-3 max-h-[34vh] space-y-3 overflow-y-auto pr-1" role="group" aria-label={`Findings on tooth ${sheet}`}>
        {sheetGroups.length === 0 && <p className="text-xs text-slate-500">No ready-made finding matches. Add it as your own above.</p>}
        {sheetGroups.map((g) => (
        <div key={g.title}>
        <div className="mb-1 text-[11px] font-semibold text-slate-500">{g.title}</div>
        <div className={`grid grid-cols-2 gap-2 ${full ? "md:grid-cols-2" : "sm:grid-cols-3"}`}>
        {g.items.map((item) => {
          const c = colorOf(item.id);
          const on = sheetCodes.includes(item.id);
          return (
            <button key={item.id} type="button" aria-pressed={on} onClick={() => toggleOn(item.id)} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm ${on ? "border-ink bg-ink text-white font-bold" : "border-rule bg-white text-slate-800 hover:bg-mist"}`}>
              <svg width="14" height="14" aria-hidden="true" className="shrink-0"><rect x="1" y="1" width="12" height="12" rx="4" fill={c.fill} stroke={c.stroke} strokeWidth="1.6" strokeDasharray={c.dash} /></svg>
              <span className="min-w-0 flex-1">{item.label}</span>
              {on && <span aria-hidden="true">✓</span>}
            </button>
          );
        })}
        </div>
        </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="font-display text-base font-bold text-ink">Dental chart</div>
          <div className="text-xs text-slate-500">
            {mode === "tooth"
              ? "Tap a tooth, then choose its findings. A tooth can have several findings. Healthy and Missing stand alone."
              : "Pick a finding, then tap teeth to add it. Tap again to remove that one. Healthy and Missing stand alone."}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">{isDeciduous ? "Primary teeth (20)" : "Adult teeth (32)"}</span>
          <button
            type="button"
            onClick={onToggleDeciduous}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
          >
            {isDeciduous ? "Switch to adult (32)" : "Switch to primary (20)"}
          </button>
          <button type="button" onClick={() => { setSheet(null); setFull(true); }} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-ink text-white hover:bg-slate-800">Full screen</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">{modeSwitch}</div>

      {/* Finding picker (only when you choose the finding first) */}
      {mode === "finding" && !full && findingChips}

      {/* Chart */}
      {full ? (
        <p className="rounded-xl border border-dashed border-rule p-4 text-center text-xs text-slate-500">The chart is open in full screen.</p>
      ) : (
        <div className="rounded-xl border border-rule bg-enamel p-3 sm:p-4 overflow-x-auto">{chartSvg(false)}</div>
      )}

      {full && (
        <div role="dialog" aria-label="Dental chart, full screen" className="fixed inset-0 z-[60] flex flex-col bg-white" data-testid="odo-full">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule px-3 py-2">
            <div className="text-sm font-bold text-ink">Dental chart <span className="font-normal text-slate-500">{count > 0 ? `· ${count} ${count === 1 ? "tooth" : "teeth"} charted` : ""}</span></div>
            <div className="flex flex-wrap items-center gap-2">
              {modeSwitch}
              <button type="button" onClick={onToggleDeciduous} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">{isDeciduous ? "Adult (32)" : "Primary (20)"}</button>
              <button type="button" onClick={() => { setSheet(null); setFull(false); }} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-ink text-white">Exit full screen</button>
            </div>
          </div>
          <div className={`min-h-0 flex-1 bg-enamel p-2 ${sheet !== null ? "pb-[58vh] md:pb-2 md:pr-[25rem]" : ""}`}>{chartSvg(true)}</div>
          {mode === "finding" && <div className="shrink-0 border-t border-rule bg-white p-2 overflow-x-auto" data-testid="odo-dock"><div className="min-w-max sm:min-w-0">{findingChips}</div></div>}
        </div>
      )}
      {toothSheet}

      {plannedTeeth.size > 0 && (
        <p className="flex items-center gap-2 text-xs text-slate-600">
          <svg width="16" height="16" aria-hidden="true">
            <rect x="1.5" y="1.5" width="13" height="13" rx="4.5" fill="none" stroke="#1d4ed8" strokeWidth="1.6" strokeDasharray="3 2.5" />
          </svg>
          Dashed blue outline: treatment planned for tooth {[...plannedTeeth].sort((a, b) => a - b).join(", ")}. Open the Treatment Plan tab for the estimate.
        </p>
      )}

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
              const c = colorOf(code);
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

      {count > 0 && (
        <div>
          <div className="text-sm font-bold text-ink mb-2">By tooth</div>
          <ul className="grid sm:grid-cols-2 gap-1.5">
            {Object.entries(conditions)
              .sort((a, b) => Number(a[0]) - Number(b[0]))
              .map(([tooth, codes]) => (
                <li key={tooth} className="flex flex-wrap items-center gap-1.5 rounded-lg border border-rule bg-white px-2.5 py-1.5 text-sm">
                  <strong className="text-ink tabular-nums w-7">{tooth}</strong>
                  {codes.map((code) => {
                    const c = colorOf(code);
                    return (
                      <span key={code} className="inline-flex items-center gap-1 rounded-full pl-2 pr-1 py-0.5 text-xs font-semibold" style={{ background: c.fill === "none" ? "#f1f5f9" : c.fill, color: "#0b1b3a", border: `1px solid ${c.stroke}` }}>
                        {labelOf(code)}
                        {onRemoveFinding && (
                          <button type="button" onClick={() => onRemoveFinding(Number(tooth), code)} aria-label={`Remove ${labelOf(code)} from tooth ${tooth}`} className="w-4 h-4 rounded-full hover:bg-black/10 leading-none">
                            ×
                          </button>
                        )}
                      </span>
                    );
                  })}
                </li>
              ))}
          </ul>
        </div>
      )}

      {onCaries && Object.entries(conditions).some(([, codes]) => codes.includes("CAR")) && (
        <div data-testid="caries-details">
          <div className="text-sm font-bold text-ink mb-1">Caries details</div>
          <p className="text-xs text-slate-500 mb-2">Mark the surfaces and MeriDent suggests the G.V. Black class. You can change the class. A guide only: the dentist decides.</p>
          <div className="space-y-2">
            {Object.entries(conditions)
              .filter(([, codes]) => codes.includes("CAR"))
              .sort((a, b) => Number(a[0]) - Number(b[0]))
              .map(([tooth]) => {
                return <CariesEditor key={tooth} tooth={tooth} d={(caries && caries[tooth]) || {}} onCaries={onCaries} />;
              })}
          </div>
        </div>
      )}
    </div>
  );
}
