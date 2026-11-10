import React, { useState } from "react";
import { ROLES, ROLE_LABEL, ROLE_NOTE } from "../roles.js";
import { validateInvite } from "../team.js";

const input = "px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-600";

/** Owner-only: give staff their own login with a role and branches. */
export default function TeamCard({ members, branches, ownerEmail, clinicName, origin, onInvite, onUpdate, onRemove, message }) {
  const [form, setForm] = useState({ email: "", role: "receptionist", branchIds: [] });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const v = validateInvite(form, members, ownerEmail, branches.map((b) => b.id));
    if (!v.ok) { setError(v.error); return; }
    setBusy(true); setError("");
    try {
      await onInvite(v);
      setForm({ email: "", role: form.role, branchIds: [] });
    } catch {
      setError("Could not save the invitation. Check your connection and try again.");
    } finally { setBusy(false); }
  };
  const toggleBranch = (id) => setForm((f) => ({ ...f, branchIds: f.branchIds.includes(id) ? f.branchIds.filter((b) => b !== id) : [...f.branchIds, id] }));
  const scopeText = (m) => (m.branchIds?.length ? m.branchIds.map((id) => (branches.find((b) => b.id === id) || { name: "Removed branch" }).name).join(", ") : "All branches");

  return (
    <section className="rounded-xl border border-slate-200 p-4 text-xs space-y-3" data-testid="team-card" aria-label="Team logins">
      <div>
        <h2 className="text-sm font-bold text-slate-900">Team logins</h2>
        <p className="text-slate-500">Give each staff member their own login. They sign in with the email you enter, then accept the invitation. Roles limit what they can open and change. Branch limits hide other branches in the app.</p>
      </div>

      {members.length === 0 ? <p className="text-slate-500">No team logins yet.</p> : (
        <ul className="divide-y divide-slate-100">
          {members.map((m) => (
            <li key={m.email} className="py-2 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[180px]">
                <div className="font-semibold text-slate-900">{m.email}</div>
                <div className="text-[11px] text-slate-500">{scopeText(m)} · {m.status === "active" ? (m.active ? "Active" : "Suspended") : "Waiting to accept"}</div>
              </div>
              <select aria-label={`Role for ${m.email}`} value={m.role} onChange={(e) => onUpdate(m.email, { role: e.target.value })} className={input}>
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
              <button type="button" onClick={() => onUpdate(m.email, { active: !m.active })} className="px-2 py-1.5 text-slate-600 hover:text-slate-900 font-semibold">{m.active ? "Suspend" : "Restore"}</button>
              <button type="button" aria-label={`Remove ${m.email}`} onClick={() => { if (confirm(`Remove the login for ${m.email}?`)) onRemove(m.email); }} className="px-2 py-1.5 text-slate-400 hover:text-rose-600 font-semibold">Remove</button>
              {m.status === "invited" && <button type="button" onClick={() => navigator.clipboard?.writeText(message(m, origin))} className="px-2 py-1.5 text-[#1d4ed8] font-semibold">Copy invite message</button>}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="space-y-2 rounded-lg bg-slate-50 p-3" noValidate>
        <div className="flex flex-wrap gap-2">
          <input aria-label="Staff email" type="email" placeholder="staff@example.com" className={`${input} flex-1 min-w-[200px]`} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <select aria-label="Role" className={input} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
        </div>
        <p className="text-slate-500">{ROLE_NOTE[form.role]}</p>
        {branches.length > 1 && (
          <fieldset className="flex flex-wrap gap-3">
            <legend className="font-semibold text-slate-600 mb-1">Branches (none ticked means all)</legend>
            {branches.map((b) => (
              <label key={b.id} className="flex items-center gap-1.5"><input type="checkbox" checked={form.branchIds.includes(b.id)} onChange={() => toggleBranch(b.id)} />{b.name}</label>
            ))}
          </fieldset>
        )}
        <button type="submit" disabled={busy} className="px-4 py-2 rounded-lg bg-[#1d4ed8] text-white font-semibold disabled:opacity-60">{busy ? "Saving…" : "Invite"}</button>
        {error && <p role="alert" className="text-rose-600 font-medium">{error}</p>}
      </form>
    </section>
  );
}
