import { dateKey } from "./reminders.js";

export const VISIT_FIELDS = ["complaint", "findings", "treatment", "advice"];

/** Validate and shape a visit note. Returns { ok, visit } or { ok: false, error }. */
export const buildVisit = (form, id, now = new Date()) => {
  const clean = (v) => String(v || "").trim().slice(0, 2000);
  const visit = { id, date: form.date || dateKey(now) };
  VISIT_FIELDS.forEach((f) => (visit[f] = clean(form[f])));
  visit.nextVisit = String(form.nextVisit || "").trim().slice(0, 200);
  visit.nextVisitOn = /^\d{4}-\d{2}-\d{2}$/.test(String(form.nextVisitOn || "")) ? form.nextVisitOn : "";
  if (!VISIT_FIELDS.some((f) => visit[f])) return { ok: false, error: "Write at least a complaint, finding, treatment or advice" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(visit.date)) return { ok: false, error: "Choose the visit date" };
  if (visit.date > dateKey(now)) return { ok: false, error: "The visit date cannot be in the future" };
  if (visit.nextVisitOn && visit.nextVisitOn < visit.date) return { ok: false, error: "The next visit date cannot be before this visit" };
  return { ok: true, visit };
};

/** Newest visit first; same-day notes keep the most recently added first. */
export const sortVisits = (visits = []) =>
  visits.filter(Boolean).map((v, i) => ({ v, i })).sort((a, b) => String(b.v.date || "").localeCompare(String(a.v.date || "")) || a.i - b.i).map((x) => x.v);

export const addVisit = (patient, visit) => ({ ...patient, visits: sortVisits([visit, ...(Array.isArray(patient.visits) ? patient.visits : [])]) });
export const removeVisit = (patient, visitId) => ({ ...patient, visits: (patient.visits || []).filter((v) => v.id !== visitId) });

/** The reception intake (chief complaint) becomes the patient's first visit note, so the doctor need not retype it. */
export const intakeVisit = (form, id, now = new Date()) => {
  const complaint = String(form?.chiefComplaint || "").trim();
  if (!complaint) return null;
  const built = buildVisit({ complaint, date: dateKey(now) }, id, now);
  return built.ok ? { ...built.visit, fromIntake: true } : null;
};

/** One-click "No relevant history": conditions and allergies read None / NRH and the red alert stays clear. */
export const NRH_TEXT = "None / NRH";
export const applyNrh = (patient) => ({ ...patient, conditions: NRH_TEXT, allergies: NRH_TEXT, nrh: true });
export const clearNrh = (patient) => ({ ...patient, conditions: patient.conditions === NRH_TEXT ? "" : patient.conditions, allergies: patient.allergies === NRH_TEXT ? "" : patient.allergies, nrh: false });

/** Roles that may correct a saved visit note. */
export const canEditVisits = (role) => role === "owner" || role === "manager" || role === "dentist";

/** Load a saved note into the form for editing. */
export const visitToForm = (v = {}) => ({ complaint: v.complaint || "", findings: v.findings || "", treatment: v.treatment || "", advice: v.advice || "", nextVisit: v.nextVisit || "", nextVisitOn: v.nextVisitOn || "", date: v.date || "" });

/**
 * Save a correction to an existing note. The note keeps its id and position; an "Edited on" stamp and a short history
 * (who, when) are added so the original entry can never be silently changed.
 */
export const editVisit = (patient, visitId, form, by = "", now = new Date()) => {
  const old = (patient.visits || []).find((v) => v.id === visitId);
  if (!old) return { ok: false, error: "Visit note not found" };
  const built = buildVisit({ ...form, date: form.date || old.date }, visitId, now);
  if (!built.ok) return built;
  const stamp = { at: now.toISOString(), by: String(by || "").slice(0, 80) };
  const next = { ...old, ...built.visit, editedAt: stamp.at, editedBy: stamp.by, edits: [...(old.edits || []), stamp].slice(-20) };
  return { ok: true, patient: { ...patient, visits: sortVisits((patient.visits || []).map((v) => (v.id === visitId ? next : v))) } };
};

/** "Edited on 27 Nov 2026, 7:50 pm by dr@x.com" */
export const editedLabel = (v) => {
  if (!v?.editedAt) return "";
  const d = new Date(v.editedAt);
  if (Number.isNaN(d.getTime())) return "";
  const when = d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
  return `Edited on ${when}${v.editedBy ? ` by ${v.editedBy}` : ""}`;
};

/** The complaint typed at reception fills the open note, unless real notes already exist (then it is old news). */
export const prefillComplaint = (patient) => {
  const c = String(patient?.chiefComplaint || "").trim();
  if (!c) return "";
  const real = (patient.visits || []).some((v) => !v.fromIntake);
  return real ? "" : c;
};

/** What registration saves for medical history: an NRH tick, or NRH / NKDA typed in any of the three boxes, is the same fact. */
const NRH_WORDS = /^(nrh|no relevant history|none\s*\/\s*nrh)$/i;
const NKDA_WORDS = /^(nkda|no known drug allergy|no known drug allergies|nil)$/i;
export const registrationHistory = (form = {}) => {
  const t = (v) => String(v || "").trim();
  const alert = t(form.medicalAlert), cond = t(form.conditions), alg = t(form.allergies);
  const nrh = Boolean(form.nrh) || [alert, cond, alg].some((x) => NRH_WORDS.test(x));
  if (nrh) return { medicalAlert: NRH_WORDS.test(alert) ? "" : alert, conditions: NRH_TEXT, allergies: NRH_TEXT, nrh: true };
  return { medicalAlert: alert, conditions: cond, allergies: NKDA_WORDS.test(alg) ? "NKDA" : alg, nrh: false };
};
