import React, { useEffect, useState } from "react";
import { BOOKING_SERVICES, validateBookingRequest, buildBookingDoc } from "../booking.js";
import { dateKey } from "../reminders.js";
import { pageLang, saveLang, tr } from "../pageText.js";
import LangSwitch from "./LangSwitch.jsx";

const field = "w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600";

/** Public page for patients: request an appointment. Never shows the clinic app. */
export default function BookingPage({ clinicId, loadPage, submit }) {
  const [state, setState] = useState("loading"); // loading | ready | closed | error | sent
  const [page, setPage] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", date: "", slot: "", service: BOOKING_SERVICES[0], note: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [lang, setLang] = useState(() => pageLang());
  const pick = (id) => { setLang(id); saveLang(id); };
  const t = (k, ...a) => tr(lang, k, ...a);

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
      setError(t("sendFail"));
    } finally { setBusy(false); }
  };

  const shell = (children) => (
    <main className="min-h-screen bg-[#f6f9ff] flex items-start justify-center p-4 sm:p-8">
      <div className="w-full max-w-md bg-white rounded-xl border border-[#d5e0f5] shadow-card p-6"><LangSwitch lang={lang} onChange={pick} />{children}</div>
    </main>
  );

  if (state === "loading") return shell(<p className="text-sm text-slate-500" role="status">{t("loading")}</p>);
  if (state === "closed") return shell(<><h1 className="text-lg font-bold text-[#0b1b3a]">{t("closedTitle")}</h1><p className="text-sm text-slate-500 mt-2">{t("closedBody")}</p></>);
  if (state === "error") return shell(<><h1 className="text-lg font-bold text-[#0b1b3a]">{t("errTitle")}</h1><p className="text-sm text-slate-500 mt-2">{t("errBody")}</p></>);
  if (state === "sent") return shell(<><h1 className="text-lg font-bold text-[#0b1b3a]">{t("sentTitle")}</h1><p className="text-sm text-slate-600 mt-2">{t("sentBody", page.name)}</p></>);

  return shell(
    <form onSubmit={send} className="space-y-4" noValidate>
      <div>
        <h1 className="text-xl font-bold text-[#0b1b3a]">{page.name}</h1>
        {page.doctor && <p className="text-sm text-slate-600">{page.doctor}</p>}
        {page.address && <p className="text-xs text-slate-500 mt-1">{page.address}</p>}
      </div>
      <h2 className="text-sm font-bold text-slate-800">{t("request")}</h2>
      <div><label htmlFor="bk-name" className="block text-xs font-semibold text-slate-600 mb-1">{t("name")}</label>
        <input id="bk-name" className={field} value={form.name} maxLength={80} autoComplete="name" onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
      <div><label htmlFor="bk-phone" className="block text-xs font-semibold text-slate-600 mb-1">{t("phone")}</label>
        <input id="bk-phone" className={field} inputMode="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      <div><label htmlFor="bk-service" className="block text-xs font-semibold text-slate-600 mb-1">{t("reason")}</label>
        <select id="bk-service" className={field} value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}>
          {BOOKING_SERVICES.map((s) => <option key={s} value={s}>{t(s)}</option>)}</select></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label htmlFor="bk-date" className="block text-xs font-semibold text-slate-600 mb-1">{t("date")}</label>
          <input id="bk-date" type="date" min={dateKey()} className={field} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
        <div><label htmlFor="bk-slot" className="block text-xs font-semibold text-slate-600 mb-1">{t("time")}</label>
          <select id="bk-slot" className={field} value={form.slot} onChange={(e) => setForm({ ...form, slot: e.target.value })}>
            <option value="">{t("choose")}</option><option value="Morning">{t("Morning")}</option><option value="Afternoon">{t("Afternoon")}</option><option value="Evening">{t("Evening")}</option></select></div>
      </div>
      <div><label htmlFor="bk-note" className="block text-xs font-semibold text-slate-600 mb-1">{t("note")}</label>
        <textarea id="bk-note" rows={2} maxLength={300} className={field} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
      {error && <p role="alert" className="text-sm text-rose-600 font-medium">{error}</p>}
      <button type="submit" disabled={busy} className="w-full py-3 rounded-lg bg-[#2563eb] hover:bg-blue-800 text-white font-semibold text-sm disabled:opacity-60">{busy ? t("sending") : t("send")}</button>
      <p className="text-[11px] text-slate-500">{t("privacy")}</p>
    </form>
  );
}
