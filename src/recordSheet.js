// A readable, printable summary of one patient's record (opens as a page that can be printed or saved as PDF).
import { formatINR, normalizeInvoice, balancePaise } from "./billing.js";
import { claimsOf, claimOutstandingP } from "./claims.js";
import { normalizeConditions, primaryCode, colorOf, findingLabel, isCustomCode } from "./odontogram.js";

const localDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; // the clinic's own calendar day, not UTC
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
const dmy = (k) => (/^\d{4}-\d{2}-\d{2}$/.test(String(k || "")) ? String(k).split("-").reverse().join("/") : esc(k || ""));
const row = (a, b) => (b ? `<tr><th>${esc(a)}</th><td>${esc(b)}</td></tr>` : "");

const ARCHES = [
  { label: "Permanent", rows: [[18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28], [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]] },
  { label: "Primary", rows: [[55, 54, 53, 52, 51, 61, 62, 63, 64, 65], [85, 84, 83, 82, 81, 71, 72, 73, 74, 75]] }
];
const HEX = /^#[0-9a-f]{6}$/i;
const hex = (v, fallback) => (HEX.test(String(v)) ? v : fallback);

/** Static, print-friendly tooth chart (plain HTML, no SVG). Only fixed tooth numbers and known hex colours reach the markup. */
export const odontogramSvg = (conditions, palette = []) => {
  const map = normalizeConditions(conditions);
  const used = new Set();
  const blocks = ARCHES.map(({ label, rows }) => {
    if (label === "Primary" && !rows.flat().some((t) => map[t])) return "";
    const half = rows[0].length / 2;
    const line = (nums) => `<div class="arch">${nums.map((t, i) => {
      const code = primaryCode(map[t]);
      const c = colorOf(code || "HLT");
      if (code) used.add(code);
      const more = (map[t] || []).length > 1 ? "+" : "";
      return `<span class="tooth${i === half ? " gap" : ""}" style="background:${hex(c.fill, "#ffffff")};border:1.6px ${code === "MIS" ? "dashed" : "solid"} ${hex(c.stroke, "#94a3b8")}">${t}${more}</span>`;
    }).join("")}</div>`;
    return `<div class="muted" style="margin:6px 0 2px">${label} teeth (upper above, lower below)</div>${rows.map(line).join("")}`;
  }).join("");
  const legend = [...used].filter((c) => c !== "HLT").map((c) => {
    const col = colorOf(c);
    const name = findingLabel(c, palette);
    return `<span class="lg"><i style="background:${hex(col.fill, "#ffffff")};border-color:${hex(col.stroke, "#94a3b8")}"></i>${esc(isCustomCode(c) ? name : name)}</span>`;
  }).join("");
  return `${blocks}${legend ? `<div class="legend">${legend}</div>` : ""}`;
};

export const recordSheetHtml = (patient, { appointments = [], invoices = [], palette = [] } = {}, profile, now = new Date()) => {
  patient = patient && typeof patient === "object" ? patient : {};
  profile = profile && typeof profile === "object" ? profile : {};
  appointments = (Array.isArray(appointments) ? appointments : []).filter(Boolean);
  invoices = (Array.isArray(invoices) ? invoices : []).filter(Boolean);
  const mine = (name, id) => (id ? id === patient.id : String(name || "").trim().toLowerCase() === String(patient.name || "").trim().toLowerCase());
  const appts = appointments.filter((a) => mine(a.patientName, a.patientId)).sort((x, y) => `${y.date} ${y.time}`.localeCompare(`${x.date} ${x.time}`));
  const invs = invoices.map(normalizeInvoice).filter((i) => mine(i.patient, i.patientId));
  const due = invs.reduce((s, i) => s + balancePaise(i), 0);
  const teeth = Object.entries(patient.toothConditions || {}).map(([t, c]) => `${t}: ${Array.isArray(c) ? c.map((x) => String(x).replace(/^X:/, "")).join(", ") : typeof c === "object" ? Object.values(c || {}).join(", ") : c}`);
  const visits = patient.visits || [];
  const plans = patient.plans || [];
  const section = (title, body) => (body ? `<h2>${esc(title)}</h2>${body}` : "");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="color-scheme" content="light only"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Patient record - ${esc(patient.name)}</title>
<style>body{font-family:Arial,Helvetica,sans-serif;color:#111827;margin:24px;font-size:13px;line-height:1.5}h1{font-size:20px;margin:0}h2{font-size:14px;border-bottom:2px solid #b45309;padding-bottom:3px;margin:22px 0 8px}table{border-collapse:collapse;width:100%}th{text-align:left;width:32%;color:#4b5563;font-weight:600;vertical-align:top;padding:3px 8px 3px 0}td{padding:3px 0}.list td,.list th{border-bottom:1px solid #e5e7eb;padding:5px 6px;width:auto}.muted{color:#6b7280;font-size:11px}.legend{display:flex;flex-wrap:wrap;gap:4px 14px;margin:6px 0;font-size:11px}.arch{display:flex;gap:3px;margin:3px 0}.tooth{box-sizing:border-box;width:30px;height:24px;border-radius:6px;font-size:10px;line-height:21px;text-align:center}.tooth.gap{margin-left:10px}.lg i{display:inline-block;width:11px;height:11px;border:1.5px solid;border-radius:3px;margin-right:4px;vertical-align:-2px}.tooth,.lg i{-webkit-print-color-adjust:exact;print-color-adjust:exact}@media print{body{margin:12mm}}</style></head><body>
<h1>${esc(patient.name || "Patient")}</h1>
<div class="muted">${esc(profile.name || "")}${profile.address ? ` · ${esc(profile.address)}` : ""} · Printed ${dmy(localDay(now))}</div>
${section("Details", `<table>${row("Age / gender", [patient.age && `${patient.age} years`, patient.gender].filter(Boolean).join(" · "))}${row("Mobile", patient.phone)}${row("Email", patient.email)}${row("Address", [patient.area, patient.city, patient.pincode].filter(Boolean).join(", "))}${row("Blood group", patient.bloodGroup && patient.bloodGroup !== "Unknown" ? patient.bloodGroup : "")}${row("Chief complaint", patient.chiefComplaint)}</table>`)}
${section("Medical alerts", `<table>${row("Conditions", patient.conditions)}${row("Allergies", patient.allergies)}${row("Alert", patient.medicalAlert)}</table>`.replace("<table></table>", ""))}
${section("Odontogram (tooth chart)", teeth.length ? `${odontogramSvg(patient.toothConditions, Array.isArray(palette) ? palette : [])}<p class="muted">${teeth.map(esc).join("<br>")}</p>` : "")}
${section("Treatment plans", plans.length ? `<table class="list">${plans.map((p) => `<tr><td>${esc(p.tooth || p.title || p.procedure || "Plan")}${p.procedure && p.tooth ? ` · ${esc(p.procedure)}` : ""}</td><td>${esc(p.status || "")}</td></tr>`).join("")}</table>` : "")}
${section("Visit notes", visits.length ? `<table class="list">${visits.map((v) => `<tr><td style="width:90px">${dmy(v.date)}</td><td>${[v.complaint && `Complaint: ${v.complaint}`, v.findings && `Findings: ${v.findings}`, v.treatment && `Treatment: ${v.treatment}`, v.advice && `Advice: ${v.advice}`].filter(Boolean).map(esc).join("<br>")}</td></tr>`).join("")}</table>` : "")}
${section("Appointments", appts.length ? `<table class="list">${appts.map((a) => `<tr><td style="width:90px">${dmy(a.date)} ${esc(a.time || "")}</td><td>${esc(a.procedure || a.visitType || "")}</td><td>${esc(a.status || "")}</td></tr>`).join("")}</table>` : "")}
${section("Insurance and TPA claims", claimsOf(patient).length ? `<table class="list">${claimsOf(patient).map((c) => `<tr><td>${esc(c.insurer)}</td><td>${esc(c.status)}</td><td>₹${formatINR(c.claimedP)} claimed</td><td>${claimOutstandingP(c) > 0 ? `₹${formatINR(claimOutstandingP(c))} owed` : ""}</td></tr>`).join("")}</table>` : "")}
${section("Billing", invs.length ? `<table class="list">${invs.map((i) => `<tr><td>${esc(i.id)}</td><td>${dmy(i.date)}</td><td>₹${formatINR(balancePaise(i))} due</td></tr>`).join("")}</table><p><strong>Total due: ₹${formatINR(due)}</strong></p>` : "")}
<p class="muted" style="margin-top:24px">Confidential patient record. Keep it safe.</p>
</body></html>`;
};
