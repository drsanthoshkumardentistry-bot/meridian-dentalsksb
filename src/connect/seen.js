// What the dentist has already seen on their own posts, kept on this device so new activity can be flagged.
const key = (uid) => `merident_connect_seen_${uid}`;

export const loadSeen = (uid) => {
  try {
    const v = JSON.parse(localStorage.getItem(key(uid)) || "{}");
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
};

export const saveSeen = (uid, seen) => {
  try { localStorage.setItem(key(uid), JSON.stringify(seen)); } catch { /* storage blocked: the banner just shows again next time */ }
};
