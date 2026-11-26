import React, { useEffect, useState } from "react";
import { FEATURES, loadFeatures, saveFeature } from "../featuresApi.js";

/** Founder switches that turn a whole feature off for every clinic (for example if a bill spikes or a service is down). */
export default function FeatureSwitches({ loadFn = loadFeatures, saveFn = saveFeature, onToast = () => {} }) {
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState("");
  useEffect(() => { let live = true; loadFn().then((s) => { if (live) setState(s); }); return () => { live = false; }; }, [loadFn]);
  const toggle = async (key) => {
    const on = !state[key];
    setBusy(key);
    try { const next = await saveFn({ key, on }); setState({ ...state, ...next }); onToast(on ? "Switched on for all clinics." : "Switched off for all clinics."); }
    catch (e) { onToast((e && e.message) || "Could not save."); }
    finally { setBusy(""); }
  };
  if (!state) return null;
  return (
    <section aria-label="Feature switches" className="rounded-2xl border border-rule bg-white p-4 shadow-card" data-testid="feature-switches">
      <h2 className="font-display text-base font-extrabold text-ink">Feature switches</h2>
      <p className="mt-1 text-[11px] text-slate-500">Turn a feature off for every clinic at once, for example if a service is down or its bill jumps. Clinics see a polite message. Their data is not affected.</p>
      <ul className="mt-3 divide-y divide-slate-100">
        {FEATURES.map(([key, label]) => (
          <li key={key} className="flex items-center justify-between gap-3 py-2 text-xs">
            <span className="font-semibold text-slate-800">{label}</span>
            <button type="button" role="switch" aria-checked={!!state[key]} aria-label={`${label}: ${state[key] ? "on" : "off"}`} disabled={busy === key} onClick={() => toggle(key)} className={`rounded-full px-3 py-1.5 font-semibold disabled:opacity-50 ${state[key] ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"}`}>{state[key] ? "On" : "Off"}</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
