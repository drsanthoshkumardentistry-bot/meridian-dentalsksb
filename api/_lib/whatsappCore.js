// WhatsApp Business Platform (Meta Cloud API) helpers. Only fixed, pre-approved templates can be sent,
// so a signed-in user cannot use MeriDent's number to send free-form text.

/** The three templates to create in Meta's WhatsApp Manager, with the same names. Variables are {{1}}, {{2}}... */
export const TEMPLATES = {
  appointment: {
    name: "merident_appt_reminder", category: "UTILITY", vars: 5,
    body: "Hello {{1}}, this is a reminder from {{2}} about your appointment {{3}} with {{4}}. Please arrive 10 minutes early. To reschedule, call the clinic on {{5}}.",
  },
  payment: {
    name: "merident_payment_due", category: "UTILITY", vars: 5,
    body: "Hello {{1}}, a reminder from {{2}}: Rs. {{3}} is pending on invoice {{4}}. Pay by UPI: {{5}}. If you have already paid, please ignore this message.",
  },
  recall: {
    name: "merident_recall", category: "MARKETING", vars: 4,
    body: "Hello {{1}}, it has been {{2}} months since your last visit to {{3}}. A routine check-up helps catch problems early. To book a time, call the clinic on {{4}}.",
  },
};

/** 10-digit Indian mobile (with or without 91 / +91) to 91XXXXXXXXXX, or "" when invalid. */
export const toWaNumber = (v) => {
  const d = String(v || "").replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "").replace(/^0(?=\d{10}$)/, "");
  return /^[6-9]\d{9}$/.test(d) ? `91${d}` : "";
};

/** WhatsApp rejects newlines, tabs and long runs of spaces inside a template variable. */
export const cleanVar = (v) => String(v ?? "").replace(/[\r\n\t]+/g, " ").replace(/ {2,}/g, " ").trim().slice(0, 120);

/** Checks a send request. Returns { error } or { payload } ready for the Graph API. */
export const buildSend = ({ kind, to, params, lang = "en" } = {}) => {
  const t = TEMPLATES[kind];
  if (!t) return { error: "Unknown message type." };
  const number = toWaNumber(to);
  if (!number) return { error: "Invalid mobile number." };
  if (!Array.isArray(params) || params.length !== t.vars) return { error: "Wrong number of details for this message." };
  const vars = params.map(cleanVar);
  if (vars.some((v) => !v)) return { error: "A detail for this message is empty." };
  return {
    payload: {
      messaging_product: "whatsapp",
      to: number,
      type: "template",
      template: { name: t.name, language: { code: lang }, components: [{ type: "body", parameters: vars.map((text) => ({ type: "text", text })) }] },
    },
  };
};
