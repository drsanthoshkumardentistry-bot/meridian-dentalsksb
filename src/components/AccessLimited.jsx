import React from "react";

/** Shown to a signed-in account whose email address is not on the access list. */
export default function AccessLimited({ email, onLogout }) {
  return (
    <div className="min-h-screen bg-enamel flex items-center justify-center p-6">
      <div role="alert" data-testid="access-limited" className="max-w-md w-full bg-white border border-rule rounded-2xl shadow-card p-6 space-y-3 text-sm">
        <h1 className="text-lg font-bold text-slate-900">This account is not approved yet</h1>
        <p className="text-slate-600">MeriDent is open only to approved email addresses right now. <strong>{email}</strong> is not on the list, so no clinic data can be opened with it.</p>
        <p className="text-slate-600">Ask the MeriDent team to approve this address, or sign in with the Gmail address you registered.</p>
        <button type="button" onClick={onLogout} className="px-4 py-2 rounded-lg bg-[#1d4ed8] text-white font-semibold">Sign out</button>
      </div>
    </div>
  );
}
