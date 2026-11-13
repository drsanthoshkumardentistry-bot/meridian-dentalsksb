import React, { useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { MAX_TRIES, checkPin } from "../appLock";

export default function LockScreen({ uid, onUnlock, onSignOut }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [tries, setTries] = useState(0);
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.focus(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (await checkPin(uid, pin)) return onUnlock();
    const n = tries + 1;
    setTries(n);
    setPin("");
    if (n >= MAX_TRIES) return onSignOut("Too many wrong PINs. Sign in again.");
    setError(`Wrong PIN. ${MAX_TRIES - n} ${MAX_TRIES - n === 1 ? "try" : "tries"} left.`);
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="MeriDent is locked" className="fixed inset-0 z-[200] flex items-center justify-center bg-gradient-to-b from-[#1e3a8a] to-[#0f1f4d] p-6">
      <form onSubmit={submit} className="w-full max-w-xs rounded-3xl bg-white p-6 text-center shadow-2xl space-y-4">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700"><Lock className="h-5 w-5" aria-hidden="true" /></span>
        <h2 className="text-lg font-bold text-slate-900">MeriDent is locked</h2>
        <label htmlFor="lock-pin" className="sr-only">PIN</label>
        <input id="lock-pin" ref={ref} type="password" inputMode="numeric" autoComplete="off" maxLength={6} value={pin} onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setError(""); }} placeholder="Enter your PIN" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-center text-lg tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {error && <p role="alert" className="text-sm font-medium text-rose-700">{error}</p>}
        <button type="submit" disabled={pin.length < 4} className="w-full rounded-full bg-blue-700 py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50">Unlock</button>
        <button type="button" onClick={() => onSignOut()} className="text-sm font-semibold text-blue-700 hover:text-blue-900">Sign out instead</button>
      </form>
    </div>
  );
}
