/* ==============================================================================
 * MERIDENT OS - TREATMENT CONSENT FORMS (pure functions, no React)
 * A consent is stored on the patient (patient.consents) with the exact wording that was signed, the
 * signature picture, who signed and when. A signed consent is never edited, only viewed and printed.
 * The wording below is a general starting point: the clinic edits it and should have it reviewed.
 * ============================================================================== */

import { parseTeeth } from "./plans.js";
import { toothInfo } from "./odontogram.js";

export const MAX_CONSENTS = 20; // keeps the patient record well under the 1 MB document limit
export const MAX_SIGNATURE_CHARS = 60000;
export const PNG_PREFIX = "data:image/png;base64,";
export const RELATIONS = ["Father", "Mother", "Legal guardian", "Spouse", "Son or daughter", "Other family member"];

const common = (extra = "") =>
  `${extra}I have been told about the treatment, why it is advised, how it is done, the other options (including no treatment), and what may happen if it is not done. I have had the chance to ask questions and my questions were answered in a language I understand.\n\n` +
  `I understand that no dentist can promise a result, and that the treatment may need extra visits or extra cost. I agree to follow the advice given and to come for follow-up visits.\n\n` +
  `I have given true and complete information about my health, medicines and allergies, and I will tell the clinic about any change.`;

export const TEMPLATES = [
  {
    id: "general", title: "General treatment consent",
    text: (c) => `I, {patient}, agree to the dental examination and treatment advised by {doctor} at {clinic}{teeth}.\n\n${common()}`,
  },
  {
    id: "extraction", title: "Tooth extraction",
    text: () => common(`I agree to have {tooth} removed by {doctor} at {clinic}.\n\nI understand the usual effects and risks: pain, swelling, bleeding and bruising for a few days; dry socket; infection; numbness or tingling of the lip, tongue or chin (usually temporary); a root piece that stays behind; damage to a nearby tooth or filling; and, for upper teeth, an opening into the sinus. A tooth that has been removed cannot be put back.\n\n`),
  },
  {
    id: "rct", title: "Root canal treatment",
    text: () => common(`I agree to root canal treatment of {tooth} by {doctor} at {clinic}.\n\nI understand that the nerve and infected tissue are removed and the canals are cleaned and filled over one or more visits; that the tooth usually needs a crown afterwards; and that risks include pain or swelling between visits, a broken instrument in the canal, a canal that cannot be fully cleaned, a crack in the tooth, and infection that returns and needs retreatment, surgery or extraction.\n\n`),
  },
  {
    id: "implant", title: "Dental implant",
    text: () => common(`I agree to a dental implant at {tooth} by {doctor} at {clinic}.\n\nI understand that a small titanium post is placed in the jawbone and a crown is fitted after healing; that it can fail to fix to the bone or be lost later, especially with smoking, diabetes or poor cleaning; and that risks include pain, swelling, bleeding, infection, numbness of the lip or chin, sinus problems for upper teeth, and the need for a bone graft or a repeat procedure. I will keep my regular check-ups and clean the implant as shown.\n\n`),
  },
  {
    id: "anaesthesia", title: "Local anaesthesia",
    text: () => common(`I agree to local anaesthetic injections for my dental treatment by {doctor} at {clinic}.\n\nI understand that the injection numbs the area for a few hours and I should not bite my lip or cheek while it is numb; that I may have soreness, bruising, a rare allergic reaction, a faint feeling or a racing heart, and rarely longer-lasting numbness; and that I have told the clinic about my allergies, medicines and any heart, blood pressure, diabetes or pregnancy conditions.\n\n`),
  },
  {
    id: "crown", title: "Crown or bridge",
    text: () => common(`I agree to have {tooth} prepared for a crown or bridge by {doctor} at {clinic}.\n\nI understand that the tooth is reduced in size and cannot return to its original shape; that a temporary crown is worn until the final one is fitted; that the tooth may become sensitive or need root canal treatment later; and that the colour, shape and fit are matched as closely as possible but may not be identical to my natural teeth.\n\n`),
  },
  {
    id: "ortho", title: "Orthodontic treatment (braces or aligners)",
    text: () => common(`I agree to orthodontic treatment by {doctor} at {clinic}.\n\nI understand that treatment usually takes many months and needs regular visits; that good cleaning is essential and poor cleaning can cause stains, decay and gum problems; that teeth can feel sore after adjustments; that rarely roots become shorter; and that I must wear retainers as advised because teeth can move back. Broken or missed appointments can make treatment longer.\n\n`),
  },
  {
    id: "whitening", title: "Teeth whitening",
    text: () => common(`I agree to teeth whitening by {doctor} at {clinic}.\n\nI understand that results differ from person to person and fillings, crowns and some stains do not change colour; that teeth and gums may be sensitive for a few days; and that the shade can fade over time with tea, coffee, tobacco and food colours.\n\n`),
  },
  {
    id: "records", title: "Photographs, X-rays and records",
    text: () => `I, {patient}, agree that {clinic} may take X-rays, photographs and impressions of my mouth and teeth and keep them in my treatment record.\n\nI understand that these are used for my diagnosis, treatment planning and follow-up, and are kept private. They will not be shared outside the clinic or used for teaching, advertising or publication without asking me separately.\n\nI understand that X-rays use a small dose of radiation and the clinic will tell the dentist if I am or may be pregnant.`,
  },
];

export const templateById = (id) => TEMPLATES.find((t) => t.id === id);

/** The wording for a patient, with names and teeth filled in. The clinic can still edit it before signing. */
export const fillTemplate = (id, { patient = "", teeth = "", doctor = "", clinic = "" } = {}) => {
  const t = templateById(id);
  if (!t) return "";
  const list = parseTeeth(teeth).filter((n) => toothInfo(n));
  const tooth = list.length ? `${list.length > 1 ? "teeth" : "tooth"} ${list.join(", ")}` : "the tooth discussed with me";
  const teethClause = list.length ? ` (${list.length > 1 ? "teeth" : "tooth"} ${list.join(", ")})` : "";
  return t
    .text()
    .replace(/\{patient\}/g, patient || "the patient")
    .replace(/\{doctor\}/g, doctor || "the dentist")
    .replace(/\{clinic\}/g, clinic || "the clinic")
    .replace(/\{tooth\}/g, tooth)
    .replace(/\{teeth\}/g, teethClause);
};

export const isSignatureData = (s) => typeof s === "string" && s.startsWith(PNG_PREFIX) && s.length > PNG_PREFIX.length + 100 && s.length <= MAX_SIGNATURE_CHARS;

/** Returns an error message, or "" when the draft can be signed and saved. */
export const validateConsent = (d = {}, existingCount = 0) => {
  if (existingCount >= MAX_CONSENTS) return `A patient can have at most ${MAX_CONSENTS} consents on file`;
  if (!String(d.title || "").trim()) return "Choose or name the consent";
  const text = String(d.text || "").trim();
  if (text.length < 40) return "The consent wording is too short";
  if (text.length > 4000) return "Keep the consent wording under 4,000 characters";
  if (String(d.teeth || "").trim() && parseTeeth(d.teeth).some((n) => !toothInfo(n))) return "Tooth numbers must be valid FDI numbers such as 16 or 46, separated by commas";
  const name = String(d.signerName || "").trim();
  if (!name) return d.signerRole === "guardian" ? "Enter the guardian's name" : "Enter the patient's name";
  if (d.signerRole === "guardian" && !RELATIONS.includes(d.relation)) return "Choose the guardian's relationship to the patient";
  if (!isSignatureData(d.signature)) return "Ask them to sign in the box";
  if (d.understood !== true) return "Confirm that the consent was explained and agreed to";
  return "";
};

export const createConsent = (d, id, { doctor = "", clinic = "" } = {}, now = new Date()) => ({
  id,
  templateId: templateById(d.templateId) ? d.templateId : "custom",
  title: String(d.title).trim().slice(0, 80),
  text: String(d.text).trim(),
  teeth: parseTeeth(d.teeth).filter((n) => toothInfo(n)).join(", "),
  signerRole: d.signerRole === "guardian" ? "guardian" : "patient",
  signerName: String(d.signerName).trim().slice(0, 80),
  relation: d.signerRole === "guardian" ? d.relation : "",
  witness: String(d.witness || "").trim().slice(0, 80),
  signature: d.signature,
  doctor: String(doctor).slice(0, 80),
  clinic: String(clinic).slice(0, 80),
  signedAt: now.toISOString(),
});

export const signerLine = (c) => (c.signerRole === "guardian" ? `${c.signerName} (${c.relation}, guardian)` : c.signerName);

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

export const consentHtml = (c, patient = {}, profile = {}) => `<!doctype html><html><head><meta charset="utf-8"><meta name="color-scheme" content="light only"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(c.title)}</title>
<style>html,body{background:#fff !important;color:#0f172a;color-scheme:light only;-webkit-print-color-adjust:exact;print-color-adjust:exact}body{font-family:Arial,sans-serif;color:#0f172a;max-width:720px;margin:24px auto;padding:0 16px;line-height:1.5}
h1{color:#1d4ed8;font-size:20px;margin:0}h2{font-size:17px;margin:16px 0 4px}.muted{color:#64748b;font-size:12px}
.text{white-space:pre-wrap;font-size:14px;margin:12px 0}.sig{margin-top:24px;display:flex;gap:32px;flex-wrap:wrap}
.sig img{height:70px;border-bottom:1px solid #0f172a}.box{font-size:13px}</style></head><body>
<h1>${esc(c.clinic || profile.name || "Dental Clinic")}</h1><div class="muted">${esc(profile.address || "")} ${esc(profile.phone || "")}</div>
<h2>${esc(c.title)}</h2>
<div>Patient: <b>${esc(patient.name || "")}</b>${c.teeth ? ` · Teeth: ${esc(c.teeth)}` : ""}</div>
<div class="text">${esc(c.text)}</div>
<div class="sig"><div class="box"><img src="${esc(c.signature)}" alt="Signature"><br>Signed by ${esc(signerLine(c))}</div>
<div class="box">Date and time: ${esc(new Date(c.signedAt).toLocaleString("en-IN"))}<br>Dentist: ${esc(c.doctor || "-")}${c.witness ? `<br>Witness: ${esc(c.witness)}` : ""}</div></div>
<script>window.onload=function(){window.print()}</script></body></html>`;
