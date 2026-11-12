/* ==============================================================================
 * MERIDENT OS - MESSAGE A GROUP OF PATIENTS (pure functions)
 * Builds the list for a group, drops anyone who cannot be messaged (no valid mobile or
 * WhatsApp switched off) and fills "{name}" and "{clinic}" in the message.
 * Each message is still sent by a person, one tap per patient, from the clinic's own WhatsApp.
 * ============================================================================== */

import { whatsappNumber, whatsappLink, hasWhatsAppConsent, dueRecalls } from "./reminders.js";
import { balancePaise, normalizeInvoice } from "./billing.js";

export const GROUPS = [
  { id: "shown", label: "Patients shown in the list now" },
  { id: "recall", label: "Due for a check-up recall" },
  { id: "balance", label: "Pending balance" },
  { id: "all", label: "All patients" },
];

export const TEMPLATES = [
  { id: "hello", label: "Clinic update", text: "Hello {name}, this is {clinic}. " },
  { id: "camp", label: "Check-up camp", text: "Hello {name}, {clinic} is holding a free dental check-up camp. Reply to this message to book your slot." },
  { id: "holiday", label: "Holiday notice", text: "Hello {name}, a notice from {clinic}: the clinic will be closed on . We reopen the next working day. Thank you." },
];

export const fillMessage = (text, { patient, clinicName }) =>
  String(text || "").replaceAll("{name}", patient?.name || "").replaceAll("{clinic}", clinicName || "our dental clinic");

/** Everyone in the group, split into people we can message and the number we have to skip. */
export const groupRecipients = (groupId, { patients = [], shown = [], appointments = [], invoices = [] } = {}, now = new Date()) => {
  let list;
  if (groupId === "shown") list = shown;
  else if (groupId === "recall") list = dueRecalls(patients, appointments, invoices, now).map((d) => d.patient);
  else if (groupId === "balance") {
    const owing = new Set(invoices.filter((i) => balancePaise(normalizeInvoice(i)) > 0).map((i) => String(i.patientId)));
    list = patients.filter((p) => owing.has(String(p.id)));
  } else list = patients;
  const seen = new Set();
  const ok = [];
  let skipped = 0;
  for (const p of list) {
    if (!p || seen.has(String(p.id))) continue;
    seen.add(String(p.id));
    if (whatsappNumber(p.phone) && hasWhatsAppConsent(p)) ok.push(p); else skipped += 1;
  }
  return { recipients: ok, skipped };
};

export const messageLink = (patient, text, clinicName) => whatsappLink(patient.phone, fillMessage(text, { patient, clinicName }));
