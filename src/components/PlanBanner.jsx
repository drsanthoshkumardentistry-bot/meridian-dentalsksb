import React, { useState } from "react";
import PlanCard from "./PlanCard.jsx";

const dateOf = (ms) => new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/** Top-of-app notice once a plan, trial or pause has ended. Shown for the grace days and the view-only days. */
export default function PlanBanner({ access, clinic = "", createdAt, now }) {
  const [open, setOpen] = useState(false);
  if (!access || (access.mode !== "grace" && access.mode !== "viewonly")) return null;
  const grace = access.mode === "grace";
  const what = access.reason === "paused" ? "paused" : access.reason === "trial" ? "free trial ended" : "plan ended";
  return (
    <div role={grace ? "status" : "alert"} data-testid="plan-banner" className={`border-b px-4 py-2.5 text-xs ${grace ? "border-amber-200 bg-amber-50 text-amber-950" : "border-rose-200 bg-rose-50 text-rose-950"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p>
          {grace
            ? <>Your {what === "paused" ? "plan is paused" : what} on <strong>{dateOf(access.endedAt)}</strong>. Renew to keep going. Everything works normally for {access.graceLeft} more day{access.graceLeft === 1 ? "" : "s"}.</>
            : <><strong>View-only mode.</strong> You can open and download everything, but you can't add or edit records. Renew to switch editing back on. In {access.viewOnlyLeft} day{access.viewOnlyLeft === 1 ? "" : "s"} the app opens to downloads only.</>}
        </p>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="rounded-lg bg-slate-900 px-3 py-1.5 font-semibold text-white">{open ? "Close" : "Renew"}</button>
      </div>
      {open && <div className="mt-3 rounded-xl bg-white p-1 text-slate-900"><PlanCard clinic={clinic} createdAt={createdAt} now={now} /></div>}
    </div>
  );
}
