import { toMillis } from "./api.js";

const key = (uid) => `merident_connect_seen_${uid}`;

/** When this dentist last opened Messages (ms). 0 if never or storage is unavailable. */
export const lastSeen = (uid) => {
  try { return Number(localStorage.getItem(key(uid))) || 0; } catch { return 0; }
};
export const markSeen = (uid, now = Date.now()) => {
  try { localStorage.setItem(key(uid), String(now)); } catch { /* private window: badge just resets */ }
};

/** Conversations whose newest message came from the other dentist after the last visit. */
export const countUnread = (chats = [], uid, seenMs = 0) =>
  chats.filter((c) => c.lastSenderId && c.lastSenderId !== uid && toMillis(c.updatedAt) > seenMs).length;
