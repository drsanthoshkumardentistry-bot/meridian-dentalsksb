/* ==============================================================================
 * MERIDENT OS - NEW-CLINIC SETUP CHECKLIST (pure functions, no React)
 * Steps are ticked from what the clinic has actually done, never by hand.
 * ============================================================================== */

import { isValidUpiId } from "./billing.js";

const filled = (v) => String(v || "").trim().length > 0;

export const setupSteps = ({ profile = {}, patients = [], appointments = [], invoices = [] } = {}) => [
  { id: "profile", label: "Add your clinic details", hint: "Doctor name, state and Dental Council registration number appear on prescriptions and invoices.", to: "Practice Profile",
    done: filled(profile.drName) && filled(profile.state) && filled(profile.councilRegNumber) },
  { id: "upi", label: "Add your UPI ID", hint: "So each invoice can show a QR code for the balance.", to: "Practice Profile", done: isValidUpiId(profile.upiId) },
  { id: "fees", label: "Add your procedure fees", hint: "Type a procedure on an invoice and its fee fills in.", to: "Settings", done: Array.isArray(profile.fees) && profile.fees.length > 0 },
  { id: "patient", label: "Register your first patient", hint: "Add a patient and chart their teeth.", to: "Patients & Odontogram", done: patients.length > 0 },
  { id: "appointment", label: "Book an appointment", hint: "Then remind the patient on WhatsApp.", to: "Appointments Diary", done: appointments.length > 0 },
  { id: "invoice", label: "Create an invoice", hint: "Bill a visit and share the UPI QR.", to: "Billing & Invoices", done: invoices.length > 0 },
  { id: "booking", label: "Turn on online booking", hint: "Share your booking link or QR so patients can request a slot.", to: "Settings", done: Boolean(profile.onlineBooking) },
];

export const setupProgress = (input) => {
  const steps = setupSteps(input);
  const doneCount = steps.filter((s) => s.done).length;
  return { steps, doneCount, total: steps.length, complete: doneCount === steps.length, next: steps.find((s) => !s.done) || null };
};
