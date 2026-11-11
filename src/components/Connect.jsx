import React, { useEffect, useMemo, useState, useCallback } from "react";
import ConnectMessages from "./ConnectMessages.jsx";
import { countUnread, lastSeen, markSeen } from "../connect/unread.js";
import { MapPin, Phone, MessageCircle, ShieldCheck, Search } from "lucide-react";
import {
  SPECIALTIES, specialtyLabel, DISTANCES_KM, URGENCIES, CONSENT_TEXT, MAX_SUMMARY,
  validateProfile, validateConsult, orderResults, filterResults, canMoveTo, waLink, telLink, osmLink,
} from "../connect/rules.js";
import { geoFields } from "../connect/geo.js";
import { toMillis } from "../connect/api.js";

import ConnectFeed, { ReportsQueue } from "./ConnectFeed.jsx";
const field = "w-full px-3 py-2 border border-rule rounded-lg bg-white text-sm text-ink";
const btn = "px-3 py-1.5 rounded-lg text-xs font-semibold";
const when = (v) => (toMillis(v) ? new Date(toMillis(v)).toLocaleDateString("en-IN") : "");

const URGENCY_STYLE = {
  routine: "bg-slate-100 text-slate-700 border-rule",
  soon: "bg-amber-50 text-amber-800 border-amber-200",
  urgent: "bg-rose-50 text-rose-700 border-rose-200",
};
const STATUS_TEXT = { sent: "Waiting for reply", accepted: "Accepted", declined: "Declined", completed: "Completed" };

function Registration({ api, defaults, geocode, showToast, onDone, existing }) {
  const [f, setF] = useState({
    fullName: "", qualification: "", specialty: "general", councilState: "", registrationNo: "",
    clinicName: defaults.clinicName || "", clinicAddress: defaults.clinicAddress || "",
    timings: "", phone: defaults.phone || "", whatsapp: "", ...(existing || {}),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const problem = validateProfile(f);
    if (problem) return setError(problem);
    setBusy(true);
    try {
      const place = await geocode(f.clinicAddress);
      if (!place) {
        setError("We could not find that address on the map. Add the area, city and pin code, then try again.");
        return;
      }
      await api.saveNewProfile({ ...f, ...geoFields(place.lat, place.lng) });
      showToast("Registration sent for verification");
      onDone();
    } catch {
      setError("Could not save your registration. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const text = (k, label, props = {}) => (
    <div>
      <label htmlFor={`c-${k}`} className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      <input id={`c-${k}`} value={f[k] || ""} onChange={set(k)} className={field} {...props} />
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="bg-white border border-rule rounded-xl p-5 space-y-3 max-w-2xl">
      <div>
        <h2 className="font-display text-xl font-bold text-ink">Join MeriDent Connect</h2>
        <p className="text-sm text-slate-600 mt-1">
          A closed network of verified dentists. We check your council registration before you can find or be found. Only your professional details are shown, never ratings or reviews.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {text("fullName", "Full name", { autoComplete: "name" })}
        {text("qualification", "Qualification, for example BDS or MDS (Endodontics)")}
        <div>
          <label htmlFor="c-specialty" className="block text-xs font-semibold text-slate-600 mb-1">Specialty</label>
          <select id="c-specialty" value={f.specialty} onChange={set("specialty")} className={field}>
            {SPECIALTIES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        {text("councilState", "State Dental Council")}
        {text("registrationNo", "Council registration number")}
        {text("clinicName", "Clinic name")}
      </div>
      {text("clinicAddress", "Clinic address with area, city and pin code")}
      <div className="grid sm:grid-cols-3 gap-3">
        {text("timings", "Clinic timings (optional)", { placeholder: "Mon to Sat, 10 am to 7 pm" })}
        {text("phone", "Clinic phone (mobile)", { inputMode: "tel" })}
        {text("whatsapp", "WhatsApp (optional)", { inputMode: "tel" })}
      </div>
      {error && <p role="alert" className="text-sm font-medium text-rose-700">{error}</p>}
      <button type="submit" disabled={busy} className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-bold px-5 py-2.5 rounded-lg">
        {busy ? "Sending…" : "Send for verification"}
      </button>
    </form>
  );
}

function ConsultForm({ target, onCancel, onSend }) {
  const [form, setForm] = useState({ urgency: "routine", patientRef: "", caseSummary: "", consent: false });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    const problem = validateConsult(form);
    if (problem) return setError(problem);
    setBusy(true);
    try {
      await onSend(form);
    } catch {
      setError("Could not send the request. Check your connection and try again.");
      setBusy(false);
    }
  };
  const hasSummary = form.caseSummary.trim().length > 0;
  return (
    <form onSubmit={submit} noValidate className="mt-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-3" aria-label={`Consult request to ${target.fullName}`}>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="cr-urgency" className="block text-xs font-semibold text-slate-600 mb-1">How urgent is it?</label>
          <select id="cr-urgency" value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })} className={field}>
            {URGENCIES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="cr-ref" className="block text-xs font-semibold text-slate-600 mb-1">Patient initials or ID (not the full name)</label>
          <input id="cr-ref" value={form.patientRef} maxLength={12} onChange={(e) => setForm({ ...form, patientRef: e.target.value })} className={field} />
        </div>
      </div>
      <div>
        <label htmlFor="cr-summary" className="block text-xs font-semibold text-slate-600 mb-1">Case summary (optional)</label>
        <textarea id="cr-summary" rows={3} maxLength={MAX_SUMMARY} value={form.caseSummary} onChange={(e) => setForm({ ...form, caseSummary: e.target.value })} className={field} placeholder="Reason for referral, relevant findings, medications and allergies" />
      </div>
      {hasSummary && (
        <label className="flex items-start gap-2 text-xs text-slate-700">
          <input type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} className="mt-0.5" />
          <span>{CONSENT_TEXT}</span>
        </label>
      )}
      {error && <p role="alert" className="text-sm font-medium text-rose-700">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className={`${btn} bg-brand-600 text-white disabled:opacity-60`}>{busy ? "Sending…" : "Send consult request"}</button>
        <button type="button" onClick={onCancel} className={`${btn} text-slate-600 hover:bg-slate-100`}>Cancel</button>
      </div>
    </form>
  );
}

function Finder({ api, me, showToast, refreshSent, onMessage }) {
  const [specialty, setSpecialty] = useState("all");
  const [radius, setRadius] = useState(10);
  const [state, setState] = useState({ status: "loading", docs: [] });
  const [openId, setOpenId] = useState(null);

  const run = useCallback(async () => {
    setState({ status: "loading", docs: [] });
    try {
      setState({ status: "ready", docs: await api.search(me.geo, radius) });
    } catch {
      setState({ status: "error", docs: [] });
    }
  }, [api, me.geo, radius]);
  useEffect(() => { run(); }, [run]);

  const results = useMemo(() => orderResults(filterResults(state.docs, { specialty, excludeId: api.uid })), [state.docs, specialty, api.uid]);
  const nextRadius = DISTANCES_KM.find((d) => d > radius);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="f-spec" className="block text-xs font-semibold text-slate-600 mb-1">Specialty</label>
          <select id="f-spec" value={specialty} onChange={(e) => setSpecialty(e.target.value)} className={`${field} w-auto`}>
            <option value="all">Any specialty</option>
            {SPECIALTIES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        <div role="group" aria-label="Distance from your clinic" className="flex gap-1.5">
          {DISTANCES_KM.map((d) => (
            <button key={d} type="button" aria-pressed={radius === d} onClick={() => setRadius(d)}
              className={`${btn} border ${radius === d ? "bg-ink text-white border-ink" : "bg-white text-slate-700 border-rule hover:bg-mist"}`}>
              {d} km
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-500">Nearest first. Results are not ranked by payment, ratings or popularity.</p>

      {state.status === "loading" && <p role="status" className="text-sm text-slate-600">Searching near your clinic…</p>}
      {state.status === "error" && (
        <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Could not search right now. Check your connection and <button type="button" onClick={run} className="font-bold underline">try again</button>.
        </div>
      )}
      {state.status === "ready" && results.length === 0 && (
        <div className="rounded-xl border border-dashed border-rule bg-white p-6 text-center text-sm text-slate-600">
          No {specialty === "all" ? "specialists" : specialtyLabel(specialty).toLowerCase()} are listed within {radius} km yet.
          {nextRadius && (
            <div className="mt-3">
              <button type="button" onClick={() => setRadius(nextRadius)} className={`${btn} bg-brand-600 text-white`}>Search up to {nextRadius} km</button>
            </div>
          )}
        </div>
      )}
      <ul className="space-y-3">
        {results.map((d) => (
          <li key={d.id} className="bg-white border border-rule rounded-xl p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="font-display font-bold text-ink">{d.fullName}</div>
                <div className="text-xs text-slate-600">{d.qualification} · {specialtyLabel(d.specialty)}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-brand-700 tabular">{d.distanceKm.toFixed(1)} km</div>
                {d.emergencyAvailable && <div className="text-[11px] font-semibold text-rose-700">Emergency available</div>}
              </div>
            </div>
            <div className="mt-2 text-sm text-slate-700 flex gap-1.5"><MapPin className="w-4 h-4 mt-0.5 shrink-0 text-brand-600" aria-hidden="true" /><span>{d.clinicName}, {d.clinicAddress}</span></div>
            {d.timings && <div className="text-xs text-slate-500 mt-1">{d.timings}</div>}
            <div className="mt-3 flex flex-wrap gap-2">
              {telLink(d.phone) && <a href={telLink(d.phone)} className={`${btn} border border-rule text-slate-800 inline-flex items-center gap-1`}><Phone className="w-3 h-3" /> Call</a>}
              {waLink(d.whatsapp || d.phone) && (
                <a href={waLink(d.whatsapp || d.phone)} target="_blank" rel="noopener noreferrer" className={`${btn} bg-emerald-600 text-white inline-flex items-center gap-1`}>
                  <MessageCircle className="w-3 h-3" /> WhatsApp
                </a>
              )}
              <button type="button" onClick={() => onMessage?.({ id: d.id, name: d.fullName })} className={`${btn} border border-rule text-slate-800`}>Message</button>
              <button type="button" onClick={() => setOpenId(openId === d.id ? null : d.id)} className={`${btn} bg-brand-600 text-white`}>Ask for a consult</button>
            </div>
            {openId === d.id && (
              <ConsultForm
                target={d}
                onCancel={() => setOpenId(null)}
                onSend={async (form) => {
                  await api.createConsult(me, d.id, form);
                  showToast(`Consult request sent to ${d.fullName}`);
                  setOpenId(null);
                  refreshSent();
                }}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ConsultList({ api, side, items, reload, showToast }) {
  const [reports, setReports] = useState({});
  const [busy, setBusy] = useState("");
  const act = async (c, status) => {
    setBusy(c.id);
    try {
      await api.respondConsult(c, status, reports[c.id] || "");
      showToast(status === "accepted" ? "Accepted" : status === "declined" ? "Declined" : "Marked completed");
      await reload();
    } catch {
      showToast("Could not update the request. Try again.");
    } finally {
      setBusy("");
    }
  };
  if (!items.length)
    return <p className="rounded-xl border border-dashed border-rule bg-white p-6 text-center text-sm text-slate-600">{side === "received" ? "No consult requests yet. They appear here when another dentist asks for your help." : "You have not sent any consult requests."}</p>;
  return (
    <ul className="space-y-3">
      {items.map((c) => (
        <li key={c.id} className="bg-white border border-rule rounded-xl p-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-bold text-ink">{side === "received" ? `${c.fromName}, ${c.fromClinic}` : "Consult request"}</div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${URGENCY_STYLE[c.urgency]}`}>{URGENCIES.find(([k]) => k === c.urgency)?.[1]}</span>
              <span className="text-xs font-semibold text-slate-600">{STATUS_TEXT[c.status]}</span>
            </div>
          </div>
          <div className="text-xs text-slate-500">{when(c.createdAt)}{c.patientRef ? ` · Patient ${c.patientRef}` : ""}</div>
          {c.caseSummary && <p className="text-sm text-slate-700 whitespace-pre-wrap">{c.caseSummary}</p>}
          {c.reportBack && <p className="text-sm bg-emerald-50 border border-emerald-100 rounded-lg p-2.5"><strong>Report back:</strong> {c.reportBack}</p>}
          {side === "received" && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {c.fromPhone && <a href={telLink(c.fromPhone)} className={`${btn} border border-rule text-slate-800`}>Call {c.fromName}</a>}
              {canMoveTo(c.status, "accepted") && <button type="button" disabled={busy === c.id} onClick={() => act(c, "accepted")} className={`${btn} bg-brand-600 text-white disabled:opacity-60`}>Accept</button>}
              {canMoveTo(c.status, "declined") && <button type="button" disabled={busy === c.id} onClick={() => act(c, "declined")} className={`${btn} border border-rule text-slate-700 disabled:opacity-60`}>Decline</button>}
              {canMoveTo(c.status, "completed") && (
                <div className="w-full space-y-2">
                  <label htmlFor={`rb-${c.id}`} className="block text-xs font-semibold text-slate-600">Report back to {c.fromName} (optional)</label>
                  <textarea id={`rb-${c.id}`} rows={2} maxLength={MAX_SUMMARY} value={reports[c.id] || ""} onChange={(e) => setReports({ ...reports, [c.id]: e.target.value })} className={field} />
                  <button type="button" disabled={busy === c.id} onClick={() => act(c, "completed")} className={`${btn} bg-brand-600 text-white disabled:opacity-60`}>Mark completed</button>
                </div>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function Listing({ api, me, reloadMe, showToast }) {
  const [timings, setTimings] = useState(me.timings || "");
  const flip = async (changes, msg) => {
    try { await api.updateOwnSettings(changes); await reloadMe(); showToast(msg); } catch { showToast("Could not save. Try again."); }
  };
  const toggleListed = async () => {
    try { await api.setListed(me, !me.listed); await reloadMe(); showToast(me.listed ? "You are no longer listed" : "You are now listed in the finder"); } catch { showToast("Could not save. Try again."); }
  };
  const row = "flex items-start gap-3 py-3";
  return (
    <div className="bg-white border border-rule rounded-xl p-5 max-w-2xl divide-y divide-rule">
      <div className="pb-3">
        <div className="font-display font-bold text-lg text-ink">{me.fullName}</div>
        <div className="text-sm text-slate-600">{me.qualification} · {specialtyLabel(me.specialty)}</div>
        <div className="text-sm text-slate-600">{me.clinicName}, {me.clinicAddress}</div>
        <div className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><ShieldCheck className="w-3.5 h-3.5" /> Verified</div>
      </div>
      <label className={row}><input type="checkbox" checked={Boolean(me.listed)} onChange={toggleListed} className="mt-1" />
        <span><strong className="text-ink">List me in the specialist finder</strong><span className="block text-xs text-slate-500">Other verified dentists near you can see your name, clinic and phone. Off by default.</span></span></label>
      <label className={row}><input type="checkbox" checked={me.acceptingReferrals !== false} onChange={(e) => flip({ acceptingReferrals: e.target.checked }, "Saved")} className="mt-1" />
        <span><strong className="text-ink">Accepting referrals</strong><span className="block text-xs text-slate-500">Turn off while you are full or away.</span></span></label>
      <label className={row}><input type="checkbox" checked={Boolean(me.emergencyAvailable)} onChange={(e) => flip({ emergencyAvailable: e.target.checked }, "Saved")} className="mt-1" />
        <span><strong className="text-ink">Available for emergencies</strong><span className="block text-xs text-slate-500">Shows an emergency note on your listing.</span></span></label>
      <div className="pt-3 flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="l-timings" className="block text-xs font-semibold text-slate-600 mb-1">Clinic timings</label>
          <input id="l-timings" value={timings} onChange={(e) => setTimings(e.target.value)} className={field} />
        </div>
        <button type="button" onClick={() => flip({ timings }, "Timings saved")} className={`${btn} bg-brand-600 text-white`}>Save timings</button>
      </div>
    </div>
  );
}

function AdminQueue({ api, showToast }) {
  const [state, setState] = useState({ status: "loading", items: [] });
  const load = useCallback(async () => {
    try { setState({ status: "ready", items: await api.listPending() }); } catch { setState({ status: "error", items: [] }); }
  }, [api]);
  useEffect(() => { load(); }, [load]);
  const decide = async (d, verify) => {
    try {
      await (verify ? api.verify(d.id) : api.suspend(d.id));
      showToast(verify ? `${d.fullName} verified` : `${d.fullName} suspended`);
      await load();
    } catch { showToast("Could not update. Try again."); }
  };
  if (state.status === "loading") return <p role="status" className="text-sm text-slate-600">Loading the queue…</p>;
  if (state.status === "error") return <p role="alert" className="text-sm text-amber-900">Could not load the queue.</p>;
  if (!state.items.length) return <p className="rounded-xl border border-dashed border-rule bg-white p-6 text-center text-sm text-slate-600">No dentists are waiting for verification.</p>;
  return (
    <ul className="space-y-3">
      {state.items.map((d) => (
        <li key={d.id} className="bg-white border border-rule rounded-xl p-4 space-y-1.5 text-sm">
          <div className="font-display font-bold text-ink">{d.fullName} <span className="font-normal text-slate-600">· {d.qualification} · {specialtyLabel(d.specialty)}</span></div>
          <div>Council: <strong>{d.councilState}</strong>, registration <strong>{d.registrationNo}</strong></div>
          <div>{d.clinicName}, {d.clinicAddress}</div>
          <div className="text-slate-600">Phone {d.phone}{d.whatsapp ? ` · WhatsApp ${d.whatsapp}` : ""}</div>
          {d.geo && <a href={osmLink(d.geo.lat, d.geo.lng)} target="_blank" rel="noopener noreferrer" className="text-brand-700 font-semibold underline">Check the pin on the map</a>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => decide(d, true)} className={`${btn} bg-brand-600 text-white`}>Verify {d.fullName}</button>
            <button type="button" onClick={() => decide(d, false)} className={`${btn} border border-rule text-slate-700`}>Suspend</button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function Connect({ api, defaults = {}, geocode, showToast, uid, initialTab = "network" }) {
  const [state, setState] = useState({ status: "loading", me: null, admin: false });
  const [tab, setTab] = useState(initialTab);
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [editing, setEditing] = useState(false);
  const [chatWith, setChatWith] = useState(null);
  const [unread, setUnread] = useState(0);

  const loadMe = useCallback(async () => {
    try {
      const [me, admin] = await Promise.all([api.getProfile(), api.isAdmin()]);
      setState({ status: "ready", me, admin });
    } catch {
      setState({ status: "error", me: null, admin: false });
    }
  }, [api]);
  useEffect(() => { loadMe(); }, [loadMe]);

  const loadConsults = useCallback(async () => {
    try {
      const [r, s] = await Promise.all([api.listConsults("received"), api.listConsults("sent")]);
      setReceived(r); setSent(s);
    } catch { showToast("Could not load consult requests."); }
  }, [api, showToast]);
  const verified = state.me?.status === "verified";
  useEffect(() => { if (verified) loadConsults(); }, [verified, loadConsults]);

  // A small badge on the Messages tab: checked now and every minute while Connect is open.
  useEffect(() => {
    if (!verified || !api.listChats) return undefined;
    let live = true;
    const check = async () => {
      try {
        const chats = await api.listChats();
        if (live) setUnread(tab === "messages" ? 0 : countUnread(chats, api.uid, lastSeen(api.uid)));
      } catch { /* the badge is optional */ }
    };
    check();
    const t = setInterval(check, 60000);
    return () => { live = false; clearInterval(t); };
  }, [verified, api, tab]);
  useEffect(() => { if (tab === "messages") { markSeen(api.uid); setUnread(0); } }, [tab, api.uid]);

  const { status, me, admin } = state;
  const newCount = received.filter((c) => c.status === "sent").length;

  if (!api.enabled) return <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">MeriDent Connect needs you to be signed in and online.</p>;
  if (status === "loading") return <p role="status" className="text-sm text-slate-600">Loading MeriDent Connect…</p>;
  if (status === "error") return <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">Could not open MeriDent Connect. Check your connection and reload.</p>;

  const tabs = verified
    ? [["network", "Network"], ["find", "Find specialists"], ["messages", `Messages${unread ? ` (${unread})` : ""}`], ["inbox", `Requests received${newCount ? ` (${newCount})` : ""}`], ["sent", "Requests sent"], ["listing", "My listing"]]
    : [];
  if (admin) tabs.push(["admin", "Verify dentists"], ["reports", "Reports"]);

  let body;
  if (!me || editing) {
    body = <Registration api={api} defaults={defaults} geocode={geocode} showToast={showToast} existing={editing ? me : null} onDone={() => { setEditing(false); loadMe(); }} />;
  } else if (me.status === "suspended") {
    body = <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">Your MeriDent Connect access is suspended. Contact MeriDent support.</p>;
  } else if (!verified && tab !== "admin") {
    body = (
      <div className="bg-white border border-rule rounded-xl p-5 max-w-2xl space-y-2" role="status">
        <h2 className="font-display text-xl font-bold text-ink">Waiting for verification</h2>
        <p className="text-sm text-slate-600">We are checking your council registration ({me.councilState}, {me.registrationNo}). You can find and contact specialists once it is verified.</p>
        <button type="button" onClick={() => setEditing(true)} className={`${btn} border border-rule text-slate-700`}>Correct my details</button>
      </div>
    );
  } else if (tab === "network") body = <ConnectFeed api={api} me={me} admin={admin} showToast={showToast} />;
  else if (tab === "find") body = <Finder api={api} me={me} showToast={showToast} refreshSent={loadConsults} onMessage={(d) => { setChatWith(d); setTab("messages"); }} />;
  else if (tab === "messages") body = <ConnectMessages api={api} me={me} start={chatWith} showToast={showToast} />;
  else if (tab === "inbox") body = <ConsultList api={api} side="received" items={received} reload={loadConsults} showToast={showToast} />;
  else if (tab === "sent") body = <ConsultList api={api} side="sent" items={sent} reload={loadConsults} showToast={showToast} />;
  else if (tab === "listing") body = <Listing api={api} me={me} reloadMe={loadMe} showToast={showToast} />;
  else if (tab === "admin") body = <AdminQueue api={api} showToast={showToast} />;
  else if (tab === "reports") body = <ReportsQueue api={api} showToast={showToast} />;

  return (
    <div className="space-y-5" data-testid="connect-screen">
      <div>
        <h1 className="text-xl font-bold text-ink">MeriDent Connect</h1>
        <p className="text-xs text-slate-500">The professional network for verified dentists: discuss cases, ask peers, share tips and events, and refer to a specialist near you.</p>
      </div>
      {tabs.length > 0 && (
        <div role="tablist" className="flex flex-wrap gap-2">
          {tabs.map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold ${tab === id ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
              {label}
            </button>
          ))}
        </div>
      )}
      {body}
      {!verified && (
        <details className="text-xs text-slate-500 max-w-2xl">
          <summary className="cursor-pointer">Account ID (for MeriDent staff setup)</summary>
          <code className="select-all break-all">{uid}</code>
        </details>
      )}
    </div>
  );
}
