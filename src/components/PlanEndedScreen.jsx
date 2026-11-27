import React from "react";
import { Download } from "lucide-react";
import PlanCard from "./PlanCard.jsx";
import { buildBackup, backupFileName, patientsCsv, appointmentsCsv, invoicesDetailCsv } from "../portability.js";

const btn = "inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50";

/** Shown after the view-only days. Nothing is deleted: renew to open everything again, or download all your data. */
export default function PlanEndedScreen({ access, clinic = "", createdAt, now, data, onDownloadFile, onLogout }) {
  const day = new Date().toISOString().slice(0, 10);
  const backup = () => { const b = buildBackup(data); onDownloadFile(JSON.stringify(b), backupFileName(b), "application/json"); };
  return (
    <main className="mx-auto min-h-screen max-w-2xl space-y-4 bg-slate-50 p-4 sm:p-6" data-testid="plan-ended-screen">
      <header className="rounded-2xl border border-rose-200 bg-white p-5">
        <h1 className="text-lg font-extrabold text-slate-900">Your MeriDent plan has ended</h1>
        <p className="mt-1 text-sm text-slate-600">All your clinic data is safe and nothing has been deleted. Renew to open the app again. Everything comes back as soon as your plan is active. You can download all your data below at any time.</p>
      </header>
      <section aria-label="Download your data" className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold text-slate-900">Download your data</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={backup} className={btn}><Download className="h-3.5 w-3.5" aria-hidden="true" /> Full backup (file)</button>
          <button type="button" onClick={() => onDownloadFile(patientsCsv(data.patients), `patients-${day}.csv`, "text/csv", true)} className={btn}><Download className="h-3.5 w-3.5" aria-hidden="true" /> Patients (spreadsheet)</button>
          <button type="button" onClick={() => onDownloadFile(appointmentsCsv(data.appointments), `appointments-${day}.csv`, "text/csv", true)} className={btn}><Download className="h-3.5 w-3.5" aria-hidden="true" /> Appointments (spreadsheet)</button>
          <button type="button" onClick={() => onDownloadFile(invoicesDetailCsv(data.invoices), `invoices-${day}.csv`, "text/csv", true)} className={btn}><Download className="h-3.5 w-3.5" aria-hidden="true" /> Invoices (spreadsheet)</button>
        </div>
      </section>
      <PlanCard clinic={clinic} createdAt={createdAt} now={now} />
      {onLogout && <button type="button" onClick={onLogout} className="text-xs font-semibold text-slate-600 underline">Log out</button>}
    </main>
  );
}
