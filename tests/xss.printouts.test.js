import { describe, it, expect } from "vitest";
import { buildInvoiceHtml, normalizeInvoice } from "../src/billing.js";
import { buildPlanHtml, createPlan } from "../src/plans.js";
import { buildCertificateHtml } from "../src/certificate.js";
import { consentHtml } from "../src/consent.js";
import { referralSlipHtml } from "../src/referrals.js";
import { buildReportHtml } from "../src/reports.js";
import { recordSheetHtml } from "../src/recordSheet.js";

// Every text field a person can type gets a hostile value. Nothing may come out as live HTML or a live attribute.
const PAY = `"><img src=x onerror=alert(1)><script>alert(2)</script>'\`;}</style><svg onload=alert(3)>`;
const KEYS = ["name", "patient", "patientName", "phone", "age", "gender", "address", "area", "city", "pincode", "email", "allergies", "medicalAlert", "currentMedicines", "bloodGroup", "chiefComplaint", "conditions", "doctor", "drName", "qualification", "qual", "councilRegNumber", "regNo", "gstin", "upiId", "reviewLink", "footer", "treatment", "procedure", "note", "notes", "title", "tooth", "teeth", "department", "urgency", "status", "reason", "complaint", "findings", "advice", "remarks", "signerName", "text", "clinic", "mode", "description", "kind", "id", "date", "time", "chair", "logo", "website"];
const bag = (extra = {}) => ({ ...Object.fromEntries(KEYS.map((k) => [k, PAY])), ...extra });
const LIVE = [/<img[^>]*(onerror|src=x)/i, /<img[^>]*src="(?!data:image\/(png|jpeg);base64,)[^"]*(javascript|onerror)/i, /<script>alert/i, /<svg[\s/]/i, /"\s*onerror\s*=/i, /"\s*onload\s*=/i, /<\/style><svg/i];
const expectSafe = (html, label) => {
  expect(typeof html, label).toBe("string");
  for (const re of LIVE) expect(html, `${label}: ${re}`).not.toMatch(re);
};
const visit = bag({ date: "2026-11-01", plans: undefined });
const patient = bag({ id: "P1", age: "30", visits: [visit, visit], plans: [], toothConditions: { 11: [{ id: "a", condition: PAY, note: PAY }], 12: PAY }, referrals: [bag()], consents: [bag()] });
const profile = bag();

describe("printable pages never turn typed text into live HTML", () => {
  it("invoice and receipt", () => {
    const inv = normalizeInvoice({ id: "INV/2026-27/0001", patient: PAY, date: "12/11/2026", treatment: PAY, notes: PAY, items: [{ name: PAY, qty: 1, price: 100 }, { name: PAY, qty: 2, price: 50 }], payments: [{ date: "12/11/2026", mode: PAY, amountP: 100, note: PAY }] });
    expectSafe(buildInvoiceHtml(inv, profile), "invoice");
    expectSafe(buildInvoiceHtml(inv, profile, { receipt: true }), "receipt");
  });
  it("treatment plan", () => {
    const r = createPlan({ title: PAY, items: [{ tooth: "11", procedure: PAY, feeP: 100000, fee: "1000", note: PAY }], note: PAY, notes: PAY }, new Date(2026, 10, 12));
    const plan = r.plan || r;
    expectSafe(buildPlanHtml(plan, patient, profile), "plan");
  });
  it("certificate", () => {
    expectSafe(buildCertificateHtml({ type: "rest", patient, profile, issuedOn: "2026-11-12", days: "2", from: "2026-11-12", treatment: PAY, remarks: PAY }), "certificate");
  });
  it("consent form", () => {
    expectSafe(consentHtml({ id: "C1", procedure: PAY, text: PAY, signerName: PAY, signature: "javascript:alert(4)", clinic: PAY, date: "2026-11-12", at: "2026-11-12", note: PAY, signedBy: PAY, relation: PAY, witness: PAY }, patient, profile), "consent");
  });
  it("referral slip", () => {
    expectSafe(referralSlipHtml(bag({ id: "R1", urgency: PAY, status: PAY }), patient, profile), "referral");
  });
  it("monthly report", () => {
    const inv = normalizeInvoice({ id: "B", patient: PAY, date: "01/11/2026", rawAmount: 100, treatment: PAY, payments: [{ date: "01/11/2026", mode: PAY, amountP: 100 }] });
    expectSafe(buildReportHtml([inv], "2026-11", profile), "report");
  });
  it("patient record sheet", () => {
    const appts = [bag({ date: "2026-11-01", time: "10:00", patientName: PAY })];
    expectSafe(recordSheetHtml(patient, { appointments: appts, invoices: [] }, profile, new Date(2026, 10, 12)), "record sheet");
  });
});
