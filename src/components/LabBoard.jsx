import React from "react";
import { Send } from "lucide-react";
import { formatDateLong, whatsappNumber } from "../reminders.js";
import { LAB_STATUS } from "../lab.js";

const wa = "px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap";
const ghost = "px-3 py-1.5 rounded border border-rule bg-white text-[11px] font-semibold text-slate-700 hover:bg-enamel whitespace-nowrap";

const dueText = (r) => {
  if (r.order.status === "received") return "Back from the lab, ready to fit";
  if (r.days === null) return "No due date";
  if (r.days < 0) return `${-r.days} ${-r.days === 1 ? "day" : "days"} late`;
  if (r.days === 0) return "Due today";
  return `Due in ${r.days} ${r.days === 1 ? "day" : "days"}`;
};

/** Open lab work across all patients. Every change goes through the callbacks. */
export default function LabBoard({ rows, onReceive, onFit, onChase, onTellPatient, canWrite = true }) {
  if (!rows.length) return null;
  return (
    <section className="bg-white border border-rule rounded-xl p-4 space-y-3" data-testid="lab-board" aria-label="Lab work in progress">
      <h3 className="text-xs font-bold text-slate-900">Lab work in progress ({rows.length})</h3>
      <div className="space-y-2">
        {rows.slice(0, 8).map((r) => (
          <div key={`${r.patient.id}-${r.order.id}`} className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs ${r.overdue ? "border-rose-200 bg-rose-50" : "border-slate-100 bg-enamel"}`}>
            <div className="min-w-0">
              <div className="font-semibold text-slate-900">{r.patient.name} · {r.order.workType}{r.order.teeth ? ` (${r.order.teeth})` : ""}</div>
              <div className={`text-[11px] ${r.overdue ? "font-semibold text-rose-700" : "text-slate-600"}`}>{r.order.lab} · {LAB_STATUS[r.order.status]} · {dueText(r)} · expected {formatDateLong(r.order.dueOn)}</div>
            </div>
            {canWrite && (
              <div className="flex flex-wrap items-center gap-1.5">
                {r.order.status === "sent" && (
                  <>
                    {whatsappNumber(r.order.labPhone) && <button type="button" onClick={() => onChase(r)} className={ghost}>Message lab</button>}
                    <button type="button" onClick={() => onReceive(r)} className={ghost}>Mark received</button>
                  </>
                )}
                {r.order.status === "received" && (
                  <>
                    {!r.order.patientNotifiedAt && whatsappNumber(r.patient.phone) && <button type="button" onClick={() => onTellPatient(r)} className={wa}><Send className="w-3 h-3" /> Tell patient</button>}
                    <button type="button" onClick={() => onFit(r)} className={ghost}>Mark fitted</button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
