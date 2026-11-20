// Records safety: turns what the clinic already has (cloud restore points, last download on this device, live record
// counts) into a plain status with the evidence behind it. Pure, so a test can check every state.
import { daysSinceNewest, sortedPoints } from "./restorePoints.js";
import { backupAgeDays, BACKUP_REMIND_DAYS } from "./reliability.js";

export const CLOUD_OK_DAYS = 2;

const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
const ago = (d) => (d === 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`);

/**
 * checks: three rows {id, ok, tone, label, detail}; level: "good" | "watch" | "act"; headline: one sentence.
 * live: { patients } current counts. lastBackupIso: when this device last downloaded a backup ("" if never).
 */
export function recordsSafety({ points = [], loaded = true, lastBackupIso = "", live = {}, now = new Date() } = {}) {
  const hasData = (live.patients || 0) > 0;
  const newest = sortedPoints(points)[0] || null;
  const cloudDays = daysSinceNewest(points, now);
  const downloadDays = backupAgeDays(lastBackupIso, now);

  const cloud = !loaded
    ? { id: "cloud", ok: null, tone: "grey", label: "Cloud restore point", detail: "Checking…" }
    : newest === null || cloudDays === null
      ? { id: "cloud", ok: !hasData, tone: hasData ? "red" : "grey", label: "Cloud restore point", detail: hasData ? "None saved yet. One is saved automatically about 90 seconds after you open the app." : "Nothing to save yet." }
      : { id: "cloud", ok: cloudDays <= CLOUD_OK_DAYS, tone: cloudDays <= CLOUD_OK_DAYS ? "green" : cloudDays <= 7 ? "amber" : "red", label: "Cloud restore point", detail: `Saved ${ago(cloudDays)}, holding ${plural((newest.counts || {}).patients || 0, "patient")}. ${plural(points.length, "copy")} kept.` };

  const download = !hasData
    ? { id: "download", ok: true, tone: "grey", label: "Backup on this device", detail: "Nothing to back up yet." }
    : downloadDays === null
      ? { id: "download", ok: false, tone: "red", label: "Backup on this device", detail: "No backup downloaded from this device yet." }
      : { id: "download", ok: downloadDays < BACKUP_REMIND_DAYS, tone: downloadDays < BACKUP_REMIND_DAYS ? "green" : downloadDays < 30 ? "amber" : "red", label: "Backup on this device", detail: `Last downloaded ${ago(downloadDays)}.` };

  // The proof: does the newest cloud copy match what the clinic sees now?
  const saved = newest ? (newest.counts || {}).patients || 0 : null;
  const liveN = live.patients || 0;
  const match = saved === null
    ? { id: "match", ok: null, tone: "grey", label: "Copy matches your records", detail: "Shown once a restore point exists." }
    : saved >= liveN
      ? { id: "match", ok: true, tone: "green", label: "Copy matches your records", detail: `The cloud copy holds ${plural(saved, "patient")}; you have ${liveN} now.` }
      : { id: "match", ok: liveN - saved <= 5, tone: liveN - saved <= 5 ? "green" : "amber", label: "Copy matches your records", detail: `The cloud copy holds ${plural(saved, "patient")}; you have ${liveN} now. ${plural(liveN - saved, "newer patient")} will be in tomorrow's copy.` };

  const checks = [cloud, download, match];
  const level = checks.some((c) => c.tone === "red") ? "act" : checks.some((c) => c.tone === "amber") ? "watch" : "good";
  const headline = !loaded ? "Checking your records safety…"
    : !hasData ? "Add your first patient and MeriDent starts keeping copies."
    : level === "good" ? "Your records have a recent copy in the cloud and on this device."
    : level === "watch" ? "Your records are safe, but a copy is getting old."
    : "Your records need a fresh backup now.";
  return { level, headline, checks };
}
