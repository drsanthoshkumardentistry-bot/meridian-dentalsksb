/* ==============================================================================
 * MERIDENT OS - MEDICAL ALERT (pure functions)
 * One alert line for the top of a chart, built from every place a medical fact can be entered:
 * the alert text, the ticked systemic conditions, the typed conditions, drug allergies and regular medicines.
 * Nothing is lost if one place is left empty, and nothing is typed twice.
 * ============================================================================== */

/** Medical history grouped by body system. Ids never change, so records already saved keep working. */
export const SYSTEM_GROUPS = [
  { id: "cardio", title: "Cardiovascular system", items: [
    { id: "hypertension", label: "Hypertension (BP)", short: "Hypertension" },
    { id: "hypotension", label: "Hypotension (low BP)", short: "Hypotension" },
    { id: "cardiac", label: "Heart Disease", short: "Heart disease" },
    { id: "rheumatic", label: "Rheumatic fever / valve disease", short: "Rheumatic fever or valve disease" },
    { id: "pacemaker", label: "Pacemaker / heart stent", short: "Pacemaker or stent" },
    { id: "stroke", label: "Stroke", short: "Stroke" },
  ] },
  { id: "resp", title: "Respiratory system", items: [
    { id: "respiratory", label: "Asthma / Respiratory", short: "Asthma" },
    { id: "tb", label: "Tuberculosis", short: "Tuberculosis" },
  ] },
  { id: "endo", title: "Endocrine and metabolic", items: [
    { id: "diabetes", label: "Diabetes Mellitus", short: "Diabetes" },
    { id: "thyroid", label: "Thyroid (Thyroxine)", short: "Thyroid" },
  ] },
  { id: "neuro", title: "Nervous system", items: [
    { id: "epilepsy", label: "Epileptic Seizures", short: "Epilepsy" },
    { id: "psychiatric", label: "Anxiety / depression / psychiatric", short: "Psychiatric condition" },
  ] },
  { id: "blood", title: "Blood and immunity", items: [
    { id: "bleeding", label: "Bleeding Diathesis", short: "Bleeding disorder" },
    { id: "bloodthinner", label: "Blood thinners (warfarin, aspirin)", short: "On blood thinners" },
    { id: "anaemia", label: "Anaemia", short: "Anaemia" },
    { id: "allergy", label: "Drug Allergies", short: "Drug allergy" },
  ] },
  { id: "infect", title: "Infections", items: [
    { id: "hepatitis", label: "Hepatitis B or C", short: "Hepatitis B or C" },
    { id: "hiv", label: "HIV / low immunity", short: "HIV or low immunity" },
  ] },
  { id: "gi", title: "Liver, kidney and stomach", items: [
    { id: "liver", label: "Jaundice / liver disease", short: "Liver disease" },
    { id: "kidney", label: "Kidney disease / dialysis", short: "Kidney disease" },
    { id: "gastric", label: "Acidity / stomach ulcer", short: "Acidity or ulcer" },
  ] },
  { id: "bone", title: "Bones and joints", items: [
    { id: "arthritis", label: "Arthritis", short: "Arthritis" },
    { id: "osteoporosis", label: "Osteoporosis / bone drugs", short: "Osteoporosis" },
  ] },
  { id: "women", title: "Women's health", items: [
    { id: "pregnancy", label: "Pregnant / breastfeeding", short: "Pregnant or breastfeeding" },
  ] },
];

/** Every condition in one list (used for the alert line). */
export const SYSTEMIC_CONDITIONS = SYSTEM_GROUPS.flatMap((g) => g.items);

/** Ticked conditions per system, for headings such as "Cardiovascular system (2)". */
export const tickedInGroup = (patient, group) => group.items.filter((c) => patient?.systemic && patient.systemic[c.id]).length;

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
