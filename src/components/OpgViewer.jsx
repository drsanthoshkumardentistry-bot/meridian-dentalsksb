import React, { useRef, useState } from "react";
import { Upload, Ruler, Sun, ZoomIn, ZoomOut, RotateCcw, Crosshair, Trash2 } from "lucide-react";
import { pixelDistance, calibrationFactor, formatMeasurement, clampZoom, pointFromClick } from "../opg.js";

const tool = "px-2.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border";

export default function OpgViewer({ patient, onUpload, onRemove, onCalibrate, onAddToNotes, showToast }) {
  const fileRef = useRef(null);
  const frameRef = useRef(null);
  const [natural, setNatural] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [inverted, setInverted] = useState(false);
  const [mode, setMode] = useState("view"); // view | measure | calibrate
  const [points, setPoints] = useState([]);
  const [knownMm, setKnownMm] = useState("");

  const image = patient?.opgImage;
  const mmPerPx = patient?.opgCalibration?.mmPerPx || null;
  const pixels = points.length === 2 ? pixelDistance(points[0], points[1], natural) : 0;

  const reset = () => {
    setZoom(1); setBrightness(100); setContrast(100); setInverted(false); setMode("view"); setPoints([]);
  };

  const click = (e) => {
    if (mode === "view") return;
    const p = pointFromClick(e.clientX, e.clientY, frameRef.current?.getBoundingClientRect());
    if (!p) return;
    setPoints((cur) => (cur.length === 2 ? [p] : [...cur, p]));
  };

  const startMode = (m) => {
    setMode(mode === m ? "view" : m);
    setPoints([]);
    setKnownMm("");
  };

  const saveCalibration = () => {
    const f = calibrationFactor(pixels, knownMm);
    if (!f) return showToast("Enter the real length in millimetres, for example 10.");
    onCalibrate({ mmPerPx: f, knownMm: Number(knownMm), calibratedAt: new Date().toLocaleDateString("en-IN") });
    showToast("Calibrated. Measurements now show millimetres.");
    setMode("measure");
    setPoints([]);
    setKnownMm("");
  };

  const filter = `${inverted ? "invert(1) " : ""}brightness(${brightness}%) contrast(${contrast}%)`;
  const marker = (p, i) => (
    <span
      key={i}
      aria-hidden="true"
      className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full border-2 border-white shadow"
      style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, background: mode === "calibrate" ? "#38bdf8" : "#f59e0b" }}
    />
  );

  return (
    <div className="bg-ink rounded-2xl p-4 sm:p-5 text-white space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-display font-bold">Panoramic film (OPG)</div>
          <div className="text-[11px] text-blue-100/70">
            {patient ? patient.name : "No patient selected"}
            {patient?.opgUploadedAt ? ` · added ${patient.opgUploadedAt}` : ""}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="file" ref={fileRef} onChange={onUpload} accept="image/*" className="hidden" aria-label="Choose OPG image" />
          <button type="button" onClick={() => fileRef.current?.click()} className={`${tool} bg-brand-600 border-brand-600 text-white`}>
            <Upload className="w-3.5 h-3.5" /> {image ? "Replace film" : "Insert film"}
          </button>
          {image && (
            <button
              type="button"
              onClick={() => { if (confirm("Remove this film from the patient record?")) { onRemove(); reset(); } }}
              className={`${tool} border-white/20 text-blue-100 hover:bg-white/10`}
              aria-label="Remove film"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {image && (
        <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Film tools">
          <button type="button" onClick={() => setZoom(clampZoom(zoom - 0.5))} aria-label="Zoom out" className={`${tool} border-white/20 hover:bg-white/10`}><ZoomOut className="w-3.5 h-3.5" /></button>
          <span className="text-xs tabular w-10 text-center" aria-live="polite">{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => setZoom(clampZoom(zoom + 0.5))} aria-label="Zoom in" className={`${tool} border-white/20 hover:bg-white/10`}><ZoomIn className="w-3.5 h-3.5" /></button>
          <button type="button" aria-pressed={inverted} onClick={() => setInverted(!inverted)} className={`${tool} ${inverted ? "bg-white text-ink border-white" : "border-white/20 hover:bg-white/10"}`}>
            <Sun className="w-3.5 h-3.5" /> Invert
          </button>
          <button type="button" aria-pressed={mode === "measure"} onClick={() => startMode("measure")} className={`${tool} ${mode === "measure" ? "bg-amber-500 border-amber-500 text-white" : "border-white/20 hover:bg-white/10"}`}>
            <Ruler className="w-3.5 h-3.5" /> Measure
          </button>
          <button type="button" aria-pressed={mode === "calibrate"} onClick={() => startMode("calibrate")} className={`${tool} ${mode === "calibrate" ? "bg-sky-500 border-sky-500 text-white" : "border-white/20 hover:bg-white/10"}`}>
            <Crosshair className="w-3.5 h-3.5" /> Calibrate
          </button>
          <button type="button" onClick={reset} className={`${tool} border-white/20 hover:bg-white/10`}><RotateCcw className="w-3.5 h-3.5" /> Reset view</button>
        </div>
      )}

      <div className="rounded-xl bg-black/40 border border-white/10 overflow-auto max-h-[28rem]" data-testid="opg-frame-scroll">
        {image ? (
          <div
            ref={frameRef}
            onClick={click}
            className={`relative ${mode === "view" ? "cursor-default" : "cursor-crosshair"}`}
            style={{ width: `${zoom * 100}%`, aspectRatio: natural ? `${natural.w} / ${natural.h}` : undefined }}
          >
            <img
              src={image}
              alt="Panoramic radiograph"
              draggable={false}
              onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
              className="block w-full h-full select-none"
              style={{ filter }}
            />
            {points.length === 2 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
                <line x1={`${points[0].x * 100}%`} y1={`${points[0].y * 100}%`} x2={`${points[1].x * 100}%`} y2={`${points[1].y * 100}%`} stroke={mode === "calibrate" ? "#38bdf8" : "#f59e0b"} strokeWidth="2" strokeDasharray="5 3" />
              </svg>
            )}
            {points.map(marker)}
          </div>
        ) : (
          <div className="text-center p-10 text-blue-100/70">
            <Upload className="w-8 h-8 mx-auto mb-2 opacity-60" aria-hidden="true" />
            <p className="text-sm">No OPG film for this patient yet.</p>
            <p className="text-xs mt-1">Insert a JPG or PNG of the panoramic film.</p>
          </div>
        )}
      </div>

      {image && (
        <div className="grid grid-cols-2 gap-3 text-xs">
          <label className="flex items-center gap-2">Brightness
            <input type="range" min="50" max="200" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="flex-1" aria-label="Brightness" />
          </label>
          <label className="flex items-center gap-2">Contrast
            <input type="range" min="50" max="250" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="flex-1" aria-label="Contrast" />
          </label>
        </div>
      )}

      {image && mode === "measure" && (
        <div className="rounded-lg bg-white/5 border border-white/10 p-3 text-xs space-y-1.5" role="status">
          {!mmPerPx && <p className="text-amber-300">Not calibrated yet. Use Calibrate on something of known length, such as an implant or a crown, to get millimetres.</p>}
          {points.length < 2 ? <p>Tap two points on the film to measure between them.</p> : (
            <div className="flex flex-wrap items-center gap-2">
              <strong className="text-base text-white" data-testid="opg-measure">{formatMeasurement(pixels, mmPerPx)}</strong>
              {mmPerPx && (
                <button type="button" onClick={() => onAddToNotes(`OPG measurement: about ${formatMeasurement(pixels, mmPerPx)}`)} className={`${tool} border-white/20 hover:bg-white/10`}>
                  Add to diagnosis notes
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {image && mode === "calibrate" && (
        <div className="rounded-lg bg-white/5 border border-white/10 p-3 text-xs space-y-2" role="status">
          <p>Tap both ends of an object whose real length you know, then enter that length.</p>
          {points.length === 2 && (
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="opg-known" className="font-semibold">Real length (mm)</label>
              <input id="opg-known" inputMode="decimal" value={knownMm} onChange={(e) => setKnownMm(e.target.value)} className="w-24 px-2 py-1 rounded bg-white text-ink" />
              <button type="button" onClick={saveCalibration} className={`${tool} bg-sky-500 border-sky-500 text-white`}>Save calibration</button>
            </div>
          )}
          {mmPerPx && <p className="text-blue-100/70">Current calibration: {patient.opgCalibration.knownMm} mm reference, set {patient.opgCalibration.calibratedAt}.</p>}
        </div>
      )}

      <p className="text-[11px] text-blue-100/60">
        Panoramic films stretch and blur differently across the image, so measurements are approximate. Calibrate close to the area you measure, and confirm any critical measurement with a periapical film or CBCT.
      </p>
    </div>
  );
}
