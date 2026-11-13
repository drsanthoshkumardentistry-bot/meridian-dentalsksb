// Insurance / TPA claims on an invoice (pure helpers). The claim sits on the invoice itself.
import { normalizeInvoice, balancePaise, addPayment, toPaise } from "./billing.js";

export const CLAIM_STATUSES = ["Submitted", "Approved", "Rejected", "Settled"];
export const INSURER_MODE = "Insurance";

/** True while the insurer still owes money on this invoice. */
export const claimIsOpen = (inv) => Boolean(inv && inv.claim && (inv.claim.status === "Submitted" || inv.claim.status === "Approved"));

/** What the insurer still owes, never more than the invoice balance. */
export const claimOutstandingP = (rawInv) => {
  const inv = normalizeInvoice(rawInv);
  if (!claimIsOpen(inv)) return 0;
  return Math.min(Math.max(0, Number(inv.claim.amountP) || 0), balancePaise(inv));
};

export const claimsSummary = (invoices = []) => {
  let open = 0, openP = 0, rejected = 0, settled = 0;
  for (const raw of Array.isArray(invoices) ? invoices : []) {
    if (!raw || !raw.claim) continue;
    if (claimIsOpen(raw)) { open += 1; openP += claimOutstandingP(raw); }
    else if (raw.claim.status === "Rejected") rejected += 1;
    else if (raw.claim.status === "Settled") settled += 1;
  }
  return { open, openP, rejected, settled };
};

/** Saves or updates the claim. A Settled claim also records the insurer's payment. Returns {ok, invoice, error}. */
export const applyClaim = (rawInv, form = {}, now = new Date()) => {
  const inv = normalizeInvoice(rawInv);
  if (!inv) return { ok: false, error: "Invoice not found" };
  if (inv.claim && inv.claim.status === "Settled") return { ok: false, error: "This claim is settled and cannot be changed" };
  const insurer = String(form.insurer || "").trim().slice(0, 80);
  if (!insurer) return { ok: false, error: "Enter the insurer or TPA name" };
  const amountP = toPaise(form.amount);
  if (!(amountP > 0)) return { ok: false, error: "Enter the claim amount" };
  if (amountP > (inv.totalP || 0)) return { ok: false, error: "The claim cannot be more than the invoice total" };
  const status = CLAIM_STATUSES.includes(form.status) ? form.status : "Submitted";
  const claim = { insurer, claimNo: String(form.claimNo || "").trim().slice(0, 40), amountP, status, updatedAt: now.toISOString() };
  let next = { ...inv, claim };
  if (status === "Settled") {
    const received = toPaise(form.received === undefined || form.received === "" ? form.amount : form.received);
    const paid = addPayment(next, { amount: received / 100, mode: INSURER_MODE, date: now.toLocaleDateString("en-IN") });
    if (!paid.ok) return { ok: false, error: paid.error === "Payment is more than the balance due" ? "The amount received is more than the balance on this invoice" : paid.error };
    next = { ...paid.invoice, claim: { ...claim, settledP: received } };
  }
  return { ok: true, invoice: next };
};
