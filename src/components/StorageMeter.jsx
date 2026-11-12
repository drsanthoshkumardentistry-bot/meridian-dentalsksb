import React from "react";
import { opgUsage, galleryUpperBytes, formatBytes, usageLevel, CLINIC_WARN_BYTES } from "../storageUsage.js";

/** How much picture space the clinic uses. Small enough for the side menu. */
export default function StorageMeter({ patients, galleryCount }) {
  const opg = opgUsage(patients);
  const used = opg.bytes + galleryUpperBytes(galleryCount || 0);
  const level = usageLevel(used);
  const pct = Math.min(100, Math.round((used / CLINIC_WARN_BYTES) * 100));
  return (
    <div data-testid="storage-meter">
      <div className="text-xs font-semibold text-slate-700">Storage: about {formatBytes(used)} of {formatBytes(CLINIC_WARN_BYTES)}</div>
      <div className="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-label="Picture storage used" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full ${level === "ok" ? "bg-brand-600" : level === "watch" ? "bg-amber-500" : "bg-rose-600"}`} style={{ width: `${Math.max(pct, used > 0 ? 2 : 0)}%` }} />
      </div>
      <p className="text-[11px] text-slate-500 mt-1">
        {opg.count} OPG{opg.count === 1 ? "" : "s"}{galleryCount === null || galleryCount === undefined ? "" : `, ${galleryCount} photo${galleryCount === 1 ? "" : "s"} and X-rays`}.{" "}
        {level === "ok" ? "Plenty of room on the free plan." : level === "watch" ? "Getting full. Plan to move pictures to bigger storage soon." : "Almost full. Contact MeriDent support to move your pictures to bigger storage."}
      </p>
    </div>
  );
}
