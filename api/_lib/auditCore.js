// Founder action log and private clinic notes. Both live in collections only the server can reach.
// The log never stores patient data: just who did what to which clinic, and when.
import { putDoc, getDoc, listDocs, goodUid } from "./fsLite.js";

const clip = (v, n) => String(v == null ? "" : v).replace(/[\u0000-\u001f]/g, " ").slice(0, n);

/** Writes one log line. Never throws: a failed log must not undo the action it describes. */
export const logAction = async ({ sa, actor, action, target = "", detail = "", fetchFn = fetch, now = Date.now(), rand = Math.random }) => {
  try {
    if (!sa) return false;
    const id = `${String(now).padStart(14, "0")}-${Math.floor(rand() * 1e6).toString(36)}`;
    await putDoc({ sa, path: `adminLog/${id}`, data: { at: now, actor: clip(actor, 120), action: clip(action, 40), target: clip(target, 120), detail: clip(detail, 160) }, fetchFn, now });
    return true;
  } catch { return false; }
};

/** Newest first. */
export const listLog = async ({ sa, max = 100, fetchFn = fetch, now = Date.now() }) => {
  const rows = await listDocs({ sa, collection: "adminLog", max: 600, fetchFn, now });
  return rows
    .map((r) => ({ id: r.id, at: Number(r.at) || 0, actor: clip(r.actor, 120), action: clip(r.action, 40), target: clip(r.target, 120), detail: clip(r.detail, 160) }))
    .sort((a, b) => b.at - a.at || (a.id < b.id ? 1 : -1))
    .slice(0, max);
};

export const NOTE_MAX = 2000;

export const getNote = async ({ sa, uid, fetchFn = fetch, now = Date.now() }) => {
  if (!goodUid(uid)) throw new Error("uid");
  const d = await getDoc({ sa, path: `adminNotes/${uid}`, fetchFn, now }).catch(() => null);
  return { note: d ? clip(d.note, NOTE_MAX) : "", updatedAt: d ? Number(d.updatedAt) || 0 : 0 };
};

export const setNote = async ({ sa, uid, note, fetchFn = fetch, now = Date.now() }) => {
  if (!goodUid(uid)) throw new Error("uid");
  const text = String(note == null ? "" : note).slice(0, NOTE_MAX);
  await putDoc({ sa, path: `adminNotes/${uid}`, data: { note: text, updatedAt: now }, fetchFn, now });
  return { note: text, updatedAt: now };
};
