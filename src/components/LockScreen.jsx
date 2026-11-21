import React, { useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { MAX_TRIES, checkPin, clearLock } from "../appLock";

export default function LockScreen({ uid, onUnlock, onSignOut }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [tries, setTries] = useState(0);
  const [forgot, setForgot] = useState(false);
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.focus(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    let ok;
    try { ok = await checkPin(uid, pin); } catch (err) {
      // Some browsers (plain http pages, certain in-app browsers) cannot run the secure check at all.
      setPin("");
      return setError("This browser cannot check your PIN. Tap Forgot PIN to reset it and sign in again.");
    }
    if (ok) return onUnlock();
    const n = tries + 1;
    setTries(n);
    setPin("");
    if (n >= MAX_TRIES) return onSignOut("Too many wrong PINs. Sign in again.");
    setError(`Wrong PIN. ${MAX_TRIES - n} ${MAX_TRIES - n === 1 ? "try" : "tries"} left.`);
  };

  // Forgot the PIN: the only way back in is to sign in again with the account itself, which proves it is really you.
  // The old PIN is removed first, so after signing in you can set a new one in Security.
  const resetPin = () => { clearLock(uid); onSignOut("PIN removed. Sign in again, then set a new PIN in Security."); };

  if (forgot) {
    return (
      <div role="dialog" aria-modal="true" aria-label="Reset your PIN" className="fixed inset-0 z-[200] flex items-center justify-center bg-gradient-to-b from-[#0f172a] to-[#0f1f4d] p-6">
        <div className="w-full max-w-xs rounded-3xl bg-white p-6 text-center shadow-2xl space-y-4">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700"><Lock className="h-5 w-5" aria-hidden="true" /></span>
          <h2 className="text-lg font-bold text-slate-900">Forgot your PIN?</h2>
          <p className="text-sm text-slate-600">You will be signed out and the PIN removed from this device. Sign in again with your account, then set a new PIN in Security. Your clinic data is not deleted.</p>
          <button type="button" onClick={resetPin} className="w-full rounded-full bg-blue-700 py-2.5 text-sm font-bold text-white hover:bg-blue-800">Reset PIN and sign in again</button>
          <button type="button" onClick={() => setForgot(false)} className="text-sm font-semibold text-blue-700 hover:text-blue-900">Back</button>
        </div>
      </div>
    );
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="MeriDent is locked" className="fixed inset-0 z-[200] flex items-center justify-center bg-gradient-to-b from-[#0f172a] to-[#0f1f4d] p-6">
      <form onSubmit={submit} className="w-full max-w-xs rounded-3xl bg-white p-6 text-center shadow-2xl space-y-4">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700"><Lock className="h-5 w-5" aria-hidden="true" /></span>
        <h2 className="text-lg font-bold text-slate-900">MeriDent is locked</h2>
        <label htmlFor="lock-pin" className="sr-only">PIN</label>
        <input id="lock-pin" ref={ref} type="password" inputMode="numeric" autoComplete="off" maxLength={6} value={pin} onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setError(""); }} placeholder="Enter your PIN" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-center text-lg tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {error && <p role="alert" className="text-sm font-medium text-rose-700">{error}</p>}
        <button type="submit" disabled={pin.length < 4} className="w-full rounded-full bg-blue-700 py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50">Unlock</button>
        <div className="flex flex-col gap-2">
          <button type="button" onClick={() => setForgot(true)} className="text-sm font-semibold text-blue-700 hover:text-blue-900">Forgot PIN?</button>
          <button type="button" onClick={() => onSignOut()} className="text-sm font-semibold text-slate-600 hover:text-slate-800">Sign out instead</button>
        </div>
      </form>
    </div>
  );
}
