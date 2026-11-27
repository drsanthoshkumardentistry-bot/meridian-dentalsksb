import { normalizeInvoice, balancePaise, paymentStatus, formatINR } from "../billing.js";

/** The Billing tab of a patient's chart: that patient's invoices with new-invoice and record-payment shortcuts. */
export function PatientBilling({ patient, invoices, canWrite, onNew, onPay }) {
  const name = String(patient?.name || "").trim().toLowerCase();
  const mine = (invoices || []).filter(Boolean).map(normalizeInvoice)
    .filter((i) => (i.patientId ? i.patientId === patient.id : String(i.patient || "").trim().toLowerCase() === name));
  return (
    <div className="space-y-3" data-testid="patient-billing">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-slate-900">Invoices and payments</div>
        {canWrite && (
          <button type="button" onClick={onNew} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold">+ New invoice</button>
        )}
      </div>
      {mine.length === 0 ? (
        <p className="text-sm text-slate-500">No invoices for this patient yet.</p>
      ) : (
        <ul className="divide-y divide-rule border border-rule rounded-xl bg-white">
          {mine.map((inv) => (
            <li key={inv.id} className="p-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-blue-700">{inv.id}</span>
              <span className="text-slate-500">{inv.date}</span>
              <span className="px-2 py-0.5 rounded-full border border-rule font-bold text-slate-700">{paymentStatus(inv)}</span>
              <span className="ml-auto font-bold">₹{formatINR(inv.totalP)}</span>
              <span className={balancePaise(inv) > 0 ? "font-bold text-rose-700" : "text-slate-500"}>Due ₹{formatINR(balancePaise(inv))}</span>
              {!inv.voided && canWrite && (
                <button type="button" onClick={() => onPay(inv)} className="px-3 py-1.5 bg-slate-100 border border-rule rounded-lg font-semibold">{balancePaise(inv) > 0 ? "Record payment" : "Payments"}</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Asks for the reason before an invoice is voided. */
export function VoidInvoiceDialog({ invoice, reason, onReason, onCancel, onSubmit }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-slate-900/50 p-0 sm:p-4" onClick={onCancel}>
      <form role="dialog" aria-modal="true" aria-label="Void invoice" onSubmit={onSubmit} onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl p-5 space-y-3">
        <div className="font-bold text-slate-900">Void invoice {invoice.id}?</div>
        <p className="text-xs text-slate-600">The invoice stays on record marked Void and counts as ₹0. Use this for a wrong entry. It cannot be undone.</p>
        {(invoice.payments || []).length > 0 && <p className="text-xs font-semibold text-rose-700">This invoice has payments recorded. They will be kept on the void record as reversed, so refund the patient yourself if money was taken.</p>}
        <label htmlFor="void-reason" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Reason</label>
        <input id="void-reason" autoFocus value={reason} onChange={(e) => onReason(e.target.value)} maxLength={200} placeholder="For example: wrong patient or wrong amount" className="w-full text-sm border border-rule rounded-lg px-3 py-2" />
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="flex-1 py-2 border border-rule rounded-lg text-xs font-semibold text-slate-700">Cancel</button>
          <button type="submit" className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold">Void invoice</button>
        </div>
      </form>
    </div>
  );
}
