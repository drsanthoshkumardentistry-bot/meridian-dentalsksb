// Printable certificates a clinic gives patients. Plain text in, safe HTML out.
export const CERT_TYPES = [
  { id: "rest", label: "Medical certificate (rest advised)" },
  { id: "treatment", label: "Dental treatment certificate" },
  { id: "fitness", label: "Dental fitness certificate" },
];

const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const dmy = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ""); return m ? `${m[3]}/${m[2]}/${m[1]}` : ""; };

/** Checks the form. days is only needed for a rest certificate. */
export const validateCertificate = ({ type, issuedOn, days, from, treatment } = {}) => {
  if (!CERT_TYPES.some((t) => t.id === type)) return "Choose the kind of certificate.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(issuedOn || "")) return "Choose the date of issue.";
  if (type === "rest") {
    const d = Math.round(Number(days));
    if (!Number.isFinite(d) || d < 1 || d > 90) return "Enter the days of rest, from 1 to 90.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from || "")) return "Choose the first day of rest.";
  }
  if (type !== "fitness" && !String(treatment || "").trim()) return "Write the treatment or procedure done.";
  return "";
};

export const buildCertificateHtml = ({ type, patient = {}, profile = {}, issuedOn, days, from, treatment = "", remarks = "" } = {}) => {
  const name = esc(patient.name);
  const who = `${name}${patient.age ? `, ${esc(patient.age)} years` : ""}${patient.gender ? `, ${esc(patient.gender)}` : ""}`;
  const t = esc(String(treatment).trim());
  let body = "";
  if (type === "rest") {
    const d = Math.round(Number(days));
    body = `<p>This is to certify that <strong>${who}</strong> was examined and treated at this clinic on <strong>${dmy(issuedOn)}</strong> for <strong>${t}</strong>.</p>
      <p>Rest for <strong>${d} day${d === 1 ? "" : "s"}</strong> is advised from <strong>${dmy(from)}</strong>.</p>`;
  } else if (type === "treatment") {
    body = `<p>This is to certify that <strong>${who}</strong> was treated at this clinic on <strong>${dmy(issuedOn)}</strong>. Treatment done: <strong>${t}</strong>.</p>`;
  } else {
    body = `<p>This is to certify that <strong>${who}</strong> was examined on <strong>${dmy(issuedOn)}</strong> and found dentally fit.${t ? ` ${t}` : ""}</p>`;
  }
  const title = (CERT_TYPES.find((c) => c.id === type) || CERT_TYPES[0]).label;
  const doctor = esc(profile.drName || "");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="color-scheme" content="light only"><title>${esc(title)}</title>
<style>body{font-family:Georgia,serif;max-width:720px;margin:40px auto;padding:0 24px;color:#111}h1{font-size:20px;text-align:center;margin:0}.sub{text-align:center;color:#444;font-size:13px;margin:4px 0 28px}h2{text-align:center;font-size:18px;text-decoration:underline;margin:24px 0}p{line-height:1.8;font-size:15px}.sig{margin-top:80px;text-align:right;font-size:14px}.meta{display:flex;justify-content:space-between;font-size:13px;margin-bottom:12px}@media print{button{display:none}}</style></head><body>
<h1>${esc(profile.name || "Dental clinic")}</h1>
<div class="sub">${esc(profile.address || "")}${profile.phone ? ` · ${esc(profile.phone)}` : ""}</div>
<div class="meta"><span>Date: ${dmy(issuedOn)}</span><span>Patient ID: ${esc(patient.id || "")}</span></div>
<h2>${esc(title)}</h2>${body}${remarks ? `<p>${esc(remarks)}</p>` : ""}
<div class="sig"><div>${doctor ? `Dr. ${doctor.replace(/^Dr\.?\s*/i, "")}` : ""}</div>${profile.qualification ? `<div>${esc(profile.qualification)}</div>` : ""}${profile.councilRegNumber ? `<div>Reg. No: ${esc(profile.councilRegNumber)}</div>` : ""}<div style="margin-top:6px">Signature and seal</div></div>
<p style="text-align:center;margin-top:40px"><button onclick="window.print()">Print</button></p></body></html>`;
};
