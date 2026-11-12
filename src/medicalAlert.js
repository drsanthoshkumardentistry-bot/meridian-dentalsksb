/* ==============================================================================
 * MERIDENT OS - MEDICAL ALERT (pure functions)
 * One alert line for the top of a chart, built from every place a medical fact can be entered:
 * the alert text, the ticked systemic conditions, the typed conditions, drug allergies and regular medicines.
 * Nothing is lost if one place is left empty, and nothing is typed twice.
 * ============================================================================== */

export const SYSTEMIC_CONDITIONS = [
  { id: "hypertension", label: "Hypertension (BP)", short: "Hypertension" },
  { id: "hypotension", label: "Hypotension (low BP)", short: "Hypotension" },
  { id: "diabetes", label: "Diabetes Mellitus", short: "Diabetes" },
  { id: "thyroid", label: "Thyroid (Thyroxine)", short: "Thyroid" },
  { id: "cardiac", label: "Heart Disease", short: "Heart disease" },
  { id: "allergy", label: "Drug Allergies", short: "Drug allergy" },
  { id: "bleeding", label: "Bleeding Diathesis", short: "Bleeding disorder" },
  { id: "respiratory", label: "Asthma / Respiratory", short: "Asthma" },
  { id: "epilepsy", label: "Epileptic Seizures", short: "Epilepsy" },
];

const NONE = /^(none|nil|no|nkda|n\/a|na|not recorded|-)$/i;
const clean = (v) => String(v ?? "").trim().replace(/\s+/g, " ");

/** Alert parts in order, without repeats (case ignored) and without "None" style answers. */
export const alertParts = (patient = {}) => {
  const p = patient || {};
  const raw = [];
  for (const piece of clean(p.medicalAlert).split(/[,;\n]+/)) raw.push(piece);
  for (const c of SYSTEMIC_CONDITIONS) if (p.systemic && p.systemic[c.id]) raw.push(c.short);
  for (const piece of clean(p.conditions).split(/[,;\n]+/)) raw.push(piece);
  const seen = new Set();
  const out = [];
  for (const r of raw) {
    const t = clean(r);
    if (!t || NONE.test(t)) continue;
    const k = t.toLowerCase();
    // "Thyroid" typed by hand and "Thyroid" from the tick box are one fact
    if ([...seen].some((s) => s === k || s.startsWith(k + " ") || k.startsWith(s + " "))) continue;
    seen.add(k);
    out.push(t);
  }
  const allergy = clean(p.allergies);
  if (allergy && !NONE.test(allergy)) out.push(`Allergic to ${allergy}`);
  return out;
};

export const alertText = (patient) => alertParts(patient).join(", ");

/** Medicines the patient takes regularly, or "" when none are recorded. */
export const regularMedicines = (patient) => {
  const m = clean(patient?.currentMedicines);
  return m && !NONE.test(m) ? m : "";
};
