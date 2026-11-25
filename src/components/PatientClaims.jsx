import { useState } from "react";
import { CLAIM_KINDS, CLAIM_STATUSES, buildClaim, claimOutstandingP, claimsOf, claimsSummary } from "../claims.js";
import { formatINR } from "../billing.js";

const field = "w-full text-sm border border-rule rounded-lg px-3 py-2 bg-white";
const lbl = "block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1";
const blank = { kind: "Insurance", insurer: "", policyNo: "", memberId: "", claimNo: "", treatment: "", claimed: "", approved: "", settled: "", status: "Pre-auth requested", notes: "" };
const tone = (s) => (s === "Settled" ? "text-emerald-700" : s === "Rejected" ? "text-rose-700" : "text-amber-700");

/** The Claims tab of a patient's chart. MeriDent tracks claims; it does not send them to insurers. */
export function PatientClaims({ patient, canWrite, onSave, onRemove, makeId }) {
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const claims = claimsOf(patient);
  const toRs = (p) => (p ? String(p / 100) : "");

  const edit = (c) => {
    setEditId(c.id);
    setForm({ ...blank, ...c, claimed: toRs(c.claimedP), approved: toRs(c.approvedP), settled: toRs(c.settledP) });
    setError("");
  };
  const submit = (e) => {
    e.preventDefault();
    const r = buildClaim(form, editId || makeId(), new Date());
    if (!r.ok) { setError(r.error); return; }
    onSave(editId ? { ...r.claim, date: form.date || r.claim.date } : r.claim);
    setForm(blank); setEditId(null); setError("");
  };

  return (
    <div className="space-y-4" data-testid="patient-claims">
      <p className="text-xs text-slate-600">Track insurance and TPA claims for this patient. MeriDent records each claim and what is still owed; it does not send claims to insurers or TPAs.</p>
      {claims.length === 0 ? (
        <p className="text-sm text-slate-500">No claims for this patient yet.</p>
      ) : (
        <ul className="divide-y divide-rule border border-rule rounded-xl bg-white">
          {claims.map((c) => (
            <li key={c.id} className="p-3 text-xs space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-900">{c.insurer}</span>
                <span className="text-slate-500">{c.kind}</span>
                <span className={`px-2 py-0.5 rounded-full border border-rule font-bold ${tone(c.status)}`}>{c.status}</span>
                <span className="ml-auto text-slate-500">{c.date}</span>
              </div>
              <div className="text-slate-700">
                Claimed ₹{formatINR(c.claimedP)}
                {c.approvedP ? `, approved ₹${formatINR(c.approvedP)}` : ""}
                {c.settledP ? `, settled ₹${formatINR(c.settledP)}` : ""}
                {claimOutstandingP(c) > 0 ? <span className="font-bold text-rose-700">, owed ₹{formatINR(claimOutstandingP(c))}</span> : null}
              </div>
              {(c.policyNo || c.claimNo || c.treatment) && (
                <div className="text-slate-500">{[c.treatment, c.policyNo && `Policy ${c.policyNo}`, c.claimNo && `Claim ${c.claimNo}`].filter(Boolean).join(" · ")}</div>
              )}
              {c.notes ? <div className="text-slate-500">{c.notes}</div> : null}
              {canWrite && (
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => edit(c)} className="font-semibold text-blue-700 hover:underline">Update</button>
                  <button type="button" onClick={() => onRemove(c.id)} className="font-semibold text-rose-700 hover:underline">Remove</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {canWrite && (
        <form onSubmit={submit} className="border border-rule rounded-xl bg-white p-4 space-y-3" aria-label="Claim form">
          <div className="text-sm font-bold text-slate-900">{editId ? "Update claim" : "Add a claim"}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className={lbl} htmlFor="cl-kind">Type</label><select id="cl-kind" className={field} value={form.kind} onChange={set("kind")}>{CLAIM_KINDS.map((k) => <option key={k}>{k}</option>)}</select></div>
            <div><label className={lbl} htmlFor="cl-insurer">Insurer or TPA</label><input id="cl-insurer" className={field} value={form.insurer} onChange={set("insurer")} maxLength={80} /></div>
            <div><label className={lbl} htmlFor="cl-policy">Policy number</label><input id="cl-policy" className={field} value={form.policyNo} onChange={set("policyNo")} maxLength={60} /></div>
            <div><label className={lbl} htmlFor="cl-claimno">Claim number</label><input id="cl-claimno" className={field} value={form.claimNo} onChange={set("claimNo")} maxLength={60} /></div>
            <div className="sm:col-span-2"><label className={lbl} htmlFor="cl-treat">Treatment</label><input id="cl-treat" className={field} value={form.treatment} onChange={set("treatment")} maxLength={200} /></div>
            <div><label className={lbl} htmlFor="cl-claimed">Amount claimed (₹)</label><input id="cl-claimed" inputMode="decimal" className={field} value={form.claimed} onChange={set("claimed")} /></div>
            <div><label className={lbl} htmlFor="cl-approved">Amount approved (₹)</label><input id="cl-approved" inputMode="decimal" className={field} value={form.approved} onChange={set("approved")} /></div>
            <div><label className={lbl} htmlFor="cl-settled">Amount settled (₹)</label><input id="cl-settled" inputMode="decimal" className={field} value={form.settled} onChange={set("settled")} /></div>
            <div><label className={lbl} htmlFor="cl-status">Status</label><select id="cl-status" className={field} value={form.status} onChange={set("status")}>{CLAIM_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
            <div className="sm:col-span-2"><label className={lbl} htmlFor="cl-notes">Notes</label><input id="cl-notes" className={field} value={form.notes} onChange={set("notes")} maxLength={500} /></div>
          </div>
          {error ? <p role="alert" className="text-xs font-semibold text-rose-700">{error}</p> : null}
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold">{editId ? "Save changes" : "Add claim"}</button>
            {editId ? <button type="button" onClick={() => { setEditId(null); setForm(blank); setError(""); }} className="px-4 py-2 border border-rule rounded-lg text-xs font-semibold text-slate-700">Cancel</button> : null}
          </div>
        </form>
      )}
    </div>
  );
}

/** Every open claim across patients: what insurers and TPAs still owe the clinic. */
export function ClaimsOverview({ patients, onOpen }) {
  const s = claimsSummary(patients);
  if (!s.rows.length) return null;
  const open = s.rows.filter((r) => r.status !== "Settled" && r.status !== "Rejected");
  return (
    <section className="border border-rule rounded-xl bg-white p-4 space-y-3" aria-label="Insurance and TPA claims" data-testid="claims-overview">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="text-sm font-bold text-slate-900">Insurance and TPA claims</h2>
        <span className="text-xs text-slate-600">{s.open} open</span>
        <span className="text-xs font-bold text-rose-700">Owed to the clinic ₹{formatINR(s.outstandingP)}</span>
        <span className="text-xs text-slate-600">Settled ₹{formatINR(s.settledP)}</span>
        {s.rejected ? <span className="text-xs text-slate-600">{s.rejected} rejected</span> : null}
      </div>
      {open.length === 0 ? <p className="text-xs text-slate-500">No open claims.</p> : (
        <ul className="divide-y divide-rule">
          {open.slice(0, 20).map((r) => (
            <li key={r.id} className="py-2 flex flex-wrap items-center gap-2 text-xs">
              <button type="button" onClick={() => onOpen(r.patientId)} className="font-bold text-blue-700 hover:underline">{r.patientName}</button>
              <span className="text-slate-600">{r.insurer}</span>
              <span className={`font-semibold ${tone(r.status)}`}>{r.status}</span>
              <span className="ml-auto font-bold">₹{formatINR(claimOutstandingP(r))}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
