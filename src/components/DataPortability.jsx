import React, { useRef, useState } from "react";
import { Download, Upload, Lock, ShieldAlert, History } from "lucide-react";
import {
  buildBackup, backupFileName, encryptBackup, decryptBackup, validatePassword, parseBackupText, validateBackup, mergeBackup,
  patientsCsv, appointmentsCsv, invoicesDetailCsv, patientsFromCsv,
} from "../portability.js";
import { describePoint } from "../restorePoints.js";

const btn = "px-3 py-2 bg-white border border-rule hover:bg-enamel rounded-lg text-xs font-semibold text-slate-800 inline-flex items-center gap-1.5";
const primary = "px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5";
const field = "w-full px-3 py-2 border border-rule rounded-lg text-xs";

const readFile = (file) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result || ""));
  r.onerror = () => reject(new Error("read"));
  r.readAsText(file);
});

/**
 * Take all clinic data out (backup file, spreadsheets) and bring data in (a backup from MeriDent, or a patient list from
 * another system). Owner and manager only; the screen is hidden for branch-limited logins.
 */
export default function DataPortability({ data, newId, onDownloadFile, onImported, onAudit, restore = null }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [staff, setStaff] = useState(false);
  const [plan, setPlan] = useState(null); // { kind: "backup"|"csv", ... }
  const [needPw, setNeedPw] = useState(null); // encrypted envelope waiting for password
  const [openPw, setOpenPw] = useState("");
  const fileRef = useRef(null);

  const downloadBackup = async () => {
    setError("");
    if (pw) {
      const bad = validatePassword(pw);
      if (bad) { setError(bad); return; }
    }
    setBusy(true);
    try {
      const backup = buildBackup(data);
      const payload = pw ? await encryptBackup(backup, pw) : backup;
      onDownloadFile(JSON.stringify(payload), backupFileName(backup), "application/json");
      onAudit("data.export", "Full backup", `${backup.counts.patients} patients${pw ? ", password protected" : ""}`);
    } catch {
      setError("Could not create the backup on this device.");
    }
    setBusy(false);
  };

  const sheet = (which) => {
    const day = new Date().toISOString().slice(0, 10);
    const map = {
      patients: [patientsCsv(data.patients), `patients-${day}.csv`],
      appointments: [appointmentsCsv(data.appointments), `appointments-${day}.csv`],
      invoices: [invoicesDetailCsv(data.invoices), `invoices-${day}.csv`],
    };
    onDownloadFile(map[which][0], map[which][1], "text/csv", true);
    onAudit("data.export", `${which} spreadsheet`, "");
  };

  const prepareBackup = (backup) => {
    const v = validateBackup(backup);
    if (!v.ok) { setError(v.error); return; }
    const m = mergeBackup(data, backup, { includeStaff: staff });
    setPlan({ kind: "backup", backup, clinic: backup.source?.clinic || "", from: backup.exportedAt, m });
  };

  const choose = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    setError(""); setPlan(null); setNeedPw(null);
    if (!file) return;
    if (file.size > 60 * 1024 * 1024) { setError("This file is too large to import (60 MB limit)."); return; }
    let text;
    try { text = await readFile(file); } catch { setError("Could not read this file."); return; }
    if (/\.csv$/i.test(file.name) || (!text.trimStart().startsWith("{"))) {
      const r = patientsFromCsv(text, data.patients, () => newId("P"));
      if (!r.ok) { setError(r.error); return; }
      setPlan({ kind: "csv", result: r });
      return;
    }
    const parsed = parseBackupText(text);
    if (!parsed.ok) { setError(parsed.error); return; }
    if (parsed.encrypted) { setNeedPw(parsed.envelope); return; }
    prepareBackup(parsed.backup);
  };

  const openRestorePoint = async (point) => {
    setError(""); setPlan(null); setNeedPw(null);
    const backup = await restore.load(point);
    if (backup) prepareBackup(backup);
  };

  const unlock = async () => {
    setBusy(true); setError("");
    const r = await decryptBackup(needPw, openPw);
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    setNeedPw(null); setOpenPw("");
    prepareBackup(r.backup);
  };

  const confirm = () => {
    if (plan.kind === "backup") {
      const { m } = plan;
      onImported({ ...m.merged, addBranches: m.addBranches, expenses: m.expenses });
      onAudit("data.import", "Backup file", m.summary.join("; "));
    } else {
      const { patients } = plan.result;
      onImported({ patients: [...patients, ...data.patients], addBranches: [] });
      onAudit("data.import", "Patient list", `${patients.length} patients`);
    }
    setPlan(null);
  };

  // Re-evaluate the preview when the staff option changes.
  const toggleStaff = (v) => {
    setStaff(v);
    if (plan && plan.kind === "backup") setPlan({ ...plan, m: mergeBackup(data, plan.backup, { includeStaff: v }) });
  };

  return (
    <section className="rounded-xl border border-rule p-4 space-y-4" aria-label="Download and transfer data" data-testid="data-portability">
      <div>
        <h2 className="text-sm font-bold text-slate-900">Download and transfer your data</h2>
        <p className="text-xs text-slate-500">Your records belong to you. Take a full copy any time, move to another clinic or system, or bring records in.</p>
      </div>

      <div className="flex gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
        <p>These files hold patients' private health details. Store them safely, and share them only with people allowed to see them. Add a password to a backup to lock it.</p>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-900">Full backup</h3>
        <p className="text-xs text-slate-500">{data.patients.length} patients with charts, treatment plans, lab work and consents, plus appointments, invoices, stock and staff.</p>
        <label className="block text-xs text-slate-700">
          Password (optional, at least 8 characters)
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" className={`${field} mt-1`} />
        </label>
        <p className="text-xs text-slate-500 flex items-start gap-1"><Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" /> There is no way to recover a forgotten password. Keep it safe.</p>
        <button type="button" onClick={downloadBackup} disabled={busy} className={primary}><Download className="w-3.5 h-3.5" /> Download full backup</button>
      </div>

      {restore && (
        <div className="space-y-2" data-testid="restore-points">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5"><History className="w-3.5 h-3.5" aria-hidden="true" /> Automatic restore points</h3>
          <p className="text-xs text-slate-500">MeriDent saves a copy of your records once a day, inside your own private space, and keeps the last 3. Restoring brings back anything deleted by mistake. Records already here are kept as they are.</p>
          {restore.points.length === 0 ? (
            <p className="text-xs text-slate-600">No restore point yet. The first one is saved a minute or two after you sign in.</p>
          ) : (
            <ul className="divide-y divide-rule border border-rule rounded-lg">
              {restore.points.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-slate-700">
                  <span>{describePoint(p)}</span>
                  <button type="button" onClick={() => openRestorePoint(p)} disabled={restore.busy} className={btn}>Restore</button>
                </li>
              ))}
            </ul>
          )}
          {restore.error && <p role="alert" className="text-xs text-red-700">{restore.error}</p>}
          <button type="button" onClick={() => restore.saveNow({ force: true })} disabled={restore.busy} className={btn}>{restore.busy ? "Please wait…" : "Save a restore point now"}</button>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-900">Spreadsheets</h3>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => sheet("patients")} className={btn}><Download className="w-3.5 h-3.5" /> Patients</button>
          <button type="button" onClick={() => sheet("appointments")} className={btn}><Download className="w-3.5 h-3.5" /> Appointments</button>
          <button type="button" onClick={() => sheet("invoices")} className={btn}><Download className="w-3.5 h-3.5" /> Invoices</button>
        </div>
      </div>

      <div className="space-y-2 border-t border-rule pt-4">
        <h3 className="text-xs font-bold text-slate-900">Bring records in</h3>
        <p className="text-xs text-slate-500">Choose a MeriDent backup (.json), or a patient list (.csv) from another system. The patient list needs a Name column; Phone, Age, Gender, Email, Address and allergies are picked up if present. Nothing changes until you confirm.</p>
        <input ref={fileRef} type="file" accept=".json,.csv,text/csv,application/json" onChange={choose} className="sr-only" aria-label="Choose a file to import" />
        <button type="button" onClick={() => fileRef.current && fileRef.current.click()} className={btn}><Upload className="w-3.5 h-3.5" /> Choose file</button>

        {needPw && (
          <div className="rounded-lg border border-rule p-3 space-y-2">
            <p className="text-xs text-slate-700">This backup is locked. Enter its password.</p>
            <input type="password" value={openPw} onChange={(e) => setOpenPw(e.target.value)} aria-label="Backup password" className={field} />
            <button type="button" onClick={unlock} disabled={busy || !openPw} className={primary}>Unlock</button>
          </div>
        )}

        {error && <p role="alert" className="text-xs text-red-700">{error}</p>}

        {plan && plan.kind === "backup" && (
          <div className="rounded-lg border border-rule p-3 space-y-2" data-testid="import-preview">
            <p className="text-xs font-semibold text-slate-900">Backup{plan.clinic ? ` from ${plan.clinic}` : ""}{plan.from ? `, ${new Date(plan.from).toLocaleDateString("en-IN")}` : ""}</p>
            {plan.m.nothingNew ? <p className="text-xs text-slate-600">Everything in this file is already here. Nothing to add.</p> : (
              <ul className="text-xs text-slate-700 list-disc pl-4">
                {plan.m.summary.map((s) => <li key={s}>{s}</li>)}
                {plan.m.addBranches.length > 0 && <li>{plan.m.addBranches.length} branches added: {plan.m.addBranches.map((b) => b.name).join(", ")}</li>}
              </ul>
            )}
            <label className="flex items-center gap-2 text-xs text-slate-700">
              <input type="checkbox" checked={staff} onChange={(e) => toggleStaff(e.target.checked)} /> Also bring staff records
            </label>
            <p className="text-xs text-slate-500">Records already here are kept as they are, never overwritten.</p>
            <div className="flex gap-2">
              <button type="button" onClick={confirm} disabled={plan.m.nothingNew} className={primary}>Add to this clinic</button>
              <button type="button" onClick={() => setPlan(null)} className={btn}>Cancel</button>
            </div>
          </div>
        )}

        {plan && plan.kind === "csv" && (
          <div className="rounded-lg border border-rule p-3 space-y-2" data-testid="import-preview">
            <p className="text-xs font-semibold text-slate-900">{plan.result.patients.length} patients ready to add{plan.result.skipped ? `, ${plan.result.skipped} already here or repeated` : ""}</p>
            {plan.result.problems.length > 0 && (
              <ul className="text-xs text-amber-900 list-disc pl-4 max-h-28 overflow-auto">
                {plan.result.problems.slice(0, 20).map((p) => <li key={p}>{p}</li>)}
                {plan.result.problems.length > 20 && <li>and {plan.result.problems.length - 20} more</li>}
              </ul>
            )}
            <p className="text-xs text-slate-500">Imported patients start with no consent recorded, so no WhatsApp messages go to them until they agree.</p>
            <div className="flex gap-2">
              <button type="button" onClick={confirm} disabled={!plan.result.patients.length} className={primary}>Add {plan.result.patients.length} patients</button>
              <button type="button" onClick={() => setPlan(null)} className={btn}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
