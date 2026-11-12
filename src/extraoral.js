// Extra-oral examination: the face, jaw joints, glands, lips and skin, looked at before the mouth is opened.
// A record of what the dentist observed, not a diagnosis.
export const MAX_EXAMS = 10;

export const FIELDS = [
  { key: "symmetry", group: "Face", label: "Facial symmetry", options: ["Symmetrical", "Asymmetrical"], normal: "Symmetrical" },
  { key: "profile", group: "Face", label: "Facial profile", options: ["Straight", "Convex", "Concave"], normal: "Straight" },
  { key: "swelling", group: "Face", label: "Swelling", options: ["None", "Right side", "Left side", "Both sides"], normal: "None" },
  { key: "skin", group: "Face", label: "Skin", options: ["Normal", "Scar", "Lesion", "Sinus / draining tract"], normal: "Normal" },
  { key: "lips", group: "Lips", label: "Lips", options: ["Competent", "Incompetent", "Cracks or sores", "Swelling"], normal: "Competent" },
  { key: "tmjClick", group: "Jaw joint (TMJ)", label: "Clicking", options: ["None", "Right", "Left", "Both"], normal: "None" },
  { key: "tmjPain", group: "Jaw joint (TMJ)", label: "Pain or tenderness", options: ["None", "Right", "Left", "Both"], normal: "None" },
  { key: "deviation", group: "Jaw joint (TMJ)", label: "Jaw deviates on opening", options: ["None", "To the right", "To the left"], normal: "None" },
  { key: "submandibular", group: "Lymph nodes", label: "Submandibular", options: ["Not palpable", "Palpable, not tender", "Palpable, tender"], normal: "Not palpable" },
  { key: "submental", group: "Lymph nodes", label: "Submental", options: ["Not palpable", "Palpable, not tender", "Palpable, tender"], normal: "Not palpable" },
  { key: "cervical", group: "Lymph nodes", label: "Cervical", options: ["Not palpable", "Palpable, not tender", "Palpable, tender"], normal: "Not palpable" },
];

export const GROUPS = [...new Set(FIELDS.map((f) => f.group))];

export const newExam = (id, date) => ({ id, date, fields: {}, mouthOpening: null, notes: "" });

export const setField = (exam, key, value) => {
  const f = FIELDS.find((x) => x.key === key);
  if (!f) return exam;
  const fields = { ...exam.fields };
  if (value === "" || value == null) delete fields[key];
  else if (f.options.includes(value)) fields[key] = value;
  else return exam;
  return { ...exam, fields };
};

/** Maximum mouth opening in mm (interincisal). Empty clears it. */
export const setMouthOpening = (exam, value) => {
  if (value === "" || value == null) return { ...exam, mouthOpening: null };
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n >= 0 && n <= 90 ? { ...exam, mouthOpening: n } : exam;
};
export const setNotes = (exam, text) => ({ ...exam, notes: String(text || "").slice(0, 600) });

/** What differs from the usual finding, in plain words. Mouth opening under 35 mm is flagged as limited. */
export const findings = (exam) => {
  const out = FIELDS.filter((f) => exam.fields[f.key] && exam.fields[f.key] !== f.normal).map((f) => ({ label: f.label, value: exam.fields[f.key] }));
  if (exam.mouthOpening != null && exam.mouthOpening < 35) out.push({ label: "Mouth opening", value: `${exam.mouthOpening} mm (limited)` });
  return out;
};

export const hasEntries = (exam) => Object.keys(exam.fields || {}).length > 0 || exam.mouthOpening != null || Boolean((exam.notes || "").trim());

/** Newest first, replacing an exam with the same id, capped. */
export const saveExam = (exams = [], exam) => {
  const rest = (Array.isArray(exams) ? exams : []).filter((e) => e.id !== exam.id);
  return [exam, ...rest].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)).slice(0, MAX_EXAMS);
};

/** Fields whose value changed between two exams, for a quick comparison. */
export const changes = (before, after) =>
  FIELDS.filter((f) => before.fields[f.key] && after.fields[f.key] && before.fields[f.key] !== after.fields[f.key]).map((f) => ({
    label: f.label, from: before.fields[f.key], to: after.fields[f.key],
  }));
