import React from "react";
import { ShieldCheck, ShieldAlert, Check, AlertTriangle, Circle } from "lucide-react";
import { recordsSafety } from "../recordsSafety.js";

const TONE = { green: "text-emerald-700", amber: "text-amber-700", red: "text-red-700", grey: "text-slate-500" };
const Icon = ({ tone }) => tone === "green" ? <Check className="w-4 h-4 shrink-0 text-emerald-700" aria-hidden="true" /> : tone === "grey" ? <Circle className="w-4 h-4 shrink-0 text-slate-400" aria-hidden="true" /> : <AlertTriangle className={`w-4 h-4 shrink-0 ${TONE[tone]}`} aria-hidden="true" />;

/** Owner-only proof that this clinic's records are being kept safe. Shows the evidence, not just a badge. */
export default function RecordsSafetyCard({ points, loaded, lastBackupIso, patients }) {
  const r = recordsSafety({ points, loaded, lastBackupIso, live: { patients } });
  const good = r.level === "good";
  return (
    <section aria-label="Records safety" className={`rounded-2xl border p-4 mb-4 ${good ? "border-emerald-200 bg-emerald-50/60" : r.level === "watch" ? "border-amber-200 bg-amber-50/60" : r.level === "act" ? "border-red-200 bg-red-50/60" : "border-rule bg-white"}`}>
      <div className="flex items-start gap-3">
        {good ? <ShieldCheck className="w-5 h-5 mt-0.5 text-emerald-700" aria-hidden="true" /> : <ShieldAlert className={`w-5 h-5 mt-0.5 ${r.level === "act" ? "text-red-700" : "text-amber-700"}`} aria-hidden="true" />}
        <div className="min-w-0">
          <h3 className="font-display font-bold text-slate-900">Records safety</h3>
          <p className="text-sm text-slate-700">{r.headline}</p>
        </div>
      </div>
      <ul className="mt-3 space-y-2">
        {r.checks.map((c) => (
          <li key={c.id} className="flex gap-2.5 text-xs text-slate-700">
            <Icon tone={c.tone} />
            <span><b className="text-slate-900">{c.label}.</b> {c.detail}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-slate-500">We also keep our own encrypted daily copy. <a className="underline" href="/records-safety">How this works, and what we cannot promise</a></p>
    </section>
  );
}
