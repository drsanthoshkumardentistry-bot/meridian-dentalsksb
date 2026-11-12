// Estimates how much picture data a clinic holds, so the owner sees when it is time to move to bigger storage.
import { MAX_DATA_CHARS } from "./gallery.js";

export const FREE_PLAN_BYTES = 1024 * 1024 * 1024; // Firestore free quota, shared by every clinic
export const CLINIC_WARN_BYTES = 300 * 1024 * 1024; // warn one clinic well before the shared quota is a worry

/** Size of a base64 picture string in bytes. */
export const dataUrlBytes = (s) => (typeof s === "string" && s.length > 0 ? Math.round(s.length * 0.75) : 0);

/** OPG pictures live inside patient records, so we can measure them exactly. */
export const opgUsage = (patients = []) => {
  const list = Array.isArray(patients) ? patients.filter((p) => p && typeof p === "object") : [];
  const withOpg = list.filter((p) => dataUrlBytes(p.opgImage) > 0);
  return { count: withOpg.length, bytes: withOpg.reduce((n, p) => n + dataUrlBytes(p.opgImage), 0) };
};

/** Gallery pictures are capped in size, so the biggest they can be is count times the cap. */
export const galleryUpperBytes = (count) => Math.max(0, Number(count) || 0) * Math.round(MAX_DATA_CHARS * 0.75);

export const formatBytes = (b) => (b >= 1024 * 1024 * 1024 ? `${(b / 1024 / 1024 / 1024).toFixed(2)} GB` : b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`);

/** level: ok, watch (70%+), full (90%+) against the per-clinic warning line. */
export const usageLevel = (bytes) => (bytes >= CLINIC_WARN_BYTES * 0.9 ? "full" : bytes >= CLINIC_WARN_BYTES * 0.7 ? "watch" : "ok");
