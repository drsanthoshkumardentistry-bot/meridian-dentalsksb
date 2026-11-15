import React, { useState } from "react";
import { PLANS, planStatus, subscribeText } from "../plan.js";
import { CONTACT } from "../legal.js";

/** Settings: shows the clinic its plan. During the trial run everything is free and nothing is charged. */
export default function PlanCard({ clinic = "", createdAt, now }) {
  const [planId, setPlanId] = useState("standard");
  const status = planStatus({ createdAt, now });
  const link = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(subscribeText({ planId, clinic }))}`;
  return (
    <section className="rounded-xl border border-rule p-4 space-y-3" data-testid="plan-card">
      <div>
        <h2 className="text-base font-bold text-slate-900">Your plan</h2>
        {status.state === "free" && <p className="text-xs text-slate-600">We are in our trial run. Everything is free for now and nobody is being charged. We will tell you well before that changes.</p>}
        {status.state === "trial" && <p className="text-xs text-slate-600">Free trial: {status.daysLeft} days left. Everything is included.</p>}
        {status.state === "paid" && <p className="text-xs text-slate-600">{status.plan === "pro" ? "Pro" : "Standard"} plan, {status.daysLeft} days left.</p>}
        {status.state === "ended" && <p role="alert" className="text-xs text-rose-700">Your free trial has ended. Choose a plan to keep using MeriDent. You can always download your data.</p>}
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {PLANS.map((p) => (
          <label key={p.id} className={`rounded-lg border p-3 text-xs cursor-pointer ${planId === p.id ? "border-blue-600 bg-blue-50" : "border-slate-200"}`}>
            <input type="radio" name="plan" className="sr-only" checked={planId === p.id} onChange={() => setPlanId(p.id)} aria-label={`${p.name} plan`} />
            <div className="font-bold text-slate-900">{p.name} <span className="font-normal text-slate-600">₹{p.monthly}/month{p.yearly ? `, or ₹${p.yearly.toLocaleString("en-IN")}/year` : ""}</span></div>
            <ul className="mt-1 text-slate-600 list-disc pl-4">{p.points.map((x) => <li key={x}>{x}</li>)}</ul>
          </label>
        ))}
      </div>
      <p className="text-[11px] text-slate-500">Planned prices, per clinic. The first 10 clinics get 3 months free in return for feedback.</p>
      <a href={link} target="_blank" rel="noopener noreferrer" className="inline-block px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold">Tell us you are interested (WhatsApp)</a>
    </section>
  );
}
