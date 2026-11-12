import React, { useState } from "react";
import { CERT_TYPES, validateCertificate, buildCertificateHtml } from "../certificate.js";
import DmyDateInput from "./DmyDateInput.jsx";

const field = "w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-500 text-xs";

/** Print a medical, treatment or fitness certificate for this patient. */
export default function CertificatePanel({ patient, profile, today, defaultTreatment = "", showToast, onPrinted }) {
  const [f, setF] = useState({ type: "rest", issuedOn: today, days: "2", from: today, treatment: defaultTreatment, remarks: "" });
  const print = (e) => {
    e.preventDefault();
    const problem = validateCertificate(f);
    if (problem) return showToast(problem);
    const win = window.open("", "_blank");
    if (!win) return showToast("Allow pop-ups to print the certificate");
    win.document.write(buildCertificateHtml({ ...f, patient, profile }));
    win.document.close();
    if (onPrinted) onPrinted(f.type);
  };
  return (
    <form onSubmit={print} className="space-y-3 max-w-xl" aria-label="Certificate" data-testid="certificate-panel">
      <div><label htmlFor="ct-type" className="block text-[11px] font-semibold text-slate-600 mb-1">Certificate</label>
        <select id="ct-type" className={field} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{CERT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label htmlFor="ct-date" className="block text-[11px] font-semibold text-slate-600 mb-1">Date of issue</label><DmyDateInput id="ct-date" ariaLabel="Date of issue (dd/mm/yyyy)" value={f.issuedOn} onChange={(v) => setF({ ...f, issuedOn: v })} className={field} /></div>
        {f.type === "rest" && <div><label htmlFor="ct-days" className="block text-[11px] font-semibold text-slate-600 mb-1">Days of rest</label><input id="ct-days" inputMode="numeric" className={field} value={f.days} onChange={(e) => setF({ ...f, days: e.target.value })} /></div>}
        {f.type === "rest" && <div><label htmlFor="ct-from" className="block text-[11px] font-semibold text-slate-600 mb-1">Rest from</label><DmyDateInput id="ct-from" ariaLabel="Rest from (dd/mm/yyyy)" value={f.from} onChange={(v) => setF({ ...f, from: v })} className={field} /></div>}
      </div>
      <div><label htmlFor="ct-tx" className="block text-[11px] font-semibold text-slate-600 mb-1">{f.type === "fitness" ? "Remarks (optional)" : "Treatment or procedure done"}</label>
        <input id="ct-tx" className={field} maxLength={200} value={f.treatment} onChange={(e) => setF({ ...f, treatment: e.target.value })} placeholder={f.type === "fitness" ? "" : "Root canal treatment of tooth 36"} /></div>
      <button className="px-4 py-2 rounded-lg bg-[#1d4ed8] text-white text-xs font-semibold">Print certificate</button>
      <p className="text-[11px] text-slate-500">Prints on a plain page with the clinic name, doctor name and registration number from Practice Profile. Sign and stamp it before handing it over.</p>
    </form>
  );
}
