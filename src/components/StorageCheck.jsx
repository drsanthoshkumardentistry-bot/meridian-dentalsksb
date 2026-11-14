import React, { useState } from "react";
import { HardDrive } from "lucide-react";
import { loadCheck, saveCheck, checkStatus, WARN_PERCENT, REMIND_DAYS } from "../storageCheck";

const METRIC = "firestore.googleapis.com/storage/data_and_index_storage_bytes";

// Admin-only monthly reminder: the app cannot read project-wide storage, so the admin types in the figure.
export default function StorageCheck() {
  const [check, setCheck] = useState(() => loadCheck());
  const [val, setVal] = useState("");
  const [err, setErr] = useState("");
  const s = checkStatus(check);
  const tone = s.level === "warn" ? "border-red-300 bg-red-50 text-red-900"
    : s.level === "due" || s.level === "never" ? "border-amber-300 bg-amber-50 text-amber-900"
    : "border-rule bg-white text-slate-700";
  const save = (e) => {
    e.preventDefault();
    const v = saveCheck(val.trim());
    if (!v) { setErr("Enter the size in MB, like 2.3."); return; }
    setErr(""); setCheck(v); setVal("");
  };
  return (
    <section aria-label="Storage check" className={`rounded-xl border p-4 text-sm max-w-2xl space-y-2 ${tone}`}>
      <h3 className="font-semibold flex items-center gap-2"><HardDrive size={16} aria-hidden="true" /> Storage check</h3>
      {s.level === "never" && <p role="status">You have not checked storage yet. Do it once a month.</p>}
      {s.level !== "never" && (
        <p role="status">
          Last check: {check.mib} MB of 1 GB ({s.percent.toFixed(1)}%), {s.daysAgo === 0 ? "today" : `${s.daysAgo} day${s.daysAgo === 1 ? "" : "s"} ago`}.
          {s.level === "warn" && ` Over ${WARN_PERCENT}% used. Move to the Blaze plan with a budget alert, or clean old X-rays and photos.`}
          {s.level === "due" && ` It is more than ${REMIND_DAYS} days since the last check.`}
        </p>
      )}
      <details>
        <summary className="cursor-pointer text-xs font-semibold">How to find the number</summary>
        <p className="text-xs mt-1">Google Cloud Console → Monitoring → Metrics Explorer → pick <code className="select-all break-all">{METRIC}</code>. Use the latest value, in MB.</p>
      </details>
      <form onSubmit={save} className="flex flex-wrap items-center gap-2">
        <label className="text-xs" htmlFor="sc-mib">Current size (MB)</label>
        <input id="sc-mib" inputMode="decimal" value={val} onChange={(e) => setVal(e.target.value)}
          className="w-28 rounded-lg border border-rule px-2 py-1 text-sm bg-white text-slate-900" />
        <button type="submit" className="px-3 py-1 rounded-lg bg-brand-600 text-white text-xs font-semibold">Save check</button>
        {err && <span role="alert" className="text-xs text-red-700">{err}</span>}
      </form>
    </section>
  );
}
