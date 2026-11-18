// One announcement from the founder, shown as a banner to every signed-in clinic. Stored in announcements/current.
// Server-only collection: clinics can read it only through GET /api/announcement and cannot write it.
import { getDoc, putDoc } from "./fsLite.js";

export const LEVELS = ["info", "success", "warning"];
export const MAX_TEXT = 240;
const PATH = "announcements/current";
const EMPTY = { active: false, id: "", text: "", level: "info", updatedAt: 0 };

/** Plain text only: control characters and runs of spaces are removed, length is capped. */
export const cleanText = (v) => String(v == null ? "" : v).replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, MAX_TEXT);

export const getAnnouncement = async ({ sa, fetchFn = fetch, now = Date.now() }) => {
  const d = await getDoc({ sa, path: PATH, fetchFn, now });
  if (!d || !d.active || !d.text) return { ...EMPTY };
  return { active: true, id: String(d.id || ""), text: cleanText(d.text), level: LEVELS.includes(d.level) ? d.level : "info", updatedAt: d.updatedAt || 0 };
};

/** Founder only. Empty text switches the banner off. A new id each time, so people who dismissed an old one see the new one. */
export const setAnnouncement = async ({ sa, text, level = "info", fetchFn = fetch, now = Date.now() }) => {
  const t = cleanText(text);
  if (!t) {
    await putDoc({ sa, path: PATH, data: { active: false, id: "", text: "", level: "info", updatedAt: now }, fetchFn, now });
    return { ...EMPTY, updatedAt: now };
  }
  if (!LEVELS.includes(level)) throw new Error("level");
  const data = { active: true, id: String(now), text: t, level, updatedAt: now };
  await putDoc({ sa, path: PATH, data, fetchFn, now });
  return data;
};
