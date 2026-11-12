// Caries details for one tooth: G.V. Black class (I to VI), surfaces and depth. A chairside aid; the dentist decides.
import { toothInfo } from "./odontogram.js";

export const CARIES_CLASSES = [
  { id: "I", label: "Class I", text: "Pits and fissures (occlusal, buccal or lingual pits, palatal pit of upper incisors)" },
  { id: "II", label: "Class II", text: "Proximal surface of a premolar or molar" },
  { id: "III", label: "Class III", text: "Proximal surface of an incisor or canine, incisal angle not involved" },
  { id: "IV", label: "Class IV", text: "Proximal surface of an incisor or canine, incisal angle involved" },
  { id: "V", label: "Class V", text: "Cervical third of the tooth, near the gum (facial or lingual)" },
  { id: "VI", label: "Class VI", text: "Incisal edge or cusp tip" },
];
export const CLASS_IDS = CARIES_CLASSES.map((c) => c.id);

export const SURFACES = ["M", "O", "D", "B", "L"];
export const surfaceName = (s, tooth) => {
  const front = tooth && ["incisor", "canine"].includes((toothInfo(tooth) || {}).type);
  return { M: "Mesial", D: "Distal", B: front ? "Labial" : "Buccal", L: front ? "Palatal / lingual" : "Lingual / palatal", O: front ? "Incisal" : "Occlusal" }[s] || s;
};

export const DEPTHS = [
  { id: "enamel", label: "Enamel", hint: "Early lesion: preventive care and review" },
  { id: "dentine", label: "Dentine", hint: "Usually needs a filling" },
  { id: "pulp", label: "Near or into pulp", hint: "May need a root canal or other pulp care" },
];
export const DEPTH_IDS = DEPTHS.map((d) => d.id);

/** Suggests a Black class from the tooth and the marked surfaces. Returns "" when it cannot tell. */
export const suggestClass = (tooth, { surfaces = [], cervical = false, tip = false } = {}) => {
  const info = toothInfo(tooth);
  if (!info) return "";
  const s = new Set(surfaces);
  const front = info.type === "incisor" || info.type === "canine";
  const proximal = s.has("M") || s.has("D");
  if (cervical) return "V";
  if (tip && !proximal) return "VI";
  if (!front) return proximal ? "II" : s.size || tip ? "I" : "";
  if (proximal) return s.has("O") ? "IV" : "III";
  if (s.has("O")) return "VI";
  return s.size ? "I" : "";
};

const clean = (d = {}, tooth) => {
  const surfaces = SURFACES.filter((x) => Array.isArray(d.surfaces) && d.surfaces.includes(x));
  return {
    cls: CLASS_IDS.includes(d.cls) ? d.cls : "",
    surfaces,
    cervical: !!d.cervical,
    tip: !!d.tip,
    depth: DEPTH_IDS.includes(d.depth) ? d.depth : "",
    // true once the dentist picks the class by hand, so the suggestion stops overwriting it
    manual: !!d.manual,
  };
};

/** New details map with the change applied. Picking surfaces re-suggests the class unless it was chosen by hand. */
export const setCariesDetail = (details = {}, tooth, patch = {}) => {
  const base = details && typeof details === "object" && !Array.isArray(details) ? details : {};
  const key = String(tooth);
  const merged = clean({ ...clean(base[key]), ...patch }, tooth);
  if (patch.cls !== undefined) merged.manual = merged.cls !== "";
  else if (!merged.manual && ("surfaces" in patch || "cervical" in patch || "tip" in patch)) merged.cls = suggestClass(tooth, merged);
  return { ...base, [key]: merged };
};

/** Keeps details only for teeth that still carry the Caries finding. */
export const pruneCariesDetails = (details = {}, conditions = {}) => {
  const out = {};
  Object.entries(details && typeof details === "object" ? details : {}).forEach(([t, d]) => {
    const codes = conditions[t];
    if (Array.isArray(codes) ? codes.includes("CAR") : codes === "CAR") out[t] = d;
  });
  return out;
};

/** "Class II (MO), dentine" */
export const cariesText = (d) => {
  if (!d) return "";
  const parts = [];
  const surf = [...(d.surfaces || []).filter((s) => s === "M"), ...(d.surfaces || []).filter((s) => s === "O"), ...(d.surfaces || []).filter((s) => s === "D"), ...(d.surfaces || []).filter((s) => s === "B" || s === "L")].join("");
  if (d.cls) parts.push(`Class ${d.cls}${surf ? ` (${surf})` : ""}`);
  else if (surf) parts.push(surf);
  if (d.cervical && d.cls !== "V") parts.push("cervical");
  const depth = DEPTHS.find((x) => x.id === d.depth);
  if (depth) parts.push(depth.label.toLowerCase());
  return parts.join(", ");
};
