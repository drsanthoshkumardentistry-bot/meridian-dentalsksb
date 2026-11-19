import React from "react";
import { ShieldAlert } from "lucide-react";
import { daysSinceNewest } from "../restorePoints.js";

export const NUDGE_AFTER_DAYS = 3;

/** Tells the owner when the automatic safety copy is overdue, and lets them take one right away. */
export default function BackupNudge({ points, loaded, busy, hasData, onSave, now }) {
  if (!loaded || !hasData) return null;
  const days = daysSinceNewest(points, now);
  if (days !== null && days < NUDGE_AFTER_DAYS) return null;
  return (
    <div role="alert" data-testid="backup-nudge" className="flex flex-wrap items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
      <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        {days === null ? "No safety copy of your clinic data has been saved yet." : `Your last safety copy was ${days} days ago.`} Save one now so records can be brought back if something goes wrong.
      </span>
      <button type="button" disabled={busy} onClick={onSave} className="rounded-lg bg-amber-900 px-3 py-1.5 font-semibold text-white disabled:opacity-60">{busy ? "Saving…" : "Save a copy now"}</button>
    </div>
  );
}
