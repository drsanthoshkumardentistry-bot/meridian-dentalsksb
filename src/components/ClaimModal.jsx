import React, { useState } from "react";
import { X } from "lucide-react";
import { CLAIM_STATUSES, applyClaim } from "../claims.js";
import { balancePaise, formatINR, normalizeInvoice } from "../billing.js";

const input = "w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:border-blue-500";

/** Record an insurance or TPA claim on one invoice, and mark it settled when the insurer pays. */
export default function ClaimModal({ invoice, onClose, onSave }) {
  const inv = normalizeInvoice(invoice);
  const settled = inv.claim && inv.claim.status === "Settled";
  const [form, setForm] = useState({
    insurer: inv.claim?.insurer || "",
    claimNo: inv.claim?.claimNo || "",
    amount: inv.claim ? String(inv.claim.amountP / 100) : String(balancePaise(inv) / 100),
    status: inv.claim?.status || "Submitted",
    received: "",
  });
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const save = (e) => {
    e.preventDefault();
    const r = applyClaim(inv, form);
    if (!r.ok) { setError(r.error); return; }
    onSave(r.invoice);
  };
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`Insurance claim for ${inv.id}`}>
      <form onSubmit={save} className="bg-white rounded-xl border border-rule shadow-xl w-full max-w-md p-5 space-y-3 text-xs">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Insurance claim</h2>
            <p className="text-slate-500">{inv.id} · {inv.patient} · total ₹{formatINR(inv.totalP)}, balance ₹{formatINR(balancePaise(inv))}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 rounded hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>
        {settled ? (
          <p className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 p-3">
            Settled by {inv.claim.insurer}{inv.claim.claimNo ? ` (claim ${inv.claim.claimNo})` : ""}. ₹{formatINR(inv.claim.settledP || 0)} was recorded as a payment on this invoice.
          </p>
        ) : (
          <>
            <label className="block"><span className="font-semibold text-slate-700">Insurer or TPA</span>
              <input className={input} value={form.insurer} onChange={set("insurer")} placeholder="e.g. Star Health" maxLength={80} /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="font-semibold text-slate-700">Claim number (optional)</span>
                <input className={input} value={form.claimNo} onChange={set("claimNo")} maxLength={40} /></label>
              <label className="block"><span className="font-semibold text-slate-700">Claim amount (₹)</span>
                <input className={input} inputMode="decimal" value={form.amount} onChange={set("amount")} /></label>
            </div>
            <label className="block"><span className="font-semibold text-slate-700">Status</span>
              <select className={input} value={form.status} onChange={set("status")}>{CLAIM_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></label>
            {form.status === "Settled" && (
              <label className="block"><span className="font-semibold text-slate-700">Amount the insurer paid (₹)</span>
                <input className={input} inputMode="decimal" value={form.received} onChange={set("received")} placeholder={form.amount} />
                <span className="text-slate-500">It is added to this invoice as an Insurance payment.</span></label>
            )}
          </>
        )}
        {error && <p role="alert" className="text-rose-600 font-semibold">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg border border-rule font-semibold text-slate-700 hover:bg-slate-50">Close</button>
          {!settled && <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold">Save claim</button>}
        </div>
      </form>
    </div>
  );
}
