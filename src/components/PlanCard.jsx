import React, { useEffect, useState } from "react";
import { loadMyPlan, requestPlan, loadMyRequest } from "../planApi.js";
import { PLANS, EXTRA_STORAGE, planName, planStatus, subscribeText } from "../plan.js";
import { CONTACT } from "../legal.js";

/** Settings: shows the clinic its plan. During the trial run everything is free and nothing is charged. */
export default function PlanCard({ clinic = "", createdAt, now, loadFn = loadMyPlan, requestFn = requestPlan, myRequestFn = loadMyRequest }) {
  const [paid, setPaid] = useState({ plan: "", paidUntil: 0 });
  useEffect(() => { let live = true; loadFn().then((p) => { if (live && p) setPaid(p); }).catch(() => {}); return () => { live = false; }; }, [loadFn]);
  const [planId, setPlanId] = useState("standard");
  const [req, setReq] = useState({ status: "" });
  const [reqMsg, setReqMsg] = useState("");
  useEffect(() => { let live = true; myRequestFn().then((r) => { if (live && r) setReq(r); }).catch(() => {}); return () => { live = false; }; }, [myRequestFn]);
  const sendRequest = async () => {
    setReqMsg("Sending…");
    try { const r = await requestFn({ plan: planId, yearly: false, clinic }); setReq({ status: r.status || "pending", plan: planId }); setReqMsg(""); }
    catch (e) { setReqMsg((e && e.message) || "Could not send the request. Use WhatsApp instead."); }
  };
  const status = planStatus({ createdAt, now, paidUntil: paid.paidUntil, plan: paid.plan, paused: paid.paused, pausedRemaining: paid.pausedRemaining });
  const link = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(subscribeText({ planId, clinic }))}`;
  return (
    <section className="rounded-xl border border-rule p-4 space-y-3" data-testid="plan-card">
      <div>
        <h2 className="text-base font-bold text-slate-900">Your plan</h2>
        {status.state === "free" && <p className="text-xs text-slate-600">We are in our trial run. Everything is free for now and nobody is being charged. We will tell you well before that changes.</p>}
        {status.state === "trial" && <p className="text-xs text-slate-600">Free trial: {status.daysLeft} days left. Everything is included.</p>}
        {status.state === "paid" && <p className="text-xs text-slate-600">{planName(status.plan)} plan, {status.daysLeft} days left.</p>}
        {status.state === "paused" && <p role="status" className="text-xs text-amber-800" data-testid="plan-paused">Your {planName(status.plan)} plan is paused. {status.daysLeft} days are kept and start again when we resume it. Message us on WhatsApp to start it.</p>}
        {status.state === "ended" && <p role="alert" className="text-xs text-rose-700">Your free trial has ended. Choose a plan to keep using MeriDent. You can always download your data.</p>}
      </div>
      <div className="grid sm:grid-cols-3 gap-2">
        {PLANS.map((p) => (
          <label key={p.id} className={`rounded-lg border p-3 text-xs cursor-pointer ${planId === p.id ? "border-blue-600 bg-blue-50" : "border-slate-200"}`}>
            <input type="radio" name="plan" className="sr-only" checked={planId === p.id} onChange={() => setPlanId(p.id)} aria-label={`${p.name} plan`} />
            <div className="font-bold text-slate-900">{p.name} <span className="font-normal text-slate-600">₹{p.monthly}/month{p.yearly ? `, or ₹${p.yearly.toLocaleString("en-IN")}/year` : ""}</span></div>
            <ul className="mt-1 text-slate-600 list-disc pl-4">{p.points.map((x) => <li key={x}>{x}</li>)}</ul>
          </label>
        ))}
      </div>
      <p className="text-[11px] text-slate-500">Planned prices before GST, per clinic. Need more space for X-rays? Extra {EXTRA_STORAGE.gb} GB is planned at ₹{EXTRA_STORAGE.monthly}/month. Storage limits and the usage meter are not switched on yet. The first 10 clinics get 3 months free in return for feedback.</p>
      {req.status === "pending" && <p role="status" className="text-xs text-blue-800" data-testid="plan-request-status">Your request for {planName(req.plan)} is with us. We will confirm once your payment is received.</p>}
      {req.status === "approved" && <p role="status" className="text-xs text-emerald-700" data-testid="plan-request-status">Your last request was approved.</p>}
      {req.status === "rejected" && <p role="status" className="text-xs text-rose-700" data-testid="plan-request-status">Your last request was not approved. Message us on WhatsApp to sort it out.</p>}
      {reqMsg && <p role="alert" className="text-xs text-rose-700">{reqMsg}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={sendRequest} disabled={req.status === "pending"} className="px-3 py-1.5 rounded-lg bg-blue-700 text-white text-xs font-semibold disabled:opacity-60">Request {PLANS.find((p) => p.id === planId).name}</button>
        <a href={link} target="_blank" rel="noopener noreferrer" className="inline-block px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold">Message us on WhatsApp</a>
      </div>
    </section>
  );
}
