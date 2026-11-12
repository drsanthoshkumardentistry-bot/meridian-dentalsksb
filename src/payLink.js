// A link a patient can open in WhatsApp to pay by UPI. No payment service, no fees: the page only builds
// the standard UPI request, and the money goes straight from the patient's UPI app to the clinic's UPI ID.
import { isValidUpiId, buildUpiUri } from "./billing.js";

const MAX_AMOUNT_P = 1000000 * 100; // 10 lakh rupees, far above one dental bill

export const buildPayLink = (origin, { vpa, name = "", amountP = 0, note = "" } = {}) => {
  if (!isValidUpiId(vpa)) return "";
  const q = new URLSearchParams({ pay: "1", pa: String(vpa).trim() });
  if (name) q.set("pn", String(name).slice(0, 60));
  if (amountP > 0) q.set("am", (amountP / 100).toFixed(2));
  if (note) q.set("tn", String(note).slice(0, 40));
  return `${String(origin).replace(/\/$/, "")}/?${q.toString()}`;
};

/** Reads a pay link's query string. Returns the checked request, or null when it is not a valid one. */
export const parsePayLink = (search) => {
  const q = new URLSearchParams(search);
  if (q.get("pay") !== "1") return null;
  const vpa = (q.get("pa") || "").trim();
  if (!isValidUpiId(vpa)) return null;
  const amount = q.get("am");
  let amountP = 0;
  if (amount) {
    if (!/^\d{1,7}(\.\d{1,2})?$/.test(amount)) return null;
    amountP = Math.round(Number(amount) * 100);
    if (amountP <= 0 || amountP > MAX_AMOUNT_P) return null;
  }
  return { vpa, name: (q.get("pn") || "").slice(0, 60), amountP, note: (q.get("tn") || "").slice(0, 40) };
};

export const upiUriFor = (req) => buildUpiUri(req);
