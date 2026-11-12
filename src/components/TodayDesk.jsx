import React from "react";
import { CalendarDays, ClipboardList, IndianRupee, UserPlus, Award } from "lucide-react";
import { formatINR } from "../billing.js";
import { formatDateLong, whatsappLink } from "../reminders.js";
import { STAT_TONES } from "./DashCards.jsx";

const linkBtn = "font-semibold text-blue-700 hover:underline";

/** A coloured, clickable count tile in the same gradient family as the Dashboard cards. */
function Tile({ tone, icon, title, value, note, onClick, testId }) {
  const t = STAT_TONES[tone] || STAT_TONES.blue;
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={`text-left rounded-2xl border bg-gradient-to-br ${t.card} p-3.5 sm:p-4 flex flex-col gap-2 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift`}
    >
      <span className="flex items-center gap-2.5">
        <span className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center shadow-lg ${t.bubble}`}>{icon}</span>
        <span className="text-[12px] font-semibold text-slate-600 leading-tight">{title}</span>
      </span>
      <span className="text-xl font-bold text-slate-900 tabular leading-none">{value}</span>
      <span className="text-[11px] text-slate-600/80 leading-snug">{note}</span>
    </button>
  );
}

/** A short list card under the tiles; only shown when there is something in it. */
function ListCard({ title, accent, children, action, onAction }) {
  return (
    <section className={`bg-white border border-rule border-t-4 ${accent} rounded-xl p-4 space-y-1.5 text-xs`} aria-label={title}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold text-slate-900">{title}</h3>
        <button type="button" className={`${linkBtn} text-[11px]`} onClick={onAction}>{action} ›</button>
      </div>
      {children}
    </section>
  );
}

/**
 * The "Today" part of the Appointments Diary: today's visits, what needs a status,
 * money to collect, lead follow-ups and memberships ending soon.
 */
export default function TodayDesk({ summary, needsUpdate = 0, onGo, onShowToday, onShowNeedsStatus, clinicName = "" }) {
  const s = summary;
  const todayLabel = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  const hasLists = s.overdue.length > 0 || s.leadsDue.length > 0 || s.expiring.length > 0;
  return (
    <section className="space-y-3" data-testid="today-screen" aria-label="Today">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-base font-bold text-slate-900">Today <span className="font-semibold text-slate-500">· {todayLabel}</span></h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Tile testId="today-visits" tone="blue" icon={<CalendarDays className="w-4 h-4" />} title="Visits today"
          value={s.appts.length} note={`${s.upcomingCount} still to come · ${s.doneCount} done`} onClick={onShowToday} />
        <Tile testId="today-needs-status" tone="peach" icon={<ClipboardList className="w-4 h-4" />} title="Needs a status"
          value={needsUpdate} note={needsUpdate ? "Mark past visits done or no-show" : "All visits are up to date"} onClick={onShowNeedsStatus} />
        <Tile testId="today-to-collect" tone="rose" icon={<IndianRupee className="w-4 h-4" />} title="To collect"
          value={`₹${formatINR(s.unpaidP)}`} note={s.unpaidCount ? `${s.unpaidCount} unpaid bill${s.unpaidCount === 1 ? "" : "s"}${s.overdue.length ? `, ${s.overdue.length} overdue` : ""}` : "Every bill is paid"} onClick={() => onGo("Billing & Invoices")} />
        <Tile testId="today-leads" tone="mint" icon={<UserPlus className="w-4 h-4" />} title="Lead follow-ups"
          value={s.leadsDue.length} note={s.leadsDue.length ? "Due today — message them" : "None due today"} onClick={() => onGo("Memberships & Leads")} />
        <Tile testId="today-memberships" tone="violet" icon={<Award className="w-4 h-4" />} title="Memberships ending"
          value={s.expiring.length} note="In the next 30 days" onClick={() => onGo("Memberships & Leads")} />
      </div>

      {hasLists && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {s.overdue.length > 0 && (
            <ListCard title={`Overdue bills (${s.overdue.length})`} accent="border-t-rose-400" action="Billing" onAction={() => onGo("Billing & Invoices")}>
              {s.overdue.slice(0, 5).map((d) => (
                <div key={d.inv.id} className="flex justify-between gap-2"><span className="truncate">{d.inv.patient} · due {formatDateLong(d.inv.dueDate)}</span><span className="font-semibold text-rose-700 whitespace-nowrap">₹{formatINR(d.balanceP)}</span></div>
              ))}
            </ListCard>
          )}
          {s.leadsDue.length > 0 && (
            <ListCard title={`Leads to call back (${s.leadsDue.length})`} accent="border-t-emerald-400" action="Leads" onAction={() => onGo("Memberships & Leads")}>
              {s.leadsDue.slice(0, 5).map((l) => {
                const link = whatsappLink(l.phone, `Hello ${l.name}, this is ${clinicName || "our dental clinic"}. Would you like to book a visit${l.interest ? ` for ${l.interest}` : ""}? Reply with a day and time that suits you.`);
                return <div key={l.id} className="flex justify-between gap-2"><span className="truncate">{l.name} · {l.phone}</span>{link && <a className="font-semibold text-emerald-700 hover:underline" href={link} target="_blank" rel="noopener noreferrer">WhatsApp</a>}</div>;
              })}
            </ListCard>
          )}
          {s.expiring.length > 0 && (
            <ListCard title={`Memberships ending (${s.expiring.length})`} accent="border-t-violet-400" action="Memberships" onAction={() => onGo("Memberships & Leads")}>
              {s.expiring.slice(0, 5).map(({ m, daysLeft }) => (
                <div key={m.id} className="flex justify-between gap-2"><span className="truncate">{m.patientName} · {m.planName}</span><span className="text-violet-700 font-semibold whitespace-nowrap">{daysLeft} day{daysLeft === 1 ? "" : "s"}</span></div>
              ))}
            </ListCard>
          )}
        </div>
      )}
    </section>
  );
}
