/* ==============================================================================
 * MERIDENT OS - PATIENT LABELS (pure functions, no React)
 * Colour-coded tags such as VIP, Child or Diabetic. Stored on the patient as patient.labels (ids).
 * The tone classes are written out in full so Tailwind keeps them.
 * ============================================================================== */

export const MAX_LABELS = 5;

export const LABEL_TONES = {
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  rose: "bg-rose-50 text-rose-700 border-rose-200",
  amber: "bg-amber-50 text-amber-800 border-amber-200",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  violet: "bg-violet-50 text-violet-700 border-violet-200",
  teal: "bg-teal-50 text-teal-700 border-teal-200",
  slate: "bg-slate-100 text-slate-700 border-slate-300",
};

export const LABELS = [
  { id: "vip", name: "VIP", tone: "amber" },
  { id: "child", name: "Child", tone: "teal" },
  { id: "senior", name: "Senior", tone: "slate" },
  { id: "ortho", name: "Braces", tone: "violet" },
  { id: "implant", name: "Implant", tone: "blue" },
  { id: "diabetic", name: "Diabetic", tone: "rose" },
  { id: "bp", name: "Blood pressure", tone: "rose" },
  { id: "pregnant", name: "Pregnant", tone: "violet" },
  { id: "anxious", name: "Anxious", tone: "emerald" },
  { id: "followup", name: "Follow up", tone: "amber" },
];

const BY_ID = new Map(LABELS.map((l) => [l.id, l]));

/** The patient's labels as full objects, in the order they were added. Unknown ids are ignored. */
export const labelsOf = (patient) =>
  (Array.isArray(patient?.labels) ? patient.labels : []).map((id) => BY_ID.get(id)).filter(Boolean);

export const hasLabel = (patient, id) => (Array.isArray(patient?.labels) ? patient.labels.includes(id) : false);

/** Adds the label, or removes it if present. Returns { patient, error } and never goes past MAX_LABELS. */
export const toggleLabel = (patient, id) => {
  if (!BY_ID.has(id)) return { patient, error: "Unknown label" };
  const current = Array.isArray(patient.labels) ? patient.labels.filter((x) => BY_ID.has(x)) : [];
  if (current.includes(id)) return { patient: { ...patient, labels: current.filter((x) => x !== id) }, error: "" };
  if (current.length >= MAX_LABELS) return { patient, error: `A patient can have up to ${MAX_LABELS} labels` };
  return { patient: { ...patient, labels: [...current, id] }, error: "" };
};

/** Keeps patients that have the label. An empty id keeps everyone. */
export const filterByLabel = (patients, id) => (id ? patients.filter((p) => hasLabel(p, id)) : patients);
