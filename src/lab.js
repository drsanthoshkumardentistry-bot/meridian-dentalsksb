/* ==============================================================================
 * MERIDENT OS - DENTAL LAB ORDERS (pure functions, no React)
 * Orders live on the patient (patient.labOrders), so they sync and follow the same access as the chart.
 * Messages open WhatsApp with the text ready; the clinic taps Send.
 * ============================================================================== */

import { whatsappNumber, hasWhatsAppConsent, parseAnyDate, dateKey, formatDateLong } from "./reminders.js";
import { parseTeeth } from "./plans.js";
import { toothInfo } from "./odontogram.js";

export const WORK_TYPES = ["Crown", "Bridge", "Implant crown", "Veneer", "Inlay / onlay", "Complete denture", "Partial denture", "Night guard", "Retainer", "Aligner", "Other"];
export const LAB_STATUS = { sent: "With the lab", received: "Received", fitted: "Fitted", cancelled: "Cancelled" };
export const OPEN_STATUSES = ["sent", "received"];
export const DUE_SOON_DAYS = 2;

const DAY = 24 * 60 * 60 * 1000;
const asDate = (key) => parseAnyDate(key);

/** Returns an error message, or "" when the draft can be saved. */
export const validateLabOrder = (d = {}, now = new Date()) => {
  if (!String(d.lab || "").trim()) return "Enter the lab's name";
  if (String(d.lab).trim().length > 60) return "Keep the lab name under 60 characters";
  if (!WORK_TYPES.includes(d.workType)) return "Choose the type of work";
  const teeth = parseTeeth(d.teeth);
  if (String(d.teeth || "").trim() && teeth.some((n) => !toothInfo(n))) return "Tooth numbers must be valid FDI numbers such as 16 or 46, separated by commas";
  if (d.labPhone && !whatsappNumber(d.labPhone)) return "The lab's WhatsApp number must be a 10-digit mobile number";
  const sent = asDate(d.sentOn);
  const due = asDate(d.dueOn);
  if (!sent) return "Choose the date you sent the work";
  if (!due) return "Choose the date you expect it back";
  if (due < sent) return "The expected date cannot be before the sent date";
  if (String(d.note || "").length > 300) return "Keep the note under 300 characters";
  return "";
};

export const createLabOrder = (d, id) => ({
  id,
  lab: String(d.lab).trim(),
  labPhone: String(d.labPhone || "").trim(),
  workType: d.workType,
  teeth: parseTeeth(d.teeth).join(", "),
  shade: String(d.shade || "").trim().slice(0, 20),
  sentOn: d.sentOn,
  dueOn: d.dueOn,
  note: String(d.note || "").trim(),
  status: "sent",
  receivedOn: "",
  fittedOn: "",
});

const FLOW = { sent: ["received", "cancelled"], received: ["fitted", "cancelled"], fitted: [], cancelled: [] };
export const canMove = (order, to) => (FLOW[order.status] || []).includes(to);

export const moveLabOrder = (order, to, now = new Date()) => {
  if (!canMove(order, to)) return order;
  const next = { ...order, status: to };
  if (to === "received") next.receivedOn = dateKey(now);
  if (to === "fitted") next.fittedOn = dateKey(now);
  return next;
};

/** Days until due (negative when late). Only meaningful for orders still with the lab. */
export const daysToDue = (order, now = new Date()) => {
  const due = asDate(order.dueOn);
  if (!due) return null;
  const today = asDate(dateKey(now));
  return Math.round((due.getTime() - today.getTime()) / DAY);
};

export const isOverdue = (order, now = new Date()) => order.status === "sent" && (daysToDue(order, now) ?? 0) < 0;
export const isDueSoon = (order, now = new Date()) => {
  const d = daysToDue(order, now);
  return order.status === "sent" && d !== null && d >= 0 && d <= DUE_SOON_DAYS;
};

/** Every open order across patients, with its patient, most urgent first. */
export const openLabOrders = (patients = [], now = new Date()) => {
  const rows = [];
  for (const patient of patients) {
    for (const order of patient.labOrders || []) {
      if (!OPEN_STATUSES.includes(order.status)) continue;
      rows.push({ patient, order, days: daysToDue(order, now), overdue: isOverdue(order, now), dueSoon: isDueSoon(order, now) });
    }
  }
  const rank = (r) => (r.order.status === "received" ? 1 : 0);
  return rows.sort((a, b) => rank(b) - rank(a) || (a.days ?? 99999) - (b.days ?? 99999));
};

export const overdueCount = (patients = [], now = new Date()) =>
  patients.reduce((n, p) => n + (p.labOrders || []).filter((o) => isOverdue(o, now)).length, 0);

/** Work back from the lab and not yet fitted that the patient has not been told about. */
export const readyToTell = (patients = []) =>
  openLabOrders(patients).filter((r) => r.order.status === "received" && !r.order.patientNotifiedAt && whatsappNumber(r.patient.phone) && hasWhatsAppConsent(r.patient));

const what = (o) => `${o.workType}${o.teeth ? ` (${parseTeeth(o.teeth).length > 1 ? "teeth" : "tooth"} ${o.teeth})` : ""}${o.shade ? `, shade ${o.shade}` : ""}`;

export const buildLabChase = ({ clinicName, patient, order }) =>
  `Hello ${order.lab},\n\n` +
  `This is ${clinicName || "our dental clinic"}. Could you please update us on the ${what(order)} for patient ${patient.name}? ` +
  `We sent it on ${formatDateLong(order.sentOn)} and expected it by ${formatDateLong(order.dueOn)}.\n\n` +
  `Thank you.`;

export const buildPatientReady = ({ clinicName, clinicPhone, patient, order }) =>
  `Hello ${patient.name},\n\n` +
  `Your ${order.workType.toLowerCase()} has come back from the lab and is ready to be fitted at ${clinicName || "our dental clinic"}.\n\n` +
  `Reply to this message${clinicPhone ? ` or call ${clinicPhone}` : ""} to book a convenient time.\n\n` +
  `Thank you.`;

export const markPatientNotified = (order, now = new Date()) => ({ ...order, patientNotifiedAt: now.toISOString() });

/** Lab names already used, for the name suggestions. */
export const knownLabs = (patients = []) => {
  const map = new Map();
  for (const p of patients) for (const o of p.labOrders || []) if (o.lab && !map.has(o.lab.toLowerCase())) map.set(o.lab.toLowerCase(), { lab: o.lab, labPhone: o.labPhone || "" });
  return [...map.values()];
};
