import React, { useMemo, useState } from "react";
import { formatINR } from "../billing.js";
import { formatDateLong, dateKey, whatsappLink } from "../reminders.js";
import DmyDateInput from "./DmyDateInput.jsx";
import {
  buildPlan, upsertPlans, removePlan, sellMembership, membershipStatus, daysLeft, membershipSummary, renewalMessage,
  buildLead, setLeadStatus, leadSummary, sortLeads, followUpDue, leadWhatsAppLink, LEAD_SOURCES, LEAD_STATUSES,
} from "../growth.js";

const field = "w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-500 text-xs";
const btn = "px-3 py-1.5 rounded-lg text-xs font-semibold";
const Label = ({ id, children }) => <label htmlFor={id} className="block text-[11px] font-semibold text-slate-600 mb-1">{children}</label>;
const STATUS_STYLE = { active: "bg-emerald-50 text-emerald-800", expiring: "bg-amber-50 text-amber-900", expired: "bg-slate-100 text-slate-600" };

function Plans({ plans, onPlans, canEdit, showToast, newId }) {
  const [f, setF] = useState({ name: "", price: "", months: "12", discountPct: "", perks: "" });
  const add = (e) => {
    e.preventDefault();
    const r = buildPlan(f, newId("MP"));
    if (!r.ok) return showToast(r.error);
    onPlans(upsertPlans(plans, r.plan));
    setF({ name: "", price: "", months: "12", discountPct: "", perks: "" });
    showToast("Plan added");
  };
  return (
    <section className="bg-white border border-rule rounded-xl p-4 space-y-3" aria-label="Membership plans">
      <h2 className="text-sm font-bold text-slate-900">Plans</h2>
      {plans.length === 0 && <p className="text-xs text-slate-500">No plans yet. {canEdit ? "Add one below, for example a Family plan with a yearly fee and a treatment discount." : "Ask the owner or manager to add plans."}</p>}
      <ul className="space-y-2">
        {plans.map((p) => (
          <li key={p.id} className="flex items-start justify-between gap-2 rounded-lg border border-rule p-2.5 text-xs">
            <div>
              <div className="font-semibold text-slate-900">{p.name} · ₹{formatINR(p.priceP)} for {p.months} month{p.months === 1 ? "" : "s"}</div>
              <div className="text-slate-600">{p.discountPct ? `${p.discountPct}% off treatments` : "No discount"}{p.perks ? ` · ${p.perks}` : ""}</div>
            </div>
            {canEdit && <button type="button" aria-label={`Delete plan ${p.name}`} onClick={() => { if (confirm(`Delete the plan ${p.name}? Members who already bought it keep it.`)) onPlans(removePlan(plans, p.id)); }} className="text-rose-700 font-semibold">Delete</button>}
          </li>
        ))}
      </ul>
      {canEdit && (
        <form onSubmit={add} className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-end rounded-xl bg-enamel border border-rule p-3">
          <div className="col-span-2"><Label id="mp-name">Plan name</Label><input id="mp-name" className={field} value={f.name} maxLength={40} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Family Gold" /></div>
          <div><Label id="mp-price">Price (₹)</Label><input id="mp-price" inputMode="decimal" className={field} value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></div>
          <div><Label id="mp-months">Months</Label><input id="mp-months" inputMode="numeric" className={field} value={f.months} onChange={(e) => setF({ ...f, months: e.target.value })} /></div>
          <div><Label id="mp-disc">Discount %</Label><input id="mp-disc" inputMode="decimal" className={field} value={f.discountPct} onChange={(e) => setF({ ...f, discountPct: e.target.value })} /></div>
          <div className="col-span-2 sm:col-span-6"><Label id="mp-perks">Benefits (optional)</Label><input id="mp-perks" className={field} value={f.perks} maxLength={200} onChange={(e) => setF({ ...f, perks: e.target.value })} placeholder="Free scaling twice a year, free check-ups" /></div>
          <div className="col-span-2 sm:col-span-6"><button className={`${btn} bg-[#1d4ed8] text-white`}>Add plan</button></div>
        </form>
      )}
    </section>
  );
}

function Memberships({ plans, memberships, onSell, patients, canSell, clinicName, showToast, newId }) {
  const [f, setF] = useState({ patientId: "", planId: "", startOn: dateKey(), paid: "", mode: "Cash" });
  const [makeInvoice, setMakeInvoice] = useState(true);
  const today = dateKey();
  const sum = useMemo(() => membershipSummary(memberships, today), [memberships, today]);
  const rows = useMemo(() => [...memberships].sort((a, b) => (a.endOn < b.endOn ? -1 : 1)), [memberships]);
  const plan = plans.find((p) => p.id === f.planId);
  const sell = (e) => {
    e.preventDefault();
    const r = sellMembership({ patient: patients.find((p) => p.id === f.patientId), plan, startOn: f.startOn, paidRupees: f.paid, mode: f.mode }, newId("MB"));
    if (!r.ok) return showToast(r.error);
    onSell(r.membership, { invoice: makeInvoice });
    setF({ ...f, patientId: "", paid: "" });
    showToast("Membership recorded");
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs" data-testid="membership-summary">
        <div className="bg-white border border-rule rounded-xl p-3"><div className="text-slate-500">Active</div><div className="text-lg font-bold text-emerald-700 tabular">{sum.active}</div></div>
        <div className="bg-white border border-rule rounded-xl p-3"><div className="text-slate-500">Ending in 30 days</div><div className="text-lg font-bold text-amber-700 tabular">{sum.expiring}</div></div>
        <div className="bg-white border border-rule rounded-xl p-3"><div className="text-slate-500">Expired</div><div className="text-lg font-bold text-slate-700 tabular">{sum.expired}</div></div>
        <div className="bg-white border border-rule rounded-xl p-3"><div className="text-slate-500">Membership fees taken</div><div className="text-lg font-bold text-slate-900 tabular">₹{formatINR(sum.soldP)}</div></div>
      </div>
      {canSell && (
        <form onSubmit={sell} className="bg-white border border-rule rounded-xl p-4 grid grid-cols-2 sm:grid-cols-6 gap-2 items-end" aria-label="Sell a membership">
          <div className="col-span-2"><Label id="sm-patient">Patient</Label>
            <select id="sm-patient" className={field} value={f.patientId} onChange={(e) => setF({ ...f, patientId: e.target.value })}>
              <option value="">Choose patient</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.name}{p.phone ? ` · ${p.phone}` : ""}</option>)}
            </select></div>
          <div className="col-span-2"><Label id="sm-plan">Plan</Label>
            <select id="sm-plan" className={field} value={f.planId} onChange={(e) => setF({ ...f, planId: e.target.value, paid: "" })}>
              <option value="">Choose plan</option>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name} · ₹{formatINR(p.priceP)}</option>)}
            </select></div>
          <div><Label id="sm-start">Starts on</Label><DmyDateInput id="sm-start" ariaLabel="Starts on (dd/mm/yyyy)" value={f.startOn} onChange={(v) => setF({ ...f, startOn: v })} className={field} /></div>
          <div><Label id="sm-paid">Amount paid (₹)</Label><input id="sm-paid" inputMode="decimal" className={field} value={f.paid} placeholder={plan ? String(plan.priceP / 100) : ""} onChange={(e) => setF({ ...f, paid: e.target.value })} /></div>
          <div className="col-span-2 sm:col-span-6 flex items-center gap-3">
            <select aria-label="Payment mode" className={`${field} w-32`} value={f.mode} onChange={(e) => setF({ ...f, mode: e.target.value })}>{["Cash", "UPI", "Card", "Net banking"].map((m) => <option key={m}>{m}</option>)}</select>
            <button className={`${btn} bg-[#1d4ed8] text-white`}>Record membership</button>
            <label className="text-[11px] text-slate-600 inline-flex items-center gap-1.5"><input type="checkbox" checked={makeInvoice} onChange={(e) => setMakeInvoice(e.target.checked)} /> Also create a paid invoice (GST exempt)</label>
          </div>
        </form>
      )}
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-rule p-4 text-center text-xs text-slate-500">No memberships sold yet.</p>
      ) : (
        <ul className="space-y-2" aria-label="Members">
          {rows.map((m) => {
            const st = membershipStatus(m, today);
            const link = st !== "active" ? whatsappLink(m.phone, renewalMessage({ clinicName, m, today })) : "";
            return (
              <li key={m.id} className="bg-white border border-rule rounded-xl p-3 text-xs flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-slate-900">{m.patientName} · {m.planName}</div>
                  <div className="text-slate-600">{formatDateLong(m.startOn)} to {formatDateLong(m.endOn)}{m.discountPct ? ` · ${m.discountPct}% off` : ""} · ₹{formatINR(m.paidP)} {m.mode}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLE[st]}`}>{st === "expired" ? "Expired" : st === "expiring" ? `Ends in ${daysLeft(m, today)} days` : "Active"}</span>
                  {link && <a href={link} target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-semibold underline">Ask to renew</a>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Leads({ leads, onLeads, canEdit, onConvert, clinicName, showToast, newId }) {
  const [f, setF] = useState({ name: "", phone: "", source: "Walk-in", interest: "", note: "", followUpOn: "" });
  const [filter, setFilter] = useState("Open");
  const today = dateKey();
  const sum = leadSummary(leads, today);
  const shown = sortLeads(leads, today).filter((l) => (filter === "All" ? true : filter === "Open" ? l.status === "New" || l.status === "Contacted" : l.status === filter));
  const add = (e) => {
    e.preventDefault();
    const r = buildLead(f, newId("LD"));
    if (!r.ok) return showToast(r.error);
    onLeads([r.lead, ...leads]);
    setF({ name: "", phone: "", source: f.source, interest: "", note: "", followUpOn: "" });
    showToast("Lead added");
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs" data-testid="lead-summary">
        {[["New", sum.New], ["Contacted", sum.Contacted], ["Booked", sum.Booked], ["Follow-ups due", sum.due], ["Booked rate", `${sum.bookedPct}%`]].map(([k, v]) => (
          <div key={k} className="bg-white border border-rule rounded-xl p-3"><div className="text-slate-500">{k}</div><div className="text-lg font-bold text-slate-900 tabular">{v}</div></div>
        ))}
      </div>
      {canEdit && (
        <form onSubmit={add} className="bg-white border border-rule rounded-xl p-4 grid grid-cols-2 sm:grid-cols-6 gap-2 items-end" aria-label="Add a lead">
          <div className="col-span-2"><Label id="ld-name">Name</Label><input id="ld-name" className={field} value={f.name} maxLength={80} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div><Label id="ld-phone">Mobile</Label><input id="ld-phone" inputMode="tel" className={field} value={f.phone} maxLength={16} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
          <div><Label id="ld-src">Source</Label><select id="ld-src" className={field} value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })}>{LEAD_SOURCES.map((s) => <option key={s}>{s}</option>)}</select></div>
          <div><Label id="ld-int">Interested in</Label><input id="ld-int" className={field} value={f.interest} maxLength={60} placeholder="Braces, implant…" onChange={(e) => setF({ ...f, interest: e.target.value })} /></div>
          <div><Label id="ld-fu">Follow up on</Label><DmyDateInput id="ld-fu" ariaLabel="Follow up on (dd/mm/yyyy)" value={f.followUpOn} onChange={(v) => setF({ ...f, followUpOn: v })} className={field} /></div>
          <div className="col-span-2 sm:col-span-5"><Label id="ld-note">Note (optional)</Label><input id="ld-note" className={field} value={f.note} maxLength={300} onChange={(e) => setF({ ...f, note: e.target.value })} /></div>
          <div><button className={`${btn} bg-[#1d4ed8] text-white w-full`}>Add lead</button></div>
        </form>
      )}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Show leads">
        {["Open", ...LEAD_STATUSES, "All"].map((s) => (
          <button key={s} type="button" aria-pressed={filter === s} onClick={() => setFilter(s)} className={`${btn} border ${filter === s ? "bg-slate-900 text-white border-slate-900" : "border-rule text-slate-700"}`}>{s}</button>
        ))}
      </div>
      {shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-rule p-4 text-center text-xs text-slate-500">{leads.length === 0 ? "No leads yet. Add people who ask about treatment but have not booked, then follow up on WhatsApp." : "No leads in this view."}</p>
      ) : (
        <ul className="space-y-2" aria-label="Leads">
          {shown.map((l) => {
            const link = leadWhatsAppLink(l, clinicName);
            return (
              <li key={l.id} className="bg-white border border-rule rounded-xl p-3 text-xs flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-slate-900">{l.name} · {l.phone}{followUpDue(l, today) && <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-50 text-amber-900">Follow up now</span>}</div>
                  <div className="text-slate-600">{l.source}{l.interest ? ` · ${l.interest}` : ""}{l.followUpOn ? ` · follow up ${formatDateLong(l.followUpOn)}` : ""}{l.note ? ` · ${l.note}` : ""}</div>
                </div>
                <div className="flex items-center gap-2">
                  {link && <a href={link} target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-semibold underline">WhatsApp</a>}
                  {canEdit && onConvert && l.status !== "Booked" && <button type="button" aria-label={`Make ${l.name} a patient`} onClick={() => onConvert(l)} className="text-blue-700 font-semibold underline">Make patient</button>}
                  {canEdit && (
                    <select aria-label={`Status for ${l.name}`} className={`${field} w-32`} value={l.status} onChange={(e) => onLeads(leads.map((x) => (x.id === l.id ? setLeadStatus(x, e.target.value) : x)))}>
                      {LEAD_STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  )}
                  {canEdit && <button type="button" aria-label={`Delete lead ${l.name}`} onClick={() => { if (confirm(`Delete the lead ${l.name}?`)) onLeads(leads.filter((x) => x.id !== l.id)); }} className="text-rose-700 font-semibold">Delete</button>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Membership packages and a lead list for the clinic. */
export default function Growth({ plans = [], onPlans, canEditPlans, memberships = [], onSell, patients = [], leads = [], onLeads, onConvertLead, canEdit = true, clinicName = "", showToast, newId }) {
  const [tab, setTab] = useState("Memberships");
  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Memberships and leads" className="flex gap-2">
        {["Memberships", "Leads"].map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`${btn} border ${tab === t ? "bg-[#1d4ed8] text-white border-[#1d4ed8]" : "border-rule text-slate-700 bg-white"}`}>{t}</button>
        ))}
      </div>
      {tab === "Memberships" ? (
        <>
          <Memberships plans={plans} memberships={memberships} onSell={onSell} patients={patients} canSell={canEdit} clinicName={clinicName} showToast={showToast} newId={newId} />
          <Plans plans={plans} onPlans={onPlans} canEdit={canEditPlans} showToast={showToast} newId={newId} />
        </>
      ) : (
        <Leads leads={leads} onLeads={onLeads} onConvert={onConvertLead} canEdit={canEdit} clinicName={clinicName} showToast={showToast} newId={newId} />
      )}
    </div>
  );
}
