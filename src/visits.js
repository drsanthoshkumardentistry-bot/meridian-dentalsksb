import { dateKey } from "./reminders.js";

export const VISIT_FIELDS = ["complaint", "findings", "treatment", "advice"];

/** Validate and shape a visit note. Returns { ok, visit } or { ok: false, error }. */
export const buildVisit = (form, id, now = new Date()) => {
  const clean = (v) => String(v || "").trim().slice(0, 2000);
  const visit = { id, date: form.date || dateKey(now) };
  VISIT_FIELDS.forEach((f) => (visit[f] = clean(form[f])));
  visit.nextVisit = String(form.nextVisit || "").trim().slice(0, 200);
  if (!VISIT_FIELDS.some((f) => visit[f])) return { ok: false, error: "Write at least a complaint, finding, treatment or advice" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(visit.date)) return { ok: false, error: "Choose the visit date" };
  if (visit.date > dateKey(now)) return { ok: false, error: "The visit date cannot be in the future" };
  return { ok: true, visit };
};

/** Newest visit first; same-day notes keep the most recently added first. */
export const sortVisits = (visits = []) =>
  visits.map((v, i) => ({ v, i })).sort((a, b) => b.v.date.localeCompare(a.v.date) || a.i - b.i).map((x) => x.v);

export const addVisit = (patient, visit) => ({ ...patient, visits: sortVisits([visit, ...(patient.visits || [])]) });
export const removeVisit = (patient, visitId) => ({ ...patient, visits: (patient.visits || []).filter((v) => v.id !== visitId) });
