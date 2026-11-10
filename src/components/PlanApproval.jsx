import React, { useEffect, useState } from "react";
import { formatINR } from "../billing.js";
import { isShareExpired } from "../plans.js";

/** Public page a patient opens from the clinic's link. No sign-in; it sees only the shared plan. */
export default function PlanApproval({ token, loadShare, submitDecision }) {
  const [state, setState] = useState({ status: "loading", share: null });
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    loadShare(token)
      .then((share) => alive && setState({ status: share ? "ready" : "missing", share }))
      .catch(() => alive && setState({ status: "error", share: null }));
    return () => {
      alive = false;
    };
  }, [token, loadShare]);

  const decide = async (decision) => {
    setError("");
    if (decision === "approved" && name.trim().length < 2) {
      setError("Type your full name to approve the plan.");
      return;
    }
    setBusy(true);
    try {
      await submitDecision(token, decision, name);
      setState((s) => ({ ...s, share: { ...s.share, decision, decidedName: name.trim() } }));
    } catch {
      setError("We could not save your answer. Check your internet connection and try again, or contact the clinic.");
    } finally {
      setBusy(false);
    }
  };

  const { status, share } = state;
  const shell = (children) => (
    <div className="min-h-screen bg-enamel text-ink font-sans antialiased">
      <div className="max-w-xl mx-auto px-5 py-10">{children}</div>
    </div>
  );

  if (status === "loading") return shell(<p role="status" className="text-slate-600">Loading your treatment estimate…</p>);
  if (status === "missing")
    return shell(
      <div role="alert" className="rounded-xl border border-rule bg-white p-6">
        <h1 className="font-display font-extrabold text-2xl">This link is not valid</h1>
        <p className="mt-2 text-slate-600">It may have been withdrawn or mistyped. Please contact your clinic for a new link.</p>
      </div>
    );
  if (status === "error")
    return shell(
      <div role="alert" className="rounded-xl border border-rule bg-white p-6">
        <h1 className="font-display font-extrabold text-2xl">We could not open the estimate</h1>
        <p className="mt-2 text-slate-600">Check your internet connection and reload this page.</p>
      </div>
    );

  const expired = isShareExpired(share);
  const decided = share.decision === "approved" || share.decision === "declined";

  return shell(
    <div className="space-y-5">
      <div>
        <div className="font-display font-extrabold text-xl text-brand-700">{share.clinicName}</div>
        <h1 className="mt-3 font-display font-extrabold text-3xl tracking-tight leading-tight">
          {share.patientFirstName ? `${share.patientFirstName}, your treatment estimate` : "Your treatment estimate"}
        </h1>
        <p className="mt-1 text-slate-600">{share.title}</p>
      </div>

      <div className="rounded-xl border border-rule bg-white p-5">
        <ul className="divide-y divide-rule">
          {share.items.map((it, i) => (
            <li key={i} className="py-2.5 flex items-baseline justify-between gap-4">
              <span>
                {it.description}
                {it.tooth ? <span className="block text-xs text-slate-500">Tooth {it.tooth}</span> : null}
              </span>
              <span className="font-semibold tabular">₹{formatINR(it.amountP)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 pt-3 border-t border-rule text-sm space-y-1 tabular">
          {share.discountP > 0 && (
            <div className="flex justify-between"><dt>Discount</dt><dd>-₹{formatINR(share.discountP)}</dd></div>
          )}
          {share.taxP > 0 && (
            <div className="flex justify-between"><dt>GST</dt><dd>₹{formatINR(share.taxP)}</dd></div>
          )}
          <div className="flex justify-between text-base font-bold pt-1">
            <dt>Estimated total</dt><dd className="text-brand-600">₹{formatINR(share.totalP)}</dd>
          </div>
        </dl>
        {share.notes && <p className="mt-3 text-sm text-slate-600">{share.notes}</p>}
        <p className="mt-3 text-xs text-slate-500">This is an estimate, not a bill. The final charge depends on the treatment actually done.</p>
      </div>

      {decided ? (
        <div role="status" className={`rounded-xl border p-5 ${share.decision === "approved" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rule bg-white"}`}>
          <div className="font-bold">
            {share.decision === "approved" ? "You approved this plan. Thank you." : "You declined this plan."}
          </div>
          <p className="text-sm mt-1">
            {share.decision === "approved"
              ? "The clinic will see your answer and contact you to book the visits."
              : "The clinic will see your answer. You can call them if you change your mind."}
          </p>
        </div>
      ) : expired ? (
        <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-900">
          This estimate link has expired. Please contact the clinic for a new one.
        </div>
      ) : (
        <div className="rounded-xl border border-rule bg-white p-5 space-y-3">
          <label htmlFor="approve-name" className="block text-sm font-semibold">Your full name (needed to approve)</label>
          <input
            id="approve-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className="w-full px-3.5 py-2.5 border border-rule rounded-lg bg-white"
          />
          {error && <p role="alert" className="text-sm font-medium text-rose-700">{error}</p>}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => decide("approved")}
              className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl"
            >
              I approve this plan
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => decide("declined")}
              className="flex-1 bg-white hover:bg-mist disabled:opacity-60 border border-rule text-ink font-bold py-3 rounded-xl"
            >
              I decline
            </button>
          </div>
          <p className="text-xs text-slate-500">Approving agrees to the estimate only. You pay for treatment as it is done.</p>
        </div>
      )}
    </div>
  );
}
