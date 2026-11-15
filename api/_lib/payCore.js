// "Verified payment link" support. A clinic's UPI ID and name are sealed with a key only the server knows, so a link
// that was edited (someone swapped in their own UPI ID) or invented from scratch fails the check on the patient's page.
// The seal is issued only to a signed-in clinic account. It does not stop a real account holder from sealing their own
// details, so the page still tells patients to check the name. Amount and note are not sealed (they change per bill).
import crypto from "node:crypto";

export const UPI_RE = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/; // same rule as the app (isValidUpiId)
export const cleanName = (n) => String(n || "").trim().slice(0, 60);

const sealKey = (sa) => crypto.createHash("sha256").update("merident-pay-seal|" + sa.private_key).digest();
const payload = (uid, vpa, name) => `${uid}|${String(vpa).trim().toLowerCase()}|${cleanName(name)}`;

export const signSeal = (sa, uid, vpa, name) => crypto.createHmac("sha256", sealKey(sa)).update(payload(uid, vpa, name)).digest("hex");

export const verifySeal = (sa, p) => {
  const { u, pa, pn, ks } = p && typeof p === "object" ? p : {};
  if (!sa || typeof u !== "string" || typeof pa !== "string" || typeof ks !== "string" || !u || u.length > 128 || !UPI_RE.test(pa.trim())) return false;
  if (!/^[0-9a-f]{64}$/.test(ks)) return false;
  const want = Buffer.from(signSeal(sa, u, pa, pn), "hex");
  const got = Buffer.from(ks, "hex");
  return got.length === want.length && crypto.timingSafeEqual(got, want);
};
