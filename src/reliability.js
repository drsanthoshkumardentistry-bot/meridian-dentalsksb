// Reliability helpers (pure): how old the last backup is, and the reminder for the bell.
const DAY = 24 * 60 * 60 * 1000;
export const BACKUP_REMIND_DAYS = 7;
export const backupKey = (clinicId = "") => `merident_${clinicId || "device"}_lastBackup`;

export const readLastBackup = (clinicId, storage = globalThis.localStorage) => {
  try { const v = storage && storage.getItem(backupKey(clinicId)); return v || ""; } catch { return ""; }
};
export const markBackupDone = (clinicId, now = new Date(), storage = globalThis.localStorage) => {
  try { storage && storage.setItem(backupKey(clinicId), now.toISOString()); return true; } catch { return false; }
};

/** Whole days since the backup, or null when there is none or the stored value is unreadable. */
export const backupAgeDays = (iso, now = new Date()) => {
  const t = Date.parse(iso || "");
  if (!Number.isFinite(t)) return null;
  return Math.max(0, Math.floor((now.getTime() - t) / DAY));
};

/** A bell item when a backup is overdue (or has never been made), otherwise null. */
export const backupNotification = (lastIso, now = new Date(), { hasData = true } = {}) => {
  if (!hasData) return null;
  const age = backupAgeDays(lastIso, now);
  if (age !== null && age < BACKUP_REMIND_DAYS) return null;
  const text = age === null
    ? "No backup downloaded from this device yet. Save one to Settings, Data backup."
    : `Last backup was ${age} days ago. Save a fresh one in Settings.`;
  return { id: "backup", kind: "backup", tone: age === null || age >= 30 ? "red" : "amber", text, to: "Settings" };
};
