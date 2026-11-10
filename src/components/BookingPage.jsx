import React, { useEffect, useState } from "react";
import { BOOKING_SERVICES, validateBookingRequest, buildBookingDoc } from "../booking.js";
import { dateKey } from "../reminders.js";

const field = "w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600";

/** Public page for patients: request an appointment. Never shows the clinic app. */
export default function BookingPage({ clinicId, loadPage, submit }) {
  const [state, setState] = useState("loading"); // loading | ready | closed | error | sent
  const [page, setPage] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", date: "", slot: "", service: BOOKING_SERVICES[0], note: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    loadPage(clinicId)
      .then((p) => {
        if (!live) return;
        if (p && p.enabled) { setPage(p); setState("ready"); } else setState("closed");
      })
      .catch(() => live && setState("error"));
    return () => { live = false; };
  }, [clinicId, loadPage]);

  const send = async (e) => {
    e.preventDefault();
    const v = validateBookingRequest(form);
    if (!v.ok) { setError(v.error); return; }
    setError(""); setBusy(true);
    try {
      await submit(buildBookingDoc(v.request, clinicId));
      setState("sent");
    } catch {
      setError("Could not send your request. Please check your connection or call the clinic.");
    } finally { setBusy(false); }
  };

  const shell = (children) => (
    <main className="min-h-screen bg-[#f6f9ff] flex items-start justify-center p-4 sm:p-8">
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#d5e0f5] shadow-sm p-6">{children}</div>
    </main>
  );

  if (state === "loading") return shell(<p className="text-sm text-slate-500" role="status">Loading…</p>);
  if (state === "closed") return shell(<><h1 className="text-lg font-bold text-[#0b1b3a]">Online booking is not available</h1><p className="text-sm text-slate-500 mt-2">This clinic is not taking online requests right now. Please call the clinic to book.</p></>);
  if (state === "error") return shell(<><h1 className="text-lg font-bold text-[#0b1b3a]">This page could not load</h1><p className="text-sm text-slate-500 mt-2">Check your connection and try again.</p></>);
  if (state === "sent") return shell(<><h1 className="text-lg font-bold text-[#0b1b3a]">Request sent</h1><p className="text-sm text-slate-600 mt-2">{page.name} will confirm your appointment on WhatsApp or by phone. This is a request, not a confirmed booking.</p></>);

  return shell(
    <form onSubmit={send} className="space-y-4" noValidate>
      <div>
        <h1 className="text-xl font-bold text-[#0b1b3a]">{page.name}</h1>
        {page.doctor && <p className="text-sm text-slate-600">{page.doctor}</p>}
        {page.address && <p className="text-xs text-slate-500 mt-1">{page.address}</p>}
      </div>
      <h2 className="text-sm font-bold text-slate-800">Request an appointment</h2>
      <div><label htmlFor="bk-name" className="block text-xs font-semibold text-slate-600 mb-1">Your name</label>
        <input id="bk-name" className={field} value={form.name} maxLength={80} autoComplete="name" onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
      <div><label htmlFor="bk-phone" className="block text-xs font-semibold text-slate-600 mb-1">Mobile number</label>
        <input id="bk-phone" className={field} inputMode="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      <div><label htmlFor="bk-service" className="block text-xs font-semibold text-slate-600 mb-1">Reason for visit</label>
        <select id="bk-service" className={field} value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}>
          {BOOKING_SERVICES.map((s) => <option key={s}>{s}</option>)}</select></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label htmlFor="bk-date" className="block text-xs font-semibold text-slate-600 mb-1">Preferred date</label>
          <input id="bk-date" type="date" min={dateKey()} className={field} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
        <div><label htmlFor="bk-slot" className="block text-xs font-semibold text-slate-600 mb-1">Time of day</label>
          <select id="bk-slot" className={field} value={form.slot} onChange={(e) => setForm({ ...form, slot: e.target.value })}>
            <option value="">Choose</option><option>Morning</option><option>Afternoon</option><option>Evening</option></select></div>
      </div>
      <div><label htmlFor="bk-note" className="block text-xs font-semibold text-slate-600 mb-1">Anything the dentist should know (optional)</label>
        <textarea id="bk-note" rows={2} maxLength={300} className={field} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
      {error && <p role="alert" className="text-sm text-rose-600 font-medium">{error}</p>}
      <button type="submit" disabled={busy} className="w-full py-3 rounded-lg bg-[#1d4ed8] hover:bg-blue-800 text-white font-semibold text-sm disabled:opacity-60">{busy ? "Sending…" : "Send request"}</button>
      <p className="text-[11px] text-slate-400">Your name and number are shared only with this clinic, to contact you about this visit. Do not use this form for emergencies.</p>
    </form>
  );
}
