/* ==============================================================================
 * MERIDENT OS - CHAIRSIDE CAD/CAM CASES (pure functions, no React)
 * A case follows one restoration from intraoral scan to fitting. Cases live on the patient (patient.cadCases),
 * so they sync, back up and follow the same access as the chart. Scan files are viewed on the device and are not uploaded.
 * ============================================================================== */

import { parseAnyDate } from "./reminders.js";
import { parseTeeth } from "./plans.js";
import { toothInfo } from "./odontogram.js";

export const RESTORATIONS = ["Crown", "Inlay / onlay", "Veneer", "Bridge", "Implant crown", "Surgical guide", "Night guard", "Temporary crown", "Other"];
export const MATERIALS = ["Zirconia", "Lithium disilicate (e.max)", "Hybrid ceramic", "Composite resin", "PMMA (temporary)", "Titanium", "Other"];
export const STAGES = ["scanned", "designed", "milled", "finished", "fitted"];
export const STAGE_LABEL = { scanned: "Scanned", designed: "Designed", milled: "Milled", finished: "Finished", fitted: "Fitted", cancelled: "Cancelled" };
export const STAGE_ACTION = { designed: "Design done", milled: "Milling done", finished: "Sintered / polished", fitted: "Fitted in mouth" };
export const OPEN_STAGES = ["scanned", "designed", "milled", "finished"];
export const MAX_SCAN_BYTES = 200 * 1024 * 1024;

export const validateCase = (d = {}) => {
  if (!RESTORATIONS.includes(d.restoration)) return "Choose the type of restoration";
  if (!MATERIALS.includes(d.material)) return "Choose the material";
  const raw = String(d.teeth || "").trim();
  if (!raw) return "Enter the tooth number, for example 36";
  if (parseTeeth(raw).some((n) => !toothInfo(n))) return "Tooth numbers must be valid FDI numbers such as 16 or 46, separated by commas";
  if (!parseAnyDate(d.scannedOn)) return "Choose the scan date";
  for (const k of ["scanner", "software", "mill"]) if (String(d[k] || "").length > 60) return "Keep scanner, software and mill names under 60 characters";
  if (String(d.shade || "").length > 20) return "Keep the shade under 20 characters";
  if (String(d.note || "").length > 300) return "Keep the note under 300 characters";
  return "";
};

export const createCase = (d, id, now = new Date()) => ({
  id,
  restoration: d.restoration,
  material: d.material,
  teeth: parseTeeth(d.teeth).join(", "),
  shade: String(d.shade || "").trim().slice(0, 20),
  scanner: String(d.scanner || "").trim(),
  software: String(d.software || "").trim(),
  mill: String(d.mill || "").trim(),
  note: String(d.note || "").trim(),
  stage: "scanned",
  dates: { scanned: d.scannedOn },
  scanFile: null,
  createdAt: now.toISOString(),
});

export const nextStage = (c) => {
  const i = STAGES.indexOf(c?.stage);
  return i >= 0 && i < STAGES.length - 1 ? STAGES[i + 1] : "";
};

/** Move a case one step forward (or cancel it). Stages cannot be skipped or reopened, so the record stays honest. */
export const advanceCase = (c, to, now = new Date()) => {
  if (!c) return c;
  if (to === "cancelled") return OPEN_STAGES.includes(c.stage) ? { ...c, stage: "cancelled", dates: { ...c.dates, cancelled: dayKey(now) } } : c;
  if (to !== nextStage(c)) return c;
  return { ...c, stage: to, dates: { ...c.dates, [to]: dayKey(now) } };
};

const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Remember which scan file was viewed (name, size, triangle count). The file itself is not stored. */
export const attachScan = (c, info) => ({ ...c, scanFile: { name: String(info.name || "scan.stl").slice(0, 120), bytes: Math.max(0, Number(info.bytes) || 0), triangles: Math.max(0, Number(info.triangles) || 0) } });

export const openCases = (patients = []) => patients.flatMap((p) => (Array.isArray(p.cadCases) ? p.cadCases : []).filter((c) => OPEN_STAGES.includes(c.stage)).map((c) => ({ ...c, patientId: p.id, patientName: p.name })));

/** Parse an STL file (binary or ASCII) into flat vertex positions. Returns { positions, triangles } or { error }. */
export const parseStl = (buffer) => {
  if (Object.prototype.toString.call(buffer) !== "[object ArrayBuffer]" || buffer.byteLength < 15) return { error: "This file is too small to be a scan" };
  const view = new DataView(buffer);
  const n = buffer.byteLength >= 84 ? view.getUint32(80, true) : 0;
  const binaryOk = buffer.byteLength >= 84 && 84 + n * 50 === buffer.byteLength && n > 0;
  if (binaryOk) {
    const positions = new Float32Array(n * 9);
    let o = 84;
    for (let t = 0; t < n; t++) {
      o += 12;
      for (let k = 0; k < 9; k++, o += 4) positions[t * 9 + k] = view.getFloat32(o, true);
      o += 2;
    }
    if (positions.some((v) => !Number.isFinite(v))) return { error: "This scan file is damaged" };
    return { positions, triangles: n };
  }
  const text = new TextDecoder().decode(buffer);
  if (!/^\s*solid/i.test(text)) return { error: "This is not an STL file. Export the scan as STL and try again" };
  const nums = [];
  const re = /vertex\s+([-+0-9.eE]+)\s+([-+0-9.eE]+)\s+([-+0-9.eE]+)/g;
  let m;
  while ((m = re.exec(text))) nums.push(Number(m[1]), Number(m[2]), Number(m[3]));
  if (nums.length < 9 || nums.length % 9 !== 0 || nums.some((v) => !Number.isFinite(v))) return { error: "This scan file is damaged or empty" };
  return { positions: Float32Array.from(nums), triangles: nums.length / 9 };
};
