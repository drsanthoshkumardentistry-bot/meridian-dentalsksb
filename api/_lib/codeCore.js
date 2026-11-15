// Email confirmation codes with no database. The server makes an 8-digit code, emails it, and gives the browser a "ticket":
// an expiry time plus a signature over (account, code, expiry). The code itself is never sent to the browser. When the person
// types the code back, the server recomputes the signature, so only someone who read the email can pass.
import crypto from "node:crypto";

export const CODE_LIFETIME_MS = 15 * 60 * 1000;
const key = (sa, purpose) => crypto.createHash("sha256").update(`merident-code|${purpose}|${sa.private_key}`).digest();
const mac = (sa, purpose, uid, code, exp) => crypto.createHmac("sha256", key(sa, purpose)).update(`${uid}|${code}|${exp}`).digest("hex");

export const makeCode = () => String(crypto.randomInt(0, 100000000)).padStart(8, "0");

export const sealTicket = (sa, purpose, uid, code, now = Date.now()) => {
  const exp = now + CODE_LIFETIME_MS;
  return `${exp}.${mac(sa, purpose, uid, code, exp)}`;
};

export const verifyTicket = (sa, purpose, uid, code, ticket, now = Date.now()) => {
  try {
    const [expText, sig] = String(ticket || "").split(".");
    const exp = Number(expText);
    const c = String(code || "").replace(/\s+/g, "");
    if (!sa || !uid || !/^\d{8}$/.test(c) || !Number.isFinite(exp) || exp < now || !/^[0-9a-f]{64}$/.test(sig || "")) return false;
    return crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(mac(sa, purpose, uid, c, exp), "hex"));
  } catch (e) { return false; }
};

export const maskEmail = (email) => {
  const [u = "", d = ""] = String(email || "").split("@");
  return `${u.slice(0, 1)}${"*".repeat(Math.max(2, Math.min(u.length - 1, 6)))}@${d}`;
};
