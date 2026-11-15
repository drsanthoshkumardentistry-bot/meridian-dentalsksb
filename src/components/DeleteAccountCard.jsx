import React, { useState } from "react";
import { deleteMyAccount, clearLocalData } from "../deleteAccount.js";

/** Settings: delete the clinic account and all its data. Typed confirmation, backup reminder, recent sign-in. */
export default function DeleteAccountCard({ onDeleted, onSignOut, deleteFn = deleteMyAccount }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [backedUp, setBackedUp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const ready = typed === "DELETE" && backedUp && !busy;

  const run = async () => {
    setBusy(true); setError(""); setNeedsSignIn(false);
    try {
      await deleteFn();
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
            <li>For safety you must have signed in within the last 10 minutes.</li>
          </ul>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={backedUp} onChange={(e) => setBackedUp(e.target.checked)} className="mt-1" />
            I have downloaded a backup, or I do not need one.
          </label>
          <label className="block text-sm text-slate-700">
            Type DELETE to confirm
            <input value={typed} onChange={(e) => setTyped(e.target.value)} maxLength={10} autoComplete="off" className="mt-1 w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
          {needsSignIn && onSignOut && <button type="button" onClick={() => onSignOut("Sign in again, then open Settings and delete within 10 minutes.")} className="text-sm font-semibold text-blue-700 underline">Sign out now</button>}
          <div className="flex gap-3">
            <button type="button" disabled={!ready} onClick={run} className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">{busy ? "Deleting…" : "Delete everything"}</button>
            <button type="button" disabled={busy} onClick={() => { setOpen(false); setTyped(""); setBackedUp(false); setError(""); }} className="text-sm font-semibold text-slate-600">Cancel</button>
          </div>
        </div>
      )}
    </section>
  );
}
