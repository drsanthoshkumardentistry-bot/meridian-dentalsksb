/* ==============================================================================
 * MERIDENT OS - REFERRALS (pure functions, no React)
 * A referral sends a patient to another department, or to an outside specialist, for one treatment.
 * It moves Pending -> Seen -> Completed (or Declined), carries a reason and an urgency, and prints as a
 * referral slip the patient takes along. Old entries saved as "Approved" are shown as Pending.
 * ============================================================================== */

export const DEPARTMENTS = [
  { id: "omfs", code: "OMFS", name: "Oral & Maxillofacial Surgery", room: "Room 2" },
  { id: "perio", code: "PERIO", name: "Periodontics & Implantology", room: "Room 3" },
  { id: "cons", code: "CONS", name: "Conservative Dentistry & Endodontics", room: "Room 4" },
  { id: "ortho", code: "ORTHO", name: "Orthodontics & Dentofacial", room: "Room 5" },
  { id: "pedo", code: "PEDO", name: "Pediatric & Preventive Dentistry", room: "Room 6" },
  { id: "prostho", code: "PROSTHO", name: "Prosthodontics & Crown-Bridge", room: "Room 7" },
  { id: "omr", code: "OMR", name: "Oral Medicine & Radiology", room: "Room 1" },
  { id: "phd", code: "PHD", name: "Public Health Dentistry", room: "Room 8" },
];

import { alertText, regularMedicines } from "./medicalAlert.js";

export const URGENCY = ["Routine", "Urgent", "Emergency"];
export const STATUSES = ["Pending", "Seen", "Completed", "Declined"];
export const MAX_REFERRALS = 60;

const clip = (v, n) => String(v ?? "").trim().replace(/\s+/g, " ").slice(0, n);

export const statusOf = (r) => (STATUSES.includes(r?.status) ? r.status : "Pending");
export const urgencyOf = (r) => (URGENCY.includes(r?.urgency) ? r.urgency : "Routine");

/** Check one referral form. Returns { ok, referral } or { ok: false, error }. */
export const cleanReferral = (form, { id, today }) => {
  const treatment = clip(form.treatment, 80);
  if (!treatment) return { ok: false, error: "Type the treatment needed, for example Extraction" };
  const dept = DEPARTMENTS.find((d) => d.code === form.department);
  const outside = clip(form.outside, 80);
  if (!dept && !outside) return { ok: false, error: "Pick a department or type the specialist's name" };
  return {
    ok: true,
    referral: {
      id,
      treatment,
      toothRegion: clip(form.toothRegion, 30) || "U/L",
      department: dept ? dept.name : outside,
      roomNo: dept ? dept.room : "Outside",
      urgency: URGENCY.includes(form.urgency) ? form.urgency : "Routine",
      note: clip(form.note, 300),
      status: "Pending",
      date: today,
    },
  };
};

export const addReferral = (list = [], referral) =>
  list.length >= MAX_REFERRALS ? { error: `Up to ${MAX_REFERRALS} referrals per patient` } : { list: [...list, referral] };

export const setReferralStatus = (list = [], id, status, today) =>
  list.map((r) => (r.id === id && STATUSES.includes(status) ? { ...r, status, ...(status === "Completed" || status === "Declined" ? { closedDate: today } : { closedDate: undefined }) } : r));

export const removeReferral = (list = [], id) => list.filter((r) => r.id !== id);

/** Open referrals across all patients, emergencies first, then urgent, then oldest. */
export const openReferrals = (patients = []) => {
  const rank = { Emergency: 0, Urgent: 1, Routine: 2 };
  const out = [];
  for (const p of patients) {
    for (const r of (p && p.referrals) || []) {
      if (!r || typeof r !== "object") continue;
      const s = statusOf(r);
      if (s === "Pending" || s === "Seen") out.push({ patient: p, referral: r, status: s });
    }
  }
  return out.sort((a, b) => rank[urgencyOf(a.referral)] - rank[urgencyOf(b.referral)]);
};

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

/** A one-page referral slip. Plain white page that prints the same in any browser theme. */
export const referralSlipHtml = (r, patient = {}, profile = {}) => `<!doctype html><html><head><meta charset="utf-8"><meta name="color-scheme" content="light only"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Referral slip</title>
<style>html,body{background:#fff !important;color:#0f172a;color-scheme:light only;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:Arial,sans-serif;max-width:680px;margin:24px auto;padding:0 16px;line-height:1.5}
h1{font-size:20px;margin:0;color:#1d4ed8}.muted{color:#64748b;font-size:12px}.head{border-bottom:2px solid #1d4ed8;padding-bottom:10px}
table{width:100%;border-collapse:collapse;margin-top:14px}td{padding:7px 0;border-bottom:1px solid #e2e8f0;vertical-align:top}td:first-child{width:34%;color:#64748b}
.tag{display:inline-block;border:1px solid #1d4ed8;color:#1d4ed8;border-radius:99px;padding:1px 10px;font-size:12px}
.sign{margin-top:48px;text-align:right;font-size:12px}</style></head><body>
<div class="head"><h1>${esc(profile.name || "Dental Clinic")}</h1><div class="muted">${esc(profile.address || "")}</div>
<div class="muted">${esc(profile.phone || "")}${profile.regNumber ? " · Reg: " + esc(profile.regNumber) : ""}</div></div>
<h2 style="font-size:16px;margin:16px 0 0">Referral slip <span class="tag">${esc(urgencyOf(r))}</span></h2>
<table>
<tr><td>Patient</td><td><b>${esc(patient.name)}</b>${patient.age ? `, ${esc(patient.age)} years` : ""}${patient.gender ? `, ${esc(patient.gender)}` : ""}</td></tr>
<tr><td>Phone</td><td>${esc(patient.phone || "")}</td></tr>
<tr><td>Referred to</td><td><b>${esc(r.department)}</b>${r.roomNo && r.roomNo !== "Outside" ? ` (${esc(r.roomNo)})` : ""}</td></tr>
<tr><td>Treatment needed</td><td>${esc(r.treatment)}</td></tr>
<tr><td>Tooth / region</td><td>${esc(r.toothRegion)}</td></tr>
${r.note ? `<tr><td>Reason and notes</td><td style="white-space:pre-line">${esc(r.note)}</td></tr>` : ""}
${patient.allergies ? `<tr><td>Allergies</td><td>${esc(patient.allergies)}</td></tr>` : ""}
${alertText({ ...patient, allergies: "" }) ? `<tr><td>Medical conditions</td><td>${esc(alertText({ ...patient, allergies: "" }))}</td></tr>` : ""}
${regularMedicines(patient) ? `<tr><td>Regular medicines</td><td>${esc(regularMedicines(patient))}</td></tr>` : ""}
<tr><td>Date</td><td>${esc(r.date)}</td></tr>
</table>
<div class="sign">Referring dentist's signature</div>
<script>window.onload=function(){window.print()}</script></body></html>`;
