import React, { useCallback, useEffect, useState } from "react";
import { normalizeEmail, isEmail } from "../connect/api.js";

const btn = "px-3 py-1.5 rounded-lg text-xs font-semibold";

/** MeriDent staff only: choose which email addresses may use the app, and switch the restriction on or off. */
export default function ConnectAccess({ api, myEmail, showToast }) {
  const [list, setList] = useState(null);
  const [restrict, setRestrict] = useState(false);
  const [text, setText] = useState("");
  const me = normalizeEmail(myEmail);

  const load = useCallback(async () => {
    try {
      const [l, r] = await Promise.all([api.listAllowed(), api.getRestrict()]);
      setList(l); setRestrict(r);
    } catch { showToast("Could not load the access list."); setList([]); }
  }, [api, showToast]);
  useEffect(() => { load(); }, [load]);

  const has = (e) => (list || []).some((x) => x.email === normalizeEmail(e));

  const add = async (e) => {
    e.preventDefault();
    const email = normalizeEmail(text);
    if (!isEmail(email)) return showToast("Enter a full email address, like name@gmail.com");
    if (has(email)) return showToast("That address is already approved");
    try { await api.addAllowed(email); setText(""); await load(); } catch { showToast("Could not add the address."); }
  };
  const remove = async (email) => {
    if (restrict && email === me) return showToast("You cannot remove your own address while the restriction is on");
    try { await api.removeAllowed(email); await load(); } catch { showToast("Could not remove the address."); }
  };
  const toggle = async () => {
    if (!restrict && !has(me)) return showToast("Add your own address to the list first, or you would lock yourself out");
    if (!restrict && !window.confirm("Only approved addresses will be able to use MeriDent. Turn this on?")) return;
    try { await api.setRestrict(!restrict); setRestrict(!restrict); showToast(!restrict ? "Restriction is on" : "Restriction is off"); } catch { showToast("Could not change the restriction."); }
  };

  return (
    <div className="bg-white border border-rule rounded-xl p-4 space-y-4 text-sm" data-testid="connect-access">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-display font-bold text-ink">Approved email addresses</div>
          <p className="text-xs text-slate-500">When the restriction is on, only these addresses can open MeriDent. When off, anyone with a verified email can sign up.</p>
        </div>
        <button type="button" role="switch" aria-checked={restrict} onClick={toggle} className={`${btn} ${restrict ? "bg-brand-600 text-white" : "border border-rule text-slate-700"}`}>
          {restrict ? "Restriction on" : "Restriction off"}
        </button>
      </div>
      <form onSubmit={add} className="flex gap-2">
        <input aria-label="Email address to approve" value={text} onChange={(e) => setText(e.target.value)} placeholder="name@gmail.com" className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500" />
        <button type="submit" className={`${btn} bg-brand-600 text-white`}>Approve</button>
      </form>
      {list === null ? <p className="text-xs text-slate-500">Loading…</p> : list.length === 0 ? <p className="text-xs text-slate-500">No addresses approved yet.</p> : (
        <ul className="divide-y divide-slate-100">
          {list.map((x) => (
            <li key={x.email} className="flex items-center justify-between py-2">
              <span>{x.email}{x.email === me ? <span className="ml-2 text-[11px] text-slate-400">you</span> : null}</span>
              <button type="button" aria-label={`Remove ${x.email}`} onClick={() => remove(x.email)} className="text-xs text-slate-500 hover:text-rose-600 font-semibold">Remove</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
