import React, { useState } from "react";
import { addBranch, renameBranch, removeBranch, branchSummary } from "../branches.js";
import { formatINR } from "../billing.js";

const input = "px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-600";

/** Add, rename and remove branches, and compare them side by side. */
export default function BranchesCard({ branches, data, onChange, newId }) {
  const [name, setName] = useState("");
  const [edit, setEdit] = useState({});
  const [error, setError] = useState("");
  const rows = branchSummary(branches, data);

  const apply = (r) => {
    if (!r.ok) { setError(r.error); return false; }
    setError(""); onChange(r.branches); return true;
  };

  return (
    <section className="rounded-xl border border-slate-200 p-4 text-xs space-y-3" data-testid="branches-card" aria-label="Branches">
      <div>
        <h2 className="text-sm font-bold text-slate-900">Branches</h2>
        <p className="text-slate-500">Run several clinics from one account. Each record belongs to one branch, and the branch switcher in the header filters every screen.</p>
      </div>
      <table className="w-full text-left">
        <thead><tr className="text-slate-500"><th className="py-1 font-semibold">Branch</th><th className="font-semibold">Patients</th><th className="font-semibold">Visits today</th><th className="font-semibold">Billed this month</th><th /></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-slate-100">
              <td className="py-2 pr-2">
                <input aria-label={`Name of ${r.name}`} className={`${input} w-full`} value={edit[r.id] ?? r.name} maxLength={40}
                  onChange={(e) => setEdit({ ...edit, [r.id]: e.target.value })}
                  onBlur={() => { if (edit[r.id] !== undefined && edit[r.id] !== r.name) { apply(renameBranch(branches, r.id, edit[r.id])); } setEdit((s) => { const { [r.id]: _, ...rest } = s; return rest; }); }} />
              </td>
              <td className="tabular">{r.patients}</td>
              <td className="tabular">{r.todayAppointments}</td>
              <td className="tabular">{formatINR(r.billedThisMonthP)}</td>
              <td className="text-right"><button type="button" aria-label={`Remove ${r.name}`} onClick={() => apply(removeBranch(branches, r.id, data))} className="text-slate-400 hover:text-rose-600 font-semibold">Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (apply(addBranch(branches, name, newId("BR")))) setName(""); }}>
        <input aria-label="New branch name" placeholder="New branch name, e.g. Peelamedu" className={`${input} flex-1`} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
        <button type="submit" className="px-4 py-2 rounded-lg bg-[#1d4ed8] text-white font-semibold">Add branch</button>
      </form>
      {error && <p role="alert" className="text-rose-600 font-medium">{error}</p>}
    </section>
  );
}
