// Insurance and TPA claim tracking. MeriDent records and follows each claim; it does not send claims to insurers.
// Amounts are kept in paise like invoices. A claim belongs to one patient and lives on the patient record.
import { dateKey } from "./reminders.js";

export const CLAIM_KINDS = ["Insurance", "TPA", "Government scheme", "Corporate"];
export const CLAIM_STATUSES = ["Pre-auth requested", "Pre-auth approved", "Claim submitted", "Query raised", "Approved", "Settled", "Rejected"];
const CLOSED = new Set(["Settled", "Rejected"]);

const clean = (v, n) => String(v ?? "").trim().slice(0, n);
const paise = (rupees) => {
  const text = String(rupees ?? "").replace(/[,\s]/g, "");
  if (text === "") return 0;
  const n = Number(text);
  return Number.isFinite(n) && n >= 0 && n < 1e8 ? Math.round(n * 100) : NaN;
};
const isDay = (d) => /^\d{4}-\d{2}-\d{2}$/.test(String(d || ""));

/** Validate and shape a claim. Returns { ok, claim } or { ok: false, error }. */
export const buildClaim = (form = {}, id, now = new Date()) => {
  const insurer = clean(form.insurer, 80);
  if (!insurer) return { ok: false, error: "Enter the insurer or TPA name" };
  const kind = CLAIM_KINDS.includes(form.kind) ? form.kind : "Insurance";
  const status = CLAIM_STATUSES.includes(form.status) ? form.status : "Pre-auth requested";
  const claimedP = paise(form.claimed), approvedP = paise(form.approved), settledP = paise(form.settled);
  if (!(claimedP > 0)) return { ok: false, error: "Enter the amount claimed" };
  if ([approvedP, settledP].some(Number.isNaN)) return { ok: false, error: "Amounts must be numbers of rupees" };
  if (approvedP > claimedP) return { ok: false, error: "The approved amount cannot be more than the amount claimed" };
  if (settledP > (approvedP || claimedP)) return { ok: false, error: "The settled amount cannot be more than the approved amount" };
  if (status === "Settled" && !settledP) return { ok: false, error: "Enter the amount settled" };
  if ((status === "Approved" || status === "Pre-auth approved") && !approvedP) return { ok: false, error: "Enter the amount approved" };
  const date = form.date || dateKey(now);
  if (!isDay(date)) return { ok: false, error: "Choose the date" };
  if (date > dateKey(now)) return { ok: false, error: "The date cannot be in the future" };
  return {
    ok: true,
    claim: {
      id, kind, insurer, status, date,
      policyNo: clean(form.policyNo, 60), memberId: clean(form.memberId, 60), claimNo: clean(form.claimNo, 60),
      treatment: clean(form.treatment, 200), notes: clean(form.notes, 500),
      claimedP, approvedP, settledP,
      updatedAt: now.toISOString(),
    },
  };
};

/** What the insurer or TPA still owes the clinic for this claim. */
export const claimOutstandingP = (c) => {
  if (!c || CLOSED.has(c.status)) return 0;
  return Math.max(0, (c.approvedP || c.claimedP || 0) - (c.settledP || 0));
};

export const claimsOf = (patient) => (Array.isArray(patient?.claims) ? patient.claims.filter(Boolean) : []);
export const addClaim = (patient, claim) => ({ ...patient, claims: [claim, ...claimsOf(patient)] });
export const updateClaim = (patient, claim) => ({ ...patient, claims: claimsOf(patient).map((c) => (c.id === claim.id ? claim : c)) });
export const removeClaim = (patient, claimId) => ({ ...patient, claims: claimsOf(patient).filter((c) => c.id !== claimId) });

/** Totals across all patients for the overview. */
export const claimsSummary = (patients = []) => {
  const out = { open: 0, outstandingP: 0, settledP: 0, rejected: 0, rows: [] };
  for (const p of patients) {
    for (const c of claimsOf(p)) {
      out.rows.push({ ...c, patientId: p.id, patientName: p.name });
      if (c.status === "Rejected") out.rejected += 1;
      else if (c.status !== "Settled") out.open += 1;
      out.outstandingP += claimOutstandingP(c);
      out.settledP += c.status === "Rejected" ? 0 : c.settledP || 0;
    }
  }
  out.rows.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return out;
};
