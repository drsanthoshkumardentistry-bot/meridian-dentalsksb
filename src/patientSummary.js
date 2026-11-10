import { balancePaise, normalizeInvoice } from "./billing.js";
import { dateKey } from "./reminders.js";

const isActive = (a) => !["cancelled", "canceled", "completed", "no show", "no-show"].includes(String(a?.status || "").toLowerCase());
const mine = (patient, id, name) => (id && id === patient.id) || (!id && name && String(name).trim().toLowerCase() === String(patient.name).trim().toLowerCase());

/** The few facts a dentist wants at the top of a patient file. */
export const patientSummary = (patient, invoices = [], appointments = [], now = new Date()) => {
  const today = dateKey(now);
  const inv = invoices.map(normalizeInvoice).filter((i) => mine(patient, i.patientId, i.patient));
  const appts = appointments.filter((a) => mine(patient, a.patientId, a.patientName));
  const next = appts.filter((a) => isActive(a) && a.date >= today).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))[0] || null;
  const last = appts.filter((a) => String(a.status || "").toLowerCase() === "completed" && a.date <= today).sort((a, b) => b.date.localeCompare(a.date))[0] || null;
  const plans = patient.plans || [];
  return {
    dueP: inv.reduce((s, i) => s + balancePaise(i), 0),
    invoiceCount: inv.length,
    nextAppt: next,
    lastVisitDate: last ? last.date : (patient.visits || [])[0]?.date || "",
    plansOpen: plans.filter((p) => p.status === "Proposed" || p.status === "Approved").length,
    teethCharted: Object.keys(patient.toothConditions || {}).length
  };
};
