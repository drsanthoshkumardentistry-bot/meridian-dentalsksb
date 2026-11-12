// Patient photos and X-ray pictures (pure functions). Each picture is a small JPEG kept as text in the clinic's own
// area at clinics/{clinicId}/patientImages/{id}, so no extra storage service is needed.
import { dateKey } from "./reminders.js";

export const IMAGE_KINDS = ["Before", "After", "Pre-op", "Post-op", "OPG", "IOPA", "CBCT", "X-ray", "Intraoral", "Face", "Other"];
export const MAX_IMAGES_PER_PATIENT = 30;
export const MAX_DATA_CHARS = 190000; // a Firestore document holds up to 1 MB; this leaves plenty of room

const clip = (v, n) => String(v ?? "").trim().replace(/\s+/g, " ").slice(0, n);

/** Check and shape one picture. Returns { ok, image } or { ok: false, error }. */
export const buildImageDoc = ({ patientId, kind, caption, tooth, takenOn, data }, id, now = new Date(), by = "") => {
  if (!patientId) return { ok: false, error: "Open a patient first" };
  if (!IMAGE_KINDS.includes(kind)) return { ok: false, error: "Choose what this picture shows" };
  if (typeof data !== "string" || !/^data:image\/jpeg;base64,.+/.test(data)) return { ok: false, error: "Choose a photo (JPEG or PNG)" };
  if (data.length > MAX_DATA_CHARS) return { ok: false, error: "That picture is too large even after shrinking. Try a smaller one." };
  const taken = takenOn || dateKey(now);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(taken)) return { ok: false, error: "Choose the date the picture was taken" };
  if (taken > dateKey(now)) return { ok: false, error: "The date cannot be in the future" };
  return { ok: true, image: { id, patientId: String(patientId), kind, caption: clip(caption, 80), tooth: clip(tooth, 20), takenOn: taken, data, createdAt: now.toISOString(), by: clip(by, 80) } };
};

export const canAddMore = (count) => count < MAX_IMAGES_PER_PATIENT;

/** Newest picture first (by the date taken, then by when it was added). */
export const sortImages = (images = []) =>
  [...(Array.isArray(images) ? images : [])].filter(Boolean).sort((a, b) => String(b.takenOn).localeCompare(String(a.takenOn)) || String(b.createdAt).localeCompare(String(a.createdAt)));

/** Suggests the newest "Before" and "After" for the side-by-side view. */
export const suggestPair = (images = []) => {
  const sorted = sortImages(images);
  return { before: sorted.find((i) => i.kind === "Before") || null, after: sorted.find((i) => i.kind === "After") || null };
};

export const countByKind = (images = []) => images.reduce((m, i) => ({ ...m, [i.kind]: (m[i.kind] || 0) + 1 }), {});

/**
 * The pre-op and post-op pictures to show side by side. With a tooth given, only pictures of that tooth are used.
 * Newest of each kind. Also lists the teeth that have a pre-op or post-op picture.
 */
export const prePostPair = (images = [], tooth = "") => {
  const t = String(tooth || "").trim();
  const sorted = sortImages(images).filter((i) => i && (!t || String(i.tooth || "").trim() === t));
  return { pre: sorted.find((i) => i.kind === "Pre-op") || null, post: sorted.find((i) => i.kind === "Post-op") || null };
};
export const prePostTeeth = (images = []) =>
  [...new Set(images.filter((i) => i && (i.kind === "Pre-op" || i.kind === "Post-op") && String(i.tooth || "").trim()).map((i) => String(i.tooth).trim()))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
