import React from "react";
import { Mail, RefreshCw, ShieldCheck } from "lucide-react";

/* Blue and white screens used around sign-in: loading, email verification, idle warning. */

export function AppLoading({ message = "Checking your MeriDent session…" }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-6 text-slate-700">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  );
}

export function VerifyEmailScreen({ email, busy, notice, error, onResend, onCheck, onLogout }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-6 text-slate-800">
      <div className="max-w-md w-full bg-white border border-blue-100 rounded-3xl shadow-xl p-8 text-center space-y-5">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
          <Mail className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-black text-slate-900">Verify your email</h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            We sent a verification link to <strong className="text-slate-900">{email}</strong>. Open it, then come back and continue.
            Check your spam folder if you cannot find it.
          </p>
        </div>
        {notice ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">{notice}</p> : null}
        {error ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">{error}</p> : null}
        <div className="space-y-3">
          <button
            type="button"
            onClick={onCheck}
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold px-6 py-3 rounded-xl"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>I have verified my email</span>
          </button>
          <button
            type="button"
            onClick={onResend}
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 disabled:opacity-60 text-slate-700 border border-slate-300 text-sm font-semibold px-6 py-3 rounded-xl"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Send the email again</span>
          </button>
          <button type="button" onClick={onLogout} className="text-xs font-semibold text-slate-500 hover:text-slate-700">
            Use a different account
          </button>
        </div>
      </div>
    </div>
  );
}

export function IdleWarning({ secondsLeft, onStay, onLogout }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div role="alertdialog" aria-label="Session about to expire" className="bg-white rounded-2xl border border-blue-100 shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
        <h2 className="text-base font-black text-slate-900">Still there?</h2>
        <p className="text-sm text-slate-600">
          To protect patient records, you will be signed out in <strong>{secondsLeft}</strong> seconds because of inactivity.
        </p>
        <div className="flex gap-2 justify-center">
          <button type="button" onClick={onLogout} className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50">
            Sign out now
          </button>
          <button type="button" onClick={onStay} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold">
            Stay signed in
          </button>
        </div>
      </div>
    </div>
  );
}
