import React, { useState } from "react";
import { deleteMyAccount, requestDeleteCode, clearLocalData } from "../deleteAccount.js";

/** Settings: delete the clinic account and all its data. Typed confirmation, backup reminder, recent sign-in. */
export default function DeleteAccountCard({ onDeleted, onSignOut, deleteFn = deleteMyAccount, requestCodeFn = requestDeleteCode }) {
  const [ticket, setTicket] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [code, setCode] = useState("");
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [backedUp, setBackedUp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const ready = typed === "DELETE" && backedUp && !busy;
  const codeOk = /^\d{8}$/.test(code.replace(/\s+/g, ""));

  const sendCode = async () => {
    setBusy(true); setError(""); setNeedsSignIn(false);
    try {
      const r = await requestCodeFn();
      setTicket(r.ticket); setSentTo(r.to); setCode("");
    } catch (e) {
      if (e && e.code === "recent-login") setNeedsSignIn(true);
      setError((e && e.message) || "Could not send the code.");
    } finally { setBusy(false); }
  };

  const run = async () => {
    setBusy(true); setError(""); setNeedsSignIn(false);
    try {
      await deleteFn({ code: code.replace(/\s+/g, ""), ticket });
      clearLocalData();
      if (onDeleted) onDeleted();
    } catch (e) {
      if (e && e.code === "recent-login") setNeedsSignIn(true);
      setError((e && e.message) || "Could not delete the account.");
    } finally { setBusy(false); }
  };

  return (
    <section className="rounded-xl border border-rose-200 p-4 space-y-3" data-testid="delete-account-card">
      <div>
        <h2 className="text-base font-bold text-rose-800">Delete this clinic account</h2>
        <p className="text-xs text-slate-600">Permanently removes your clinic's patients, appointments, invoices, images, team invitations, public booking page and your sign-in account. This cannot be undone.</p>
      </div>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="rounded-lg border border-rose-300 px-3 py-1.5 text-sm font-semibold text-rose-700 hover:bg-rose-50">Delete account…</button>
      ) : (
        <div className="space-y-3">
          <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
            <li>Download a backup first (Practice Profile, then Backup). Deleted data cannot be brought back.</li>
            <li>Posts and messages you wrote in MeriDent Connect are not removed by this. Write to us to have them removed.</li>
            <li>For safety you must have signed in within the last 10 minutes, and we email a code to your account address.</li>
          </ul>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={backedUp} onChange={(e) => setBackedUp(e.target.checked)} className="mt-1" />
            I have downloaded a backup, or I do not need one.
          </label>
          <label className="block text-sm text-slate-700">
            Type DELETE to confirm
            <input value={typed} onChange={(e) => setTyped(e.target.value)} maxLength={10} autoComplete="off" className="mt-1 w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          {ticket && (
            <div className="space-y-2" data-testid="delete-code-step">
              <p className="text-sm text-slate-700">We emailed an 8-digit code to <strong>{sentTo}</strong>. It works for 15 minutes.</p>
              <label className="block text-sm text-slate-700">
                Code from the email
                <input value={code} onChange={(e) => setCode(e.target.value.replace(/[^\d\s]/g, "").slice(0, 12))} inputMode="numeric" autoComplete="one-time-code" className="mt-1 w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 tracking-widest" />
              </label>
              <button type="button" disabled={busy} onClick={sendCode} className="text-xs font-semibold text-blue-700 underline">Send a new code</button>
            </div>
          )}
          {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
          {needsSignIn && onSignOut && <button type="button" onClick={() => onSignOut("Sign in again, then open Settings and delete within 10 minutes.")} className="text-sm font-semibold text-blue-700 underline">Sign out now</button>}
          <div className="flex gap-3">
            {!ticket ? (
              <button type="button" disabled={!ready} onClick={sendCode} className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">{busy ? "Sending…" : "Email me a code"}</button>
            ) : (
              <button type="button" disabled={!codeOk || busy} onClick={run} className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">{busy ? "Deleting…" : "Delete everything"}</button>
            )}
            <button type="button" disabled={busy} onClick={() => { setOpen(false); setTyped(""); setBackedUp(false); setError(""); setTicket(""); setCode(""); }} className="text-sm font-semibold text-slate-600">Cancel</button>
          </div>
        </div>
      )}
    </section>
  );
}
