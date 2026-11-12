// A readable, printable summary of one patient's record (opens as a page that can be printed or saved as PDF).
import { formatINR, normalizeInvoice, balancePaise } from "./billing.js";

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
const dmy = (k) => (/^\d{4}-\d{2}-\d{2}$/.test(String(k || "")) ? String(k).split("-").reverse().join("/") : esc(k || ""));
const row = (a, b) => (b ? `<tr><th>${esc(a)}</th><td>${esc(b)}</td></tr>` : "");

export const recordSheetHtml = (patient = {}, { appointments = [], invoices = [] } = {}, profile = {}, now = new Date()) => {
  const mine = (name, id) => (id ? id === patient.id : String(name || "").trim().toLowerCase() === String(patient.name || "").trim().toLowerCase());
  const appts = appointments.filter((a) => mine(a.patientName, a.patientId)).sort((x, y) => `${y.date} ${y.time}`.localeCompare(`${x.date} ${x.time}`));
  const invs = invoices.map(normalizeInvoice).filter((i) => mine(i.patient, i.patientId));
  const due = invs.reduce((s, i) => s + balancePaise(i), 0);
  const teeth = Object.entries(patient.toothConditions || {}).map(([t, c]) => `${t}: ${Array.isArray(c) ? c.join(", ") : typeof c === "object" ? Object.values(c || {}).join(", ") : c}`);
  const visits = patient.visits || [];
  const plans = patient.plans || [];
  const section = (title, body) => (body ? `<h2>${esc(title)}</h2>${body}` : "");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="color-scheme" content="light only"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Patient record - ${esc(patient.name)}</title>
<style>body{font-family:Arial,Helvetica,sans-serif;color:#111827;margin:24px;font-size:13px;line-height:1.5}h1{font-size:20px;margin:0}h2{font-size:14px;border-bottom:2px solid #b45309;padding-bottom:3px;margin:22px 0 8px}table{border-collapse:collapse;width:100%}th{text-align:left;width:32%;color:#4b5563;font-weight:600;vertical-align:top;padding:3px 8px 3px 0}td{padding:3px 0}.list td,.list th{border-bottom:1px solid #e5e7eb;padding:5px 6px;width:auto}.muted{color:#6b7280;font-size:11px}@media print{body{margin:12mm}}</style></head><body>
<h1>${esc(patient.name || "Patient")}</h1>
<div class="muted">${esc(profile.name || "")}${profile.address ? ` · ${esc(profile.address)}` : ""} · Printed ${dmy(now.toISOString().slice(0, 10))}</div>
${section("Details", `<table>${row("Age / gender", [patient.age && `${patient.age} years`, patient.gender].filter(Boolean).join(" · "))}${row("Mobile", patient.phone)}${row("Email", patient.email)}${row("Address", [patient.area, patient.city, patient.pincode].filter(Boolean).join(", "))}${row("Blood group", patient.bloodGroup && patient.bloodGroup !== "Unknown" ? patient.bloodGroup : "")}${row("Chief complaint", patient.chiefComplaint)}</table>`)}
${section("Medical alerts", `<table>${row("Conditions", patient.conditions)}${row("Allergies", patient.allergies)}${row("Alert", patient.medicalAlert)}</table>`.replace("<table></table>", ""))}
${section("Charted teeth", teeth.length ? `<p>${teeth.map(esc).join("<br>")}</p>` : "")}
${section("Treatment plans", plans.length ? `<table class="list">${plans.map((p) => `<tr><td>${esc(p.tooth || p.title || p.procedure || "Plan")}${p.procedure && p.tooth ? ` · ${esc(p.procedure)}` : ""}</td><td>${esc(p.status || "")}</td></tr>`).join("")}</table>` : "")}
${section("Visit notes", visits.length ? `<table class="list">${visits.map((v) => `<tr><td style="width:90px">${dmy(v.date)}</td><td>${[v.complaint && `Complaint: ${v.complaint}`, v.findings && `Findings: ${v.findings}`, v.treatment && `Treatment: ${v.treatment}`, v.advice && `Advice: ${v.advice}`].filter(Boolean).map(esc).join("<br>")}</td></tr>`).join("")}</table>` : "")}
${section("Appointments", appts.length ? `<table class="list">${appts.map((a) => `<tr><td style="width:90px">${dmy(a.date)} ${esc(a.time || "")}</td><td>${esc(a.procedure || a.visitType || "")}</td><td>${esc(a.status || "")}</td></tr>`).join("")}</table>` : "")}
${section("Billing", invs.length ? `<table class="list">${invs.map((i) => `<tr><td>${esc(i.id)}</td><td>${dmy(i.date)}</td><td>₹${formatINR(balancePaise(i))} due</td></tr>`).join("")}</table><p><strong>Total due: ₹${formatINR(due)}</strong></p>` : "")}
<p class="muted" style="margin-top:24px">Confidential patient record. Keep it safe.</p>
</body></html>`;
};
