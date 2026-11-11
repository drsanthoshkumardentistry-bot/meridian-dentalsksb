import React from "react";
import DmyDateInput from "./DmyDateInput.jsx";
import { CLEARANCE, cleanPhysician, physicianStatus } from "../physician.js";
import { dateKey } from "../reminders.js";

const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:border-blue-500";

/** Physician details and last consultation, saved on the patient as patient.physician. */
export default function PhysicianConsult({ patient, onChange }) {
  const ph = patient.physician || {};
  const status = physicianStatus(patient);
  const set = (changes) => onChange(cleanPhysician({ ...ph, ...changes }));
  const tone = { ok: "text-emerald-700", warn: "text-amber-700 font-semibold", muted: "text-slate-500" }[status.tone];
  return (
    <div className="border border-rule rounded-xl p-4 bg-white space-y-3" data-testid="physician-consult">
      <div className="text-xs font-bold uppercase text-slate-800 tracking-wider">Physician and last consultation</div>
      <p className={`text-xs ${tone}`}>{status.label}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <label className="block"><span className="block font-semibold text-slate-600 mb-1">Physician name</span>
          <input aria-label="Physician name" value={ph.name || ""} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Dr Ramesh" className={inputClass} /></label>
        <label className="block"><span className="block font-semibold text-slate-600 mb-1">Physician phone</span>
          <input aria-label="Physician phone" value={ph.phone || ""} onChange={(e) => set({ phone: e.target.value })} inputMode="tel" className={inputClass} /></label>
        <div><span className="block font-semibold text-slate-600 mb-1">Last consultation date</span>
          <DmyDateInput ariaLabel="Last physician consultation date (dd/mm/yyyy)" max={dateKey()} value={ph.lastConsultDate || ""} onChange={(iso) => set({ lastConsultDate: iso })} className={inputClass} /></div>
        <label className="block"><span className="block font-semibold text-slate-600 mb-1">Dental clearance</span>
          <select aria-label="Physician clearance" value={ph.clearance || ""} onChange={(e) => set({ clearance: e.target.value })} className={inputClass}>
            {CLEARANCE.map((c) => <option key={c} value={c}>{c || "Not recorded"}</option>)}
          </select></label>
        <label className="block sm:col-span-2"><span className="block font-semibold text-slate-600 mb-1">Reason for consultation</span>
          <input aria-label="Reason for physician consultation" value={ph.reason || ""} onChange={(e) => set({ reason: e.target.value })} placeholder="e.g. Diabetes review, blood pressure check" className={inputClass} /></label>
        <label className="block sm:col-span-2"><span className="block font-semibold text-slate-600 mb-1">Physician's advice</span>
          <textarea aria-label="Physician advice" rows="2" value={ph.advice || ""} onChange={(e) => set({ advice: e.target.value })} placeholder="e.g. Stop aspirin 3 days before extraction" className={inputClass} /></label>
        <label className="block sm:col-span-2"><span className="block font-semibold text-slate-600 mb-1">Current medicines</span>
          <textarea aria-label="Current medicines" rows="2" value={ph.medicines || ""} onChange={(e) => set({ medicines: e.target.value })} placeholder="e.g. Metformin 500 mg twice a day" className={inputClass} /></label>
      </div>
    </div>
  );
}
