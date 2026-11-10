/* ==============================================================================
 * MERIDENT OS - PROCEDURE FEES (pure functions, no React)
 * The clinic's own price list. Typing a procedure name on an invoice or treatment plan fills its fee.
 * Amounts are in rupees (as typed in the forms). The clinic enters every price; none are assumed.
 * ============================================================================== */

import { TAX_CATEGORIES } from "./billing.js";

export const MAX_FEES = 200;
export const SUGGESTED_NAMES = [
  "Consultation", "Scaling and polishing", "Composite filling", "GIC filling", "Root canal treatment", "Post and core",
  "Crown (PFM)", "Crown (zirconia)", "Simple extraction", "Surgical extraction", "Wisdom tooth removal", "Complete denture",
  "Partial denture", "Dental implant", "Teeth whitening", "Orthodontic braces", "Pulpectomy", "Fluoride application",
  "Fissure sealant", "Digital X-ray (IOPA)", "OPG X-ray",
];

const norm = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
const validTax = (id) => TAX_CATEGORIES.some((c) => c.id === id);

/** Check the add form. Returns { ok, fee } or { ok: false, error }. */
export const buildFee = (form, existing = [], id) => {
  const name = String(form.name || "").trim().replace(/\s+/g, " ").slice(0, 80);
  if (!name) return { ok: false, error: "Enter the procedure name" };
  if (form.amount === "" || form.amount === null || form.amount === undefined) return { ok: false, error: "Enter the fee in rupees" };
  const amount = Math.round(Number(form.amount) * 100) / 100;
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: "The fee must be more than zero" };
  if (amount > 10000000) return { ok: false, error: "That fee looks too large" };
  if (existing.some((f) => norm(f.name) === norm(name) && f.id !== id)) return { ok: false, error: `${name} is already in your list` };
  if (!existing.some((f) => f.id === id) && existing.length >= MAX_FEES) return { ok: false, error: `You can keep up to ${MAX_FEES} procedures` };
  return { ok: true, fee: { id, name, amount, taxCategory: validTax(form.taxCategory) ? form.taxCategory : "therapeutic" } };
};

/** The saved list, cleaned, in name order. Anything unreadable is dropped. */
export const sortedFees = (fees) =>
  (Array.isArray(fees) ? fees : [])
    .filter((f) => f && f.id && String(f.name || "").trim() && Number(f.amount) > 0)
    .sort((a, b) => String(a.name).localeCompare(String(b.name), "en", { sensitivity: "base" }));

export const findFee = (fees, text) => {
  const n = norm(text);
  return n ? sortedFees(fees).find((f) => norm(f.name) === n) || null : null;
};

/**
 * When the typed description matches a fee, fill the amount and tax type, but only if the amount is still empty
 * so a price the user already typed is never overwritten.
 */
export const applyFee = (item, fees, description) => {
  const next = { ...item, description };
  const fee = findFee(fees, description);
  if (fee && (item.amount === "" || item.amount === undefined || item.amount === null)) {
    next.amount = String(fee.amount);
    next.taxCategory = fee.taxCategory;
  }
  return next;
};
