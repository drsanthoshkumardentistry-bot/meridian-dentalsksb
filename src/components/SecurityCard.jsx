import React, { useState } from "react";
import { clearLock, hasLock, IDLE_CHOICES, readLock, setIdleMinutes, setLock, validPin } from "../appLock";

export default function SecurityCard({ uid, onLockNow, onChange }) {
  const [, tick] = useState(0);
  const [pin, setPin] = useState("");
  const [again, setAgain] = useState("");
  const [error, setError] = useState("");
  const on = hasLock(uid);
  const lock = readLock(uid);
  const refresh = () => { tick((n) => n + 1); if (onChange) onChange(); };

  const save = async (e) => {
    e.preventDefault();
    if (!validPin(pin)) return setError("Use 4 to 6 digits.");
    if (pin !== again) return setError("The two PINs do not match.");
    await setLock(uid, pin, 5);
    setPin(""); setAgain(""); setError(""); refresh();
  };

  return (
    <section className="rounded-xl border border-rule p-4 space-y-3" data-testid="security-card">
      <div>
        <h2 className="text-base font-bold text-slate-900">Sign-in security</h2>
        <p className="text-xs text-slate-500">Add a PIN as a second step on this device. MeriDent asks for it when opened again and after a few idle minutes. For your Google account, also turn on 2-Step Verification at myaccount.google.com/security (free).</p>
      </div>
      {on ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-emerald-700">PIN lock is on for this device.</p>
          <label className="flex items-center gap-2 text-sm text-slate-700">Lock after
            <select value={lock.idleMinutes || 5} onChange={(e) => { setIdleMinutes(uid, Number(e.target.value)); refresh(); }} className="rounded-md border border-slate-300 px-2 py-1">
              {IDLE_CHOICES.map((m) => <option key={m} value={m}>{m} {m === 1 ? "minute" : "minutes"}</option>)}
            </select> idle
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={onLockNow} className="rounded-full bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800">Lock now</button>
            <button type="button" onClick={() => { clearLock(uid); refresh(); }} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Turn off PIN lock</button>
          </div>
        </div>
      ) : (
        <form onSubmit={save} className="space-y-2 max-w-xs">
          <label className="block text-sm font-semibold text-slate-700">New PIN (4 to 6 digits)
            <input type="password" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="block text-sm font-semibold text-slate-700">Type it again
            <input type="password" inputMode="numeric" maxLength={6} value={again} onChange={(e) => setAgain(e.target.value.replace(/\D/g, ""))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          {error && <p role="alert" className="text-sm font-medium text-rose-700">{error}</p>}
          <button type="submit" className="rounded-full bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800">Turn on PIN lock</button>
        </form>
      )}
    </section>
  );
}
