import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Lock, Plus, Pencil, Trash2, Building2, X } from "lucide-react";
import { formatINR } from "../billing.js";
import { monthLabel } from "../reports.js";
import { dateKey } from "../reminders.js";
import {
  TREATMENTS, CASE_STATUSES, PAY_MODES, MAX_CLINICS, buildClinic, buildVisit, pendingP, paymentState, summary, duesByClinic, comingUp,
  visitNumber, filterVisits, monthsPresent, allocatePayment, docLogCsv, statusLabel, modeLabel, sortVisits,
} from "../docLog.js";

const field = "w-full px-3 py-2 border border-rule rounded-lg bg-white text-sm text-ink";
const btn = "px-3 py-1.5 rounded-lg text-xs font-semibold";
const primary = "inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-lg shadow-blue-700/20";
const newId = (p) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const rs = (p) => `₹${formatINR(p).replace(/\.00$/, "")}`;
const niceDate = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d, 12).toLocaleDateString("en-IN", { day: "numeric", month: "short" }); };
const weekday = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d, 12).toLocaleDateString("en-IN", { weekday: "short" }); };
const PAY_STYLE = { paid: "bg-emerald-50 text-emerald-800 border-emerald-200", part: "bg-amber-50 text-amber-800 border-amber-200", pending: "bg-rose-50 text-rose-700 border-rose-200", free: "bg-slate-50 text-slate-600 border-rule" };
const CASE_STYLE = { planned: "bg-slate-50 text-slate-700 border-rule", inprogress: "bg-blue-50 text-blue-800 border-blue-200", completed: "bg-emerald-50 text-emerald-800 border-emerald-200" };

const download = (text, name) => {
  const blob = new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} className="bg-white w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-lg text-ink">{title}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="text-slate-500 hover:text-slate-800"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ClinicsDialog({ clinics, onSave, onDelete, onClose }) {
  const blank = { name: "", place: "", contact: "", phone: "", defaultFee: "", sharePct: "", note: "" };
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState("");
  const [error, setError] = useState("");
  const [confirmId, setConfirmId] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    if (!editId && clinics.length >= MAX_CLINICS) return setError(`You can keep up to ${MAX_CLINICS} clinics.`);
    const r = buildClinic(form, editId || newId("C"));
    if (r.error) return setError(r.error);
    setError("");
    if (await onSave(r.clinic)) { setForm(blank); setEditId(""); }
  };
  const edit = (c) => { setEditId(c.id); setForm({ name: c.name, place: c.place || "", contact: c.contact || "", phone: c.phone || "", defaultFee: c.defaultFeeP ? String(c.defaultFeeP / 100) : "", sharePct: c.sharePct ? String(c.sharePct) : "", note: c.note || "" }); };
  return (
    <Modal title="My clinics" onClose={onClose}>
      {clinics.length > 0 && (
        <ul className="divide-y divide-rule border border-rule rounded-xl mb-4">
          {clinics.map((c) => (
            <li key={c.id} className="p-3 flex items-center justify-between gap-2 text-sm">
              <span><b className="text-ink">{c.name}</b>{c.place ? `, ${c.place}` : ""}<span className="block text-xs text-slate-500">{c.defaultFeeP ? `Usual fee ${rs(c.defaultFeeP)}` : "No usual fee set"}{c.sharePct ? ` · your share ${c.sharePct}%` : ""}</span></span>
              <span className="flex gap-1 shrink-0">
                <button type="button" aria-label={`Edit ${c.name}`} onClick={() => edit(c)} className={`${btn} border border-rule text-slate-700`}><Pencil className="w-3.5 h-3.5" /></button>
                {confirmId === c.id
                  ? <button type="button" onClick={() => { onDelete(c.id); setConfirmId(""); }} className={`${btn} bg-rose-600 text-white`}>Delete clinic</button>
                  : <button type="button" aria-label={`Remove ${c.name}`} onClick={() => setConfirmId(c.id)} className={`${btn} border border-rule text-rose-700`}><Trash2 className="w-3.5 h-3.5" /></button>}
              </span>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={submit} className="space-y-3">
        <p className="text-xs font-bold text-slate-700">{editId ? "Edit clinic" : "Add a clinic"}</p>
        <div><label htmlFor="dl-cname" className="block text-[11px] font-semibold text-slate-600 mb-1">Clinic name</label><input id="dl-cname" className={field} value={form.name} onChange={set("name")} maxLength={80} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label htmlFor="dl-cplace" className="block text-[11px] font-semibold text-slate-600 mb-1">Place</label><input id="dl-cplace" className={field} value={form.place} onChange={set("place")} maxLength={80} /></div>
          <div><label htmlFor="dl-ccontact" className="block text-[11px] font-semibold text-slate-600 mb-1">Contact person</label><input id="dl-ccontact" className={field} value={form.contact} onChange={set("contact")} maxLength={80} /></div>
          <div><label htmlFor="dl-cphone" className="block text-[11px] font-semibold text-slate-600 mb-1">Phone</label><input id="dl-cphone" inputMode="tel" className={field} value={form.phone} onChange={set("phone")} maxLength={15} /></div>
          <div><label htmlFor="dl-cfee" className="block text-[11px] font-semibold text-slate-600 mb-1">Usual fee per visit (₹)</label><input id="dl-cfee" inputMode="decimal" className={field} value={form.defaultFee} onChange={set("defaultFee")} /></div>
          <div><label htmlFor="dl-cshare" className="block text-[11px] font-semibold text-slate-600 mb-1">Your share of the bill (%), if any</label><input id="dl-cshare" inputMode="decimal" className={field} value={form.sharePct} onChange={set("sharePct")} /></div>
        </div>
        {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" className={`${btn} bg-ink text-white`}>{editId ? "Save clinic" : "Add clinic"}</button>
          {editId && <button type="button" onClick={() => { setEditId(""); setForm(blank); setError(""); }} className={`${btn} border border-rule text-slate-700`}>Cancel edit</button>}
        </div>
      </form>
    </Modal>
  );
}

function VisitDialog({ clinics, initial, visits, onSave, onClose, onClinics }) {
  const today = dateKey();
  const last = sortVisits(visits)[0];
  const [form, setForm] = useState(() => ({
    clinicId: (last && clinics.some((c) => c.id === last.clinicId) ? last.clinicId : clinics[0]?.id) || "", date: today, patient: "", age: "", phone: "", treatment: "", tooth: "", done: "",
    status: "completed", nextVisit: "", fee: "", received: "", payMode: "cash", note: "", ...(initial || {}),
  }));
  const [error, setError] = useState("");
  const [feeTouched, setFeeTouched] = useState(Boolean(initial && initial.fee !== undefined && initial.fee !== ""));
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const clinic = clinics.find((c) => c.id === form.clinicId);
  useEffect(() => { // fill the clinic's usual fee until the doctor types a fee
    if (!feeTouched && clinic && clinic.defaultFeeP) setForm((f) => ({ ...f, fee: String(clinic.defaultFeeP / 100) }));
  }, [form.clinicId]); // eslint-disable-line react-hooks/exhaustive-deps
  const feeNum = Number(String(form.fee).replace(/,/g, "")) || 0;
  const recNum = Number(String(form.received).replace(/,/g, "")) || 0;
  const left = Math.max(0, feeNum - recNum);
  const quick = (v) => setForm({ ...form, received: v === "full" ? String(feeNum) : v === "half" ? String(Math.round(feeNum / 2)) : "" });
  const submit = async (e) => {
    e.preventDefault();
    const r = buildVisit(form, initial && initial.id ? initial.id : newId("V"), clinics);
    if (r.error) return setError(r.error);
    setError("");
    await onSave(r.visit);
  };
  const lbl = "block text-[11px] font-semibold text-slate-600 mb-1";
  return (
    <Modal title={initial && initial.id ? "Edit visit" : "Add visit"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <p className="text-xs text-slate-500">Only the clinic, date and treatment are needed.</p>
        <div>
          <label htmlFor="dl-clinic" className={lbl}>Clinic</label>
          <select id="dl-clinic" className={field} value={form.clinicId} onChange={set("clinicId")}>
            {clinics.length === 0 && <option value="">Add a clinic first</option>}
            {clinics.map((c) => <option key={c.id} value={c.id}>{c.name}{c.place ? `, ${c.place}` : ""}</option>)}
          </select>
          <button type="button" onClick={onClinics} className="mt-1 text-[11px] font-semibold text-blue-700 hover:underline">Add or edit clinics</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label htmlFor="dl-date" className={lbl}>Date</label><input id="dl-date" type="date" className={field} value={form.date} onChange={set("date")} /></div>
          <div><label htmlFor="dl-patient" className={lbl}>Patient (name or initials)</label><input id="dl-patient" className={field} value={form.patient} onChange={set("patient")} maxLength={80} /></div>
          <div><label htmlFor="dl-age" className={lbl}>Age (optional)</label><input id="dl-age" inputMode="numeric" className={field} value={form.age} onChange={set("age")} /></div>
          <div><label htmlFor="dl-phone" className={lbl}>Phone (optional)</label><input id="dl-phone" inputMode="tel" className={field} value={form.phone} onChange={set("phone")} maxLength={15} /></div>
        </div>
        <div>
          <span className={lbl}>Treatment</span>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Treatment">
            {TREATMENTS.map((t) => (
              <button key={t} type="button" aria-pressed={form.treatment === t} onClick={() => setForm({ ...form, treatment: form.treatment === t ? "" : t })}
                className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${form.treatment === t ? "bg-blue-50 border-blue-400 text-blue-800" : "border-slate-300 text-slate-700"}`}>{t}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label htmlFor="dl-tooth" className={lbl}>Tooth (optional)</label><input id="dl-tooth" className={field} value={form.tooth} onChange={set("tooth")} maxLength={20} /></div>
          <div><label htmlFor="dl-done" className={lbl}>What was done</label><input id="dl-done" className={field} value={form.done} onChange={set("done")} maxLength={120} /></div>
        </div>
        <div>
          <span className={lbl}>Treatment status</span>
          <div className="flex border border-slate-300 rounded-lg overflow-hidden" role="group" aria-label="Treatment status">
            {CASE_STATUSES.map(([id, text]) => (
              <button key={id} type="button" aria-pressed={form.status === id} onClick={() => setForm({ ...form, status: id })}
                className={`flex-1 py-2 text-xs font-bold border-r last:border-r-0 border-slate-300 ${form.status === id ? "bg-blue-700 text-white" : "text-slate-600"}`}>{text}</button>
            ))}
          </div>
        </div>
        <div><label htmlFor="dl-next" className={lbl}>Next visit (optional)</label><input id="dl-next" type="date" className={field} value={form.nextVisit} onChange={set("nextVisit")} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label htmlFor="dl-fee" className={lbl}>Fee for this visit (₹)</label><input id="dl-fee" inputMode="decimal" className={field} value={form.fee} onChange={(e) => { setFeeTouched(true); set("fee")(e); }} /></div>
          <div><label htmlFor="dl-rec" className={lbl}>Received now (₹)</label><input id="dl-rec" inputMode="decimal" className={field} value={form.received} onChange={set("received")} /></div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[["full", "Full amount"], ["half", "Half"], ["later", "Pay later"]].map(([id, text]) => (
            <button key={id} type="button" onClick={() => quick(id)} className="px-3 py-1.5 rounded-full border border-slate-300 text-xs font-semibold text-slate-700">{text}</button>
          ))}
          {recNum > 0 && (
            <select aria-label="Payment mode" className="px-2 py-1 border border-slate-300 rounded-full text-xs" value={form.payMode} onChange={set("payMode")}>
              {PAY_MODES.map(([id, text]) => <option key={id} value={id}>{text}</option>)}
            </select>
          )}
        </div>
        {feeNum > 0 && (
          <p data-testid="pay-preview" className={`rounded-lg border px-3 py-2 text-xs font-bold ${left === 0 ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-amber-50 border-amber-200 text-amber-900"}`}>
            {left === 0 ? "Paid in full" : recNum > 0 ? `Part paid · ${rs(Math.round(left * 100))} to receive` : `Payment pending · ${rs(Math.round(left * 100))} to receive`}
          </p>
        )}
        <div><label htmlFor="dl-note" className={lbl}>Note (only you see it)</label><textarea id="dl-note" rows={2} maxLength={300} className={field} value={form.note} onChange={set("note")} placeholder="e.g. patient to bring OPG, crown shade A2" /></div>
        {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
        <button type="submit" className={`${primary} w-full justify-center`}>Save visit</button>
      </form>
    </Modal>
  );
}

function ReceiveDialog({ due, onSave, onClose }) {
  const [amount, setAmount] = useState(String(due.pendingP / 100));
  const [mode, setMode] = useState("upi");
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    const p = Math.round((Number(String(amount).replace(/,/g, "")) || 0) * 100);
    if (p <= 0) return setError("Enter the amount you received.");
    if (p > due.pendingP) return setError(`${due.name} owes ${rs(due.pendingP)}. Enter that amount or less.`);
    await onSave(p, mode);
  };
  return (
    <Modal title={`Received from ${due.name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <p className="text-xs text-slate-600">Owed so far: <b>{rs(due.pendingP)}</b>. The amount is applied to the oldest unpaid visits first.</p>
        <div><label htmlFor="dl-rcv" className="block text-[11px] font-semibold text-slate-600 mb-1">Amount received (₹)</label><input id="dl-rcv" inputMode="decimal" className={field} value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        <div><label htmlFor="dl-rmode" className="block text-[11px] font-semibold text-slate-600 mb-1">How was it paid</label>
          <select id="dl-rmode" className={field} value={mode} onChange={(e) => setMode(e.target.value)}>{PAY_MODES.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select></div>
        {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
        <button type="submit" className={`${primary} w-full justify-center`}>Save payment</button>
      </form>
    </Modal>
  );
}

/** MeriDent DocLog: a visiting doctor's private diary of clinic visits, treatments and payments. */
export default function DocLog({ api, showToast }) {
  const dl = api && api.docLog;
  const today = dateKey();
  const thisMonth = today.slice(0, 7);
  const [state, setState] = useState({ status: "loading", clinics: [], visits: [] });
  const [dialog, setDialog] = useState(null); // { kind: "visit"|"clinics"|"receive", ... }
  const [ym, setYm] = useState(thisMonth);
  const [clinicFilter, setClinicFilter] = useState("");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [confirmDel, setConfirmDel] = useState("");
  const { clinics, visits } = state;

  const load = useCallback(async () => {
    if (!dl) return;
    try {
      const [c, v] = await Promise.all([dl.listClinics(), dl.listVisits()]);
      setState({ status: "ready", clinics: c, visits: v });
    } catch { setState((s) => ({ ...s, status: "error" })); }
  }, [dl]);
  useEffect(() => { load(); }, [load]);

  const fail = () => showToast && showToast("Could not save. Check your connection and try again.");
  const saveClinic = async (c) => {
    try { await dl.saveClinic(c); setState((s) => ({ ...s, clinics: [...s.clinics.filter((x) => x.id !== c.id), c].sort((a, b) => a.name.localeCompare(b.name)) })); showToast && showToast("Clinic saved"); return true; }
    catch { fail(); return false; }
  };
  const deleteClinic = async (id) => {
    try { await dl.deleteClinic(id); setState((s) => ({ ...s, clinics: s.clinics.filter((x) => x.id !== id) })); showToast && showToast("Clinic removed. Its earlier visits are kept."); }
    catch { fail(); }
  };
  const saveVisit = async (v) => {
    try { await dl.saveVisit(v); setState((s) => ({ ...s, visits: [...s.visits.filter((x) => x.id !== v.id), v] })); setDialog(null); showToast && showToast("Visit saved"); }
    catch { fail(); }
  };
  const deleteVisit = async (id) => {
    try { await dl.deleteVisit(id); setState((s) => ({ ...s, visits: s.visits.filter((x) => x.id !== id) })); setConfirmDel(""); showToast && showToast("Visit deleted"); }
    catch { fail(); }
  };
  const receive = async (due, amountP, mode) => {
    const { changed } = allocatePayment(visits, due.clinicId, amountP, mode);
    try {
      await dl.saveVisits(changed);
      const by = new Map(changed.map((v) => [v.id, v]));
      setState((s) => ({ ...s, visits: s.visits.map((v) => by.get(v.id) || v) }));
      setDialog(null);
      showToast && showToast(`Payment of ${rs(amountP)} saved`);
    } catch { fail(); }
  };

  const months = useMemo(() => monthsPresent(visits, thisMonth), [visits, thisMonth]);
  const totals = useMemo(() => summary(visits, ym), [visits, ym]);
  const dues = useMemo(() => duesByClinic(visits, today), [visits, today]);
  const upcoming = useMemo(() => comingUp(visits, today), [visits, today]);
  const rows = useMemo(() => filterVisits(visits, { ym, clinicId: clinicFilter, status, q }), [visits, ym, clinicFilter, status, q]);

  if (!dl) return <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">MeriDent DocLog needs you to be signed in and online.</p>;
  if (state.status === "loading") return <p role="status" className="text-sm text-slate-600">Loading MeriDent DocLog…</p>;
  if (state.status === "error") return (
    <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 space-y-2">
      <p>Could not open MeriDent DocLog. Check your connection.</p>
      <button type="button" onClick={() => { setState((s) => ({ ...s, status: "loading" })); load(); }} className={`${btn} bg-ink text-white`}>Try again</button>
    </div>
  );

  const openVisit = (initial) => setDialog({ kind: "visit", initial });
  const startVisit = () => (clinics.length === 0 ? setDialog({ kind: "clinics" }) : openVisit(null));
  const logNext = (v) => openVisit({ clinicId: v.clinicId, date: v.nextVisit <= today ? v.nextVisit : today, patient: v.patient, age: v.age === "" ? "" : String(v.age), phone: v.phone, treatment: v.treatment, tooth: v.tooth, status: v.status === "completed" ? "completed" : "inprogress", fee: v.feeP ? String(v.feeP / 100) : "" });

  return (
    <div className="space-y-5" data-testid="doclog">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-2xl text-ink tracking-tight">MeriDent DocLog</h2>
          <p className="text-sm text-slate-500 mt-1">Your private log of clinic visits, treatments and payments. Only you can see it.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setDialog({ kind: "clinics" })} className={`${btn} border border-rule bg-white text-slate-700 inline-flex items-center gap-1.5`}><Building2 className="w-3.5 h-3.5" /> My clinics</button>
          <button type="button" disabled={!visits.length} onClick={() => download(docLogCsv(visits, ym), `doclog-${ym || "all"}.csv`)} className={`${btn} border border-rule bg-white text-slate-700 disabled:opacity-50 inline-flex items-center gap-1.5`}><Download className="w-3.5 h-3.5" /> Download spreadsheet</button>
          <button type="button" onClick={startVisit} className={primary}><Plus className="w-4 h-4" /> Add visit</button>
        </div>
      </div>

      {visits.length === 0 ? (
        <div className="bg-white border border-dashed border-rule rounded-2xl p-8 text-center space-y-3" data-testid="doclog-empty">
          <p className="font-semibold text-ink">No visits yet</p>
          <p className="text-sm text-slate-600 max-w-md mx-auto">{clinics.length === 0 ? "Add the clinics you visit, then log your first visit. It takes about 15 seconds." : "Log your first visit. It takes about 15 seconds."}</p>
          <button type="button" onClick={startVisit} className={primary}>{clinics.length === 0 ? "Add your first clinic" : "Add your first visit"}</button>
        </div>
      ) : (
        <>
          <div>
            <label htmlFor="dl-month" className="sr-only">Month</label>
            <select id="dl-month" value={ym} onChange={(e) => setYm(e.target.value)} className="px-3 py-2 border border-rule rounded-lg bg-white text-sm font-semibold text-slate-700">
              {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
              <option value="">All months</option>
            </select>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="doclog-summary">
            <div className="bg-white border border-rule rounded-2xl p-4 shadow-card"><p className="text-xs font-semibold text-slate-500">Visits</p><p className="font-display font-extrabold text-2xl mt-1 tabular">{totals.count}</p><p className="text-xs text-slate-500">at {totals.clinics} {totals.clinics === 1 ? "clinic" : "clinics"}</p></div>
            <div className="bg-white border border-rule rounded-2xl p-4 shadow-card"><p className="text-xs font-semibold text-slate-500">Earned</p><p className="font-display font-extrabold text-2xl mt-1 tabular">{rs(totals.earnedP)}</p><p className="text-xs text-slate-500">fees logged</p></div>
            <div className="bg-white border border-rule rounded-2xl p-4 shadow-card"><p className="text-xs font-semibold text-slate-500">Received</p><p className="font-display font-extrabold text-2xl mt-1 tabular text-emerald-700">{rs(totals.receivedP)}</p><p className="text-xs text-slate-500">{totals.collectedPct}% collected</p></div>
            <div className="bg-white border border-rule rounded-2xl p-4 shadow-card"><p className="text-xs font-semibold text-slate-500">Still to receive</p><p className="font-display font-extrabold text-2xl mt-1 tabular text-amber-700" data-testid="summary-pending">{rs(totals.pendingP)}</p><p className="text-xs text-slate-500">across {totals.pendingClinics} {totals.pendingClinics === 1 ? "clinic" : "clinics"}</p></div>
          </div>

          {upcoming.length > 0 && (
            <section aria-label="Coming up" data-testid="coming-up">
              <h3 className="text-xs font-bold text-slate-800 mb-2">Coming up</h3>
              <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {upcoming.map((v) => {
                  const days = Math.round((new Date(v.nextVisit + "T12:00:00") - new Date(today + "T12:00:00")) / 86400000);
                  return (
                    <li key={v.id} className="bg-white border border-rule rounded-xl p-3">
                      <span className="inline-block bg-blue-50 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-full mb-1.5">{days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${weekday(v.nextVisit)} ${niceDate(v.nextVisit)}`}</span>
                      <p className="text-sm font-bold text-ink">{v.clinicName}{v.clinicPlace ? `, ${v.clinicPlace}` : ""}</p>
                      <p className="text-xs text-slate-500">{[v.patient, `${v.treatment}${v.tooth ? ` tooth ${v.tooth}` : ""}`, `visit ${visitNumber(visits, v) + 1}`].filter(Boolean).join(" · ")}</p>
                      <button type="button" onClick={() => logNext(v)} className="mt-2 text-[11px] font-semibold text-blue-700 hover:underline">Log this visit</button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {dues.length > 0 && (
            <section aria-label="Money to collect" data-testid="dues">
              <h3 className="text-xs font-bold text-slate-800 mb-2">Money to collect, by clinic</h3>
              <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {dues.map((d) => (
                  <li key={d.clinicId} className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-sm font-bold text-ink">{d.name} · {rs(d.pendingP)}</p>
                    <p className="text-xs text-slate-600">oldest unpaid visit: {d.oldestDays === 0 ? "today" : `${d.oldestDays} ${d.oldestDays === 1 ? "day" : "days"} ago`}</p>
                    <span className="mt-2 flex gap-3">
                      <button type="button" onClick={() => setDialog({ kind: "receive", due: d })} className="text-[11px] font-semibold text-blue-700 hover:underline">Record payment</button>
                      <button type="button" onClick={() => { setClinicFilter(d.clinicId); setStatus("pending"); setYm(""); }} className="text-[11px] font-semibold text-slate-600 hover:underline">Show visits</button>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="dl-fclinic" className="sr-only">Clinic</label>
            <select id="dl-fclinic" value={clinicFilter} onChange={(e) => setClinicFilter(e.target.value)} className="px-3 py-2 border border-rule rounded-lg bg-white text-xs font-semibold text-slate-700">
              <option value="">All clinics</option>
              {clinics.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {[["all", "All"], ["inprogress", "Treatment in progress"], ["completed", "Completed"], ["pending", "Payment pending"]].map(([id, text]) => (
              <button key={id} type="button" aria-pressed={status === id} onClick={() => setStatus(id)} className={`px-3 py-2 rounded-lg border text-xs font-semibold ${status === id ? "bg-blue-50 border-blue-300 text-blue-800" : "bg-white border-rule text-slate-700"}`}>{text}</button>
            ))}
            <label htmlFor="dl-q" className="sr-only">Search</label>
            <input id="dl-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search patient or treatment" className="ml-auto min-w-[200px] px-3 py-2 border border-rule rounded-lg bg-white text-xs" />
          </div>

          {rows.length === 0 ? <p className="text-sm text-slate-500 py-4" data-testid="doclog-none">No visits match. Change the month, clinic or filter.</p> : (
            <ul className="bg-white border border-rule rounded-2xl divide-y divide-rule overflow-hidden" data-testid="doclog-list">
              {rows.map((v) => {
                const state = paymentState(v);
                return (
                  <li key={v.id} className="p-3 grid gap-2 md:grid-cols-[72px_1.1fr_1.5fr_auto_170px_auto] md:items-start text-sm">
                    <span className="font-semibold text-ink">{niceDate(v.date)}<span className="block text-xs font-normal text-slate-500">{weekday(v.date)}</span></span>
                    <span><b className="text-ink">{v.clinicName}</b><span className="block text-xs text-slate-500">{v.clinicPlace}</span></span>
                    <span>{v.patient || "No name"}{v.age !== "" && v.age != null ? <span className="text-xs text-slate-500"> · {v.age}</span> : null}
                      <span className="block text-xs text-slate-600">{v.treatment}{v.tooth ? `, tooth ${v.tooth}` : ""}{v.done ? ` · ${v.done}` : ""}</span>
                      {v.nextVisit && <span className="block text-xs text-slate-500">Next visit {niceDate(v.nextVisit)}</span>}
                      {v.note && <span className="block text-xs text-slate-400 italic">{v.note}</span>}</span>
                    <span><span className={`inline-block px-2 py-0.5 rounded-full border text-[11px] font-bold ${CASE_STYLE[v.status]}`}>{statusLabel(v.status)}</span></span>
                    <span className="md:text-right"><b className="tabular">{v.feeP ? rs(v.feeP) : "No fee"}</b>
                      <span className={`mt-1 block md:ml-auto w-fit whitespace-nowrap px-2 py-0.5 rounded-full border text-[11px] font-bold ${PAY_STYLE[state]}`}>
                        {state === "paid" ? `Paid${v.payMode ? ` · ${modeLabel(v.payMode)}` : ""}` : state === "part" ? `Part paid · ${rs(pendingP(v))} left` : state === "pending" ? `Pending ${rs(pendingP(v))}` : "No fee"}
                      </span></span>
                    <span className="flex gap-1 md:justify-end">
                      <button type="button" aria-label={`Edit visit ${v.date} ${v.clinicName}`} onClick={() => openVisit({ ...v, age: v.age === "" ? "" : String(v.age), fee: v.feeP ? String(v.feeP / 100) : "", received: v.receivedP ? String(v.receivedP / 100) : "" })} className={`${btn} border border-rule text-slate-700`}><Pencil className="w-3.5 h-3.5" /></button>
                      {confirmDel === v.id
                        ? <button type="button" onClick={() => deleteVisit(v.id)} className={`${btn} bg-rose-600 text-white`}>Delete</button>
                        : <button type="button" aria-label={`Delete visit ${v.date} ${v.clinicName}`} onClick={() => setConfirmDel(v.id)} className={`${btn} border border-rule text-rose-700`}><Trash2 className="w-3.5 h-3.5" /></button>}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          {visits.length >= 600 && <p className="text-xs text-amber-800">Showing your latest 600 visits. Download the spreadsheet to keep older records.</p>}
        </>
      )}
      <p className="text-xs text-slate-500 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Stored in your own account in the cloud. Clinics and other doctors cannot see it. Use initials if you prefer not to store patient names.</p>

      {dialog && dialog.kind === "clinics" && <ClinicsDialog clinics={clinics} onSave={saveClinic} onDelete={deleteClinic} onClose={() => setDialog(null)} />}
      {dialog && dialog.kind === "visit" && <VisitDialog clinics={clinics} visits={visits} initial={dialog.initial} onSave={saveVisit} onClose={() => setDialog(null)} onClinics={() => setDialog({ kind: "clinics" })} />}
      {dialog && dialog.kind === "receive" && <ReceiveDialog due={dialog.due} onSave={(p, m) => receive(dialog.due, p, m)} onClose={() => setDialog(null)} />}
    </div>
  );
}
