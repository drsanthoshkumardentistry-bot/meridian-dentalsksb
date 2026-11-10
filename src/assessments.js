import { dateKey } from "./reminders.js";

// ---- Caries risk (chairside screening aid; the dentist makes the final call) ----
export const CARIES_FACTORS = [
  { id: "sugar", label: "Sugary food or drinks 4 or more times a day", weight: 1 },
  { id: "plaque", label: "Visible plaque or poor brushing", weight: 1 },
  { id: "newLesions", label: "New cavities or fillings in the last year", weight: 2 },
  { id: "dryMouth", label: "Dry mouth (medicines, illness or radiation)", weight: 1 },
  { id: "noFluoride", label: "Not using fluoride toothpaste", weight: 1 },
  { id: "appliance", label: "Braces or other appliance", weight: 1 },
  { id: "tobacco", label: "Tobacco or betel quid use", weight: 1 },
  { id: "irregular", label: "Visits the dentist only when in pain", weight: 1 },
];

export const scoreCaries = (answers = {}) => {
  const score = CARIES_FACTORS.reduce((s, f) => s + (answers[f.id] ? f.weight : 0), 0);
  const level = score >= 4 ? "High" : score >= 2 ? "Moderate" : "Low";
  const recallMonths = level === "High" ? 3 : level === "Moderate" ? 4 : 6;
  const advice = {
    Low: ["Routine check-up", "Fluoride toothpaste twice daily"],
    Moderate: ["Fluoride varnish at each recall", "Diet advice and brushing coaching", "Consider pit and fissure sealants"],
    High: ["Fluoride varnish every visit", "High-fluoride toothpaste", "Seal susceptible molars", "Strict sugar-frequency diet plan", "Recall every 3 months"],
  }[level];
  return { score, level, recallMonths, advice };
};

// ---- Basic Periodontal Examination: highest score per sextant ----
export const BPE_SEXTANTS = [
  { id: "UR", label: "Upper right (17-14)" },
  { id: "UA", label: "Upper front (13-23)" },
  { id: "UL", label: "Upper left (24-27)" },
  { id: "LL", label: "Lower left (37-34)" },
  { id: "LA", label: "Lower front (33-43)" },
  { id: "LR", label: "Lower right (44-47)" },
];
export const BPE_CODES = ["0", "1", "2", "3", "4", "*"];

const BPE_GUIDE = {
  0: "Healthy gums. Routine care.",
  1: "Bleeding on probing. Oral hygiene instruction.",
  2: "Calculus or overhangs. Oral hygiene instruction, scaling and removal of plaque traps.",
  3: "Pockets of 4 to 5.5 mm. Full periodontal assessment and root surface debridement.",
  4: "Pockets over 5.5 mm. Full periodontal assessment, charting, and consider specialist referral.",
};

export const scoreBpe = (sextants = {}) => {
  const entries = BPE_SEXTANTS.map((s) => [s.id, String(sextants[s.id] ?? "")]);
  if (entries.some(([, v]) => !BPE_CODES.includes(v))) return { ok: false, error: "Score all six sextants" };
  const numeric = entries.map(([, v]) => (v === "*" ? 4 : Number(v)));
  const highest = Math.max(...numeric);
  const furcation = entries.some(([, v]) => v === "*");
  return { ok: true, highest, furcation, guidance: BPE_GUIDE[highest] + (furcation ? " Furcation involvement noted." : ""), needsFullChart: highest >= 3 };
};

export const buildAssessment = (type, input, id, now = new Date()) => {
  if (type === "caries") return { ok: true, assessment: { id, type, date: dateKey(now), answers: { ...input }, result: scoreCaries(input) } };
  if (type === "bpe") {
    const r = scoreBpe(input);
    if (!r.ok) return r;
    return { ok: true, assessment: { id, type, date: dateKey(now), sextants: { ...input }, result: r } };
  }
  return { ok: false, error: "Unknown assessment" };
};

export const addAssessment = (patient, a) => ({ ...patient, assessments: [a, ...(patient.assessments || [])].slice(0, 50) });
export const removeAssessment = (patient, id) => ({ ...patient, assessments: (patient.assessments || []).filter((a) => a.id !== id) });
