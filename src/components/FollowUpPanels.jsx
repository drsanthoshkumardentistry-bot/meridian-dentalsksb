import React, { useState } from "react";
import { Send, Star } from "lucide-react";
import { formatDateLong } from "../reminders.js";
import { canInviteReview, LOW_RATING } from "../followup.js";

const wa = "px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap";
const quiet = "px-2 py-1.5 text-slate-500 hover:text-slate-700 text-[11px] font-semibold whitespace-nowrap";
const row = "flex flex-wrap items-center justify-between gap-2 bg-enamel rounded-lg border border-slate-100 px-3 py-2 text-xs";

function RatingPicker({ appt, onRate }) {
  const [comment, setComment] = useState("");
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <input aria-label={`Comment from ${appt.patientName}`} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={300} placeholder="Their words (optional)"
        className="w-40 sm:w-48 px-2 py-1 border border-slate-300 rounded text-[11px] bg-white" />
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onRate(appt, n, comment)} aria-label={`Record ${n} out of 5 for ${appt.patientName}`}
          className="h-7 w-7 rounded border border-rule bg-white text-[11px] font-bold text-slate-700 hover:bg-brand-50 hover:border-brand-500">{n}</button>
      ))}
    </div>
  );
}

/** After-visit feedback and treatment-plan follow-up. All changes go through the callbacks. */
export default function FollowUpPanels({ feedbackDue, awaiting, low, plansDue, summary, reviewLink, onAsk, onRate, onResolve, onReview, onPlan, onSnoozePlan, canWrite = true }) {
  if (!feedbackDue.length && !awaiting.length && !low.length && !plansDue.length) return null;
  return (
    <div className="space-y-4">
      {(feedbackDue.length > 0 || awaiting.length > 0 || low.length > 0) && (
        <section className="bg-white border border-rule rounded-xl p-4 space-y-3" data-testid="feedback-panel" aria-label="Patient feedback">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-xs font-bold text-slate-900">Patient feedback</h3>
            {summary.count > 0 && <span className="text-[11px] text-slate-600" data-testid="feedback-summary"><Star className="w-3 h-3 inline -mt-0.5 text-gold-500 fill-gold-500" /> {summary.average} average from {summary.count} {summary.count === 1 ? "rating" : "ratings"} in 90 days</span>}
          </div>

          {low.length > 0 && (
            <div className="space-y-2" role="group" aria-label="Low ratings">
              <div className="text-[11px] font-semibold text-rose-700">Rated {LOW_RATING} or below, please call them</div>
              {low.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs">
                  <div>
                    <div className="font-semibold text-slate-900">{a.patientName} · {a.feedback.rating} out of 5</div>
                    <div className="text-[11px] text-slate-600">{formatDateLong(a.date)} · {a.procedure}{a.feedback.comment ? ` · "${a.feedback.comment}"` : ""}</div>
                  </div>
                  {canWrite && <button type="button" onClick={() => onResolve(a)} className="px-3 py-1.5 rounded border border-rose-300 bg-white text-[11px] font-semibold text-rose-700 hover:bg-rose-100">Mark as handled</button>}
                </div>
              ))}
            </div>
          )}

          {feedbackDue.length > 0 && (
            <div className="space-y-2" role="group" aria-label="Ask for feedback">
              <div className="text-[11px] font-semibold text-slate-600">Recent visits to ask about ({feedbackDue.length})</div>
              {feedbackDue.slice(0, 5).map((a) => (
                <div key={a.id} className={row}>
                  <div>
                    <div className="font-semibold text-slate-900">{a.patientName}</div>
                    <div className="text-[11px] text-slate-500">{formatDateLong(a.date)} · {a.procedure}</div>
                  </div>
                  {canWrite && <button type="button" onClick={() => onAsk(a)} className={wa}><Send className="w-3 h-3" /> Ask for feedback</button>}
                </div>
              ))}
            </div>
          )}

          {awaiting.length > 0 && (
            <div className="space-y-2" role="group" aria-label="Waiting for a reply">
              <div className="text-[11px] font-semibold text-slate-600">Asked, waiting for a reply ({awaiting.length}). Record the number they send back.</div>
              {awaiting.slice(0, 5).map((a) => (
                <div key={a.id} className={row}>
                  <div className="font-semibold text-slate-900">{a.patientName}<span className="block text-[11px] font-normal text-slate-500">{formatDateLong(a.date)}</span></div>
                  {canWrite && <RatingPicker appt={a} onRate={onRate} />}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {plansDue.length > 0 && (
        <section className="bg-white border border-rule rounded-xl p-4 space-y-3" data-testid="plan-followup-panel" aria-label="Treatment plan follow-up">
          <h3 className="text-xs font-bold text-slate-900">Treatment plans waiting ({plansDue.length})</h3>
          <div className="space-y-2">
            {plansDue.slice(0, 5).map((d) => (
              <div key={`${d.patient.id}-${d.plan.id}`} className={row}>
                <div>
                  <div className="font-semibold text-slate-900">{d.patient.name} · {d.plan.title}</div>
                  <div className="text-[11px] text-slate-500">{d.plan.status === "Approved" ? "Agreed" : "Estimate sent"} {d.days} days ago, nothing booked</div>
                </div>
                {canWrite && (
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => onSnoozePlan(d)} className={quiet}>Not now</button>
                    <button type="button" onClick={() => onPlan(d)} className={wa}><Send className="w-3 h-3" /> Follow up</button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-500">Proposed plans after 3 days and approved but unbilled plans after 7 days, for patients with no visit booked. Opted-out patients are never listed.</p>
        </section>
      )}
    </div>
  );
}

/** Offered after a good rating: invite the patient to leave a public review. */
export function ReviewInvites({ appointments, reviewLink, onReview }) {
  const list = appointments.filter((a) => canInviteReview(a, reviewLink));
  if (!list.length) return null;
  return (
    <section className="bg-white border border-rule rounded-xl p-4 space-y-2" data-testid="review-panel" aria-label="Review invitations">
      <h3 className="text-xs font-bold text-slate-900">Happy patients, invite a review ({list.length})</h3>
      {list.slice(0, 5).map((a) => (
        <div key={a.id} className={row}>
          <div className="font-semibold text-slate-900">{a.patientName} · {a.feedback.rating} out of 5</div>
          <button type="button" onClick={() => onReview(a)} className={wa}><Send className="w-3 h-3" /> Send review link</button>
        </div>
      ))}
    </section>
  );
}

/** Treatment in stages: patients whose next visit is near or missed, with no visit booked. */
export function NextVisitPanel({ items, onRemind, onSnooze, canWrite = true }) {
  if (!items.length) return null;
  return (
    <section className="bg-white border border-rule rounded-xl p-4 space-y-2" data-testid="next-visit-panel" aria-label="Next visits due">
      <h3 className="text-xs font-bold text-slate-900">Next visit due ({items.length})</h3>
      {items.slice(0, 8).map(({ patient, visit, daysLate }) => (
        <div key={`${patient.id}-${visit.id}`} className={row}>
          <div>
            <div className="font-semibold text-slate-900">{patient.name}</div>
            <div className="text-[11px] text-slate-500">
              {daysLate > 0 ? `${daysLate} ${daysLate === 1 ? "day" : "days"} overdue` : daysLate === 0 ? "Due today" : "Due soon"}
              {visit.nextVisit ? ` · ${visit.nextVisit}` : ""}
            </div>
          </div>
          {canWrite && (
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => onSnooze({ patient, visit })} className={quiet}>Not now</button>
              <button type="button" onClick={() => onRemind({ patient, visit })} className={wa}><Send className="w-3 h-3" /> Remind</button>
            </div>
          )}
        </div>
      ))}
      <p className="text-[10px] text-slate-500">From the "Next visit on" date in the latest visit note. Opted-out patients and patients with a visit booked are never listed.</p>
    </section>
  );
}
