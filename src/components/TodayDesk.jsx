import React from "react";
import { formatINR } from "../billing.js";
import { formatTime12, formatDateLong, whatsappLink } from "../reminders.js";

const Card = ({ title, count, children, empty, accent = "bg-brand-600" }) => (
  <section className="relative overflow-hidden bg-white border border-rule rounded-xl p-4 pl-5" aria-label={title}>
    <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${accent}`} aria-hidden="true" />
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      <span className="text-lg font-bold tabular text-slate-900">{count}</span>
    </div>
    <div className="mt-2 text-xs space-y-1.5">{count === 0 ? <p className="text-slate-500">{empty}</p> : children}</div>
  </section>
);
const linkBtn = "underline font-semibold text-blue-700";

/** The reception desk for today: visits, unpaid bills, follow-ups and memberships about to end. */
export default function TodayDesk({ summary, onGo, clinicName = "", embedded = false }) {
  const s = summary;
  return (
    <div className="space-y-4" data-testid="today-screen">
      <div>
        {embedded ? <h2 className="text-lg font-bold text-slate-900">Today at the desk</h2> : <h1 className="text-lg font-bold text-slate-900">Today</h1>}
        <p className="text-xs text-slate-500">{s.upcomingCount} visit{s.upcomingCount === 1 ? "" : "s"} still to come, {s.doneCount} done or cancelled.</p>
      </div>
      <div className={embedded ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3" : "grid grid-cols-1 lg:grid-cols-2 gap-4"}>
        <Card title="Today's visits" count={s.appts.length} accent="bg-brand-600" empty="No visits booked for today.">
          {s.appts.map((a) => (
            <div key={a.id} className="flex justify-between gap-2">
              <span><strong>{formatTime12(a.time)}</strong> {a.patientName}{a.procedure ? ` · ${a.procedure}` : ""}</span>
              <span className="text-slate-500">{a.status || "Scheduled"}</span>
            </div>
          ))}
          {!embedded && <button type="button" className={linkBtn} onClick={() => onGo("Appointments Diary")}>Open diary</button>}
        </Card>
        <Card title="Unpaid bills" accent="bg-rose-500" count={s.unpaidCount} empty="Every bill is paid.">
          <p>₹{formatINR(s.unpaidP)} to collect{s.overdue.length ? `, ${s.overdue.length} overdue` : ""}.</p>
          {s.overdue.slice(0, 5).map((d) => (
            <div key={d.inv.id} className="flex justify-between gap-2"><span>{d.inv.patient} · due {formatDateLong(d.inv.dueDate)}</span><span className="font-semibold">₹{formatINR(d.balanceP)}</span></div>
          ))}
          <button type="button" className={linkBtn} onClick={() => onGo("Billing & Invoices")}>Open billing</button>
        </Card>
        <Card title="Lead follow-ups due" accent="bg-emerald-500" count={s.leadsDue.length} empty="No lead follow-ups due.">
          {s.leadsDue.slice(0, 6).map((l) => {
            const link = whatsappLink(l.phone, `Hello ${l.name}, this is ${clinicName || "our dental clinic"}. Would you like to book a visit${l.interest ? ` for ${l.interest}` : ""}? Reply with a day and time that suits you.`);
            return <div key={l.id} className="flex justify-between gap-2"><span>{l.name} · {l.phone}</span>{link && <a className={linkBtn} href={link} target="_blank" rel="noopener noreferrer">WhatsApp</a>}</div>;
          })}
          <button type="button" className={linkBtn} onClick={() => onGo("Memberships & Leads")}>Open leads</button>
        </Card>
        <Card title="Memberships ending soon" accent="bg-slate-700" count={s.expiring.length} empty="No memberships ending in the next 30 days.">
          {s.expiring.slice(0, 6).map(({ m, daysLeft }) => (
            <div key={m.id} className="flex justify-between gap-2"><span>{m.patientName} · {m.planName}</span><span className="text-amber-800 font-semibold">{daysLeft} day{daysLeft === 1 ? "" : "s"}</span></div>
          ))}
          <button type="button" className={linkBtn} onClick={() => onGo("Memberships & Leads")}>Open memberships</button>
        </Card>
      </div>
    </div>
  );
}
