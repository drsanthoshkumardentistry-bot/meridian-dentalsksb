import React, { useEffect, useState } from "react";
import { formatINR, buildUpiUri, isValidUpiId } from "../billing.js";
import { formatDateLong, formatTime12 } from "../reminders.js";
import { isPortalExpired } from "../portal.js";

/** Public page a patient opens from the clinic's private link. No sign-in; it shows only the published snapshot. */
export default function PatientPortal({ token, loadPage }) {
  const [state, setState] = useState({ status: "loading", page: null });
  useEffect(() => {
    let alive = true;
    loadPage(token)
      .then((page) => alive && setState({ status: !page ? "missing" : isPortalExpired(page) ? "expired" : "ready", page }))
      .catch(() => alive && setState({ status: "error", page: null }));
    return () => { alive = false; };
  }, [token, loadPage]);

  const { status, page } = state;
  const shell = (children) => (
    <main className="min-h-screen bg-enamel text-ink">
      <div className="max-w-xl mx-auto px-4 py-8 space-y-4">{children}</div>
    </main>
  );
  const note = (title, text) => shell(
    <div role="status" className="bg-white border border-rule rounded-2xl p-6 text-center space-y-2">
      <h1 className="text-lg font-bold">{title}</h1>
      <p className="text-sm text-slate-600">{text}</p>
    </div>
  );

  if (status === "loading") return note("Opening your page…", "One moment.");
  if (status === "error") return note("Could not open this page", "Check your internet connection and try again.");
  if (status === "missing") return note("This link is not valid", "Ask your clinic to send you a new link.");
  if (status === "expired") return note("This link has expired", "Ask your clinic to send you a fresh link.");

  const card = "bg-white border border-rule rounded-2xl p-5 space-y-3";
  const h2 = "text-sm font-bold text-ink";
  const pay = (amountP, label) => isValidUpiId(page.upiId) && amountP > 0 ? (
    <a href={buildUpiUri({ vpa: page.upiId, name: page.clinicName, amountP, note: label })} className="inline-block px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold">Pay ₹{formatINR(amountP)} with UPI</a>
  ) : null;

  return shell(
    <>
      <header className="space-y-1">
        <p className="text-xs font-semibold text-brand-700">{page.clinicName}</p>
        <h1 className="text-2xl font-bold">{page.patientFirstName ? `Hello ${page.patientFirstName}` : "Your dental page"}</h1>
        <p className="text-xs text-slate-500">Private to you. Please do not share this link.</p>
      </header>

      {page.nextVisitOn && (
        <section className={`${card} border-brand-200 bg-brand-50`} aria-label="Next visit">
          <h2 className={h2}>Your next visit is due</h2>
          <p className="text-lg font-bold text-brand-700">{formatDateLong(page.nextVisitOn)}</p>
          {page.clinicPhone && <p className="text-xs text-slate-600">To book a time, call {page.clinicPhone}.</p>}
        </section>
      )}

      <section className={card} aria-label="Upcoming visits">
        <h2 className={h2}>Upcoming visits</h2>
        {page.upcoming.length === 0 ? <p className="text-sm text-slate-500">No visit is booked right now.</p> : (
          <ul className="divide-y divide-rule">
            {page.upcoming.map((a, i) => (
              <li key={i} className="py-2 text-sm">
                <div className="font-semibold">{formatDateLong(a.date)}{a.time ? ` at ${formatTime12(a.time)}` : ""}</div>
                <div className="text-xs text-slate-500">{[a.procedure, a.doctor].filter(Boolean).join(" · ")}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={card} aria-label="Bills">
        <h2 className={h2}>Bills</h2>
        {page.bills.length === 0 ? <p className="text-sm text-slate-500">No bills yet.</p> : (
          <>
            {page.outstandingP > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
                <div className="text-sm"><span className="font-semibold">Balance to pay: ₹{formatINR(page.outstandingP)}</span></div>
                {pay(page.outstandingP, "Dental bill")}
              </div>
            )}
            <ul className="divide-y divide-rule">
              {page.bills.map((b, i) => (
                <li key={i} className="py-2 text-sm flex justify-between gap-3">
                  <span><span className="font-semibold">{b.number}</span> <span className="text-xs text-slate-500">{b.date}</span></span>
                  <span className="text-right">
                    <span className="block">₹{formatINR(b.totalP)}</span>
                    <span className={`block text-xs ${b.balanceP > 0 ? "text-amber-700" : "text-emerald-700"}`}>{b.balanceP > 0 ? `₹${formatINR(b.balanceP)} due` : "Paid"}</span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {page.plans.length > 0 && (
        <section className={card} aria-label="Treatment plans">
          <h2 className={h2}>Treatment plans</h2>
          <ul className="divide-y divide-rule">
            {page.plans.map((p, i) => (
              <li key={i} className="py-2 text-sm flex justify-between gap-3">
                <span className="font-semibold">{p.title}</span>
                <span className="text-right"><span className="block">₹{formatINR(p.totalP)}</span><span className="block text-xs text-slate-500">{p.status}</span></span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {page.advice && (
        <section className={card} aria-label="Advice from your last visit">
          <h2 className={h2}>Advice from your last visit</h2>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{page.advice}</p>
        </section>
      )}

      <p className="text-center text-[11px] text-slate-400">Updated {new Date(page.updatedAt).toLocaleDateString("en-IN")} · Sent by {page.clinicName} using MeriDent</p>
    </>
  );
}
