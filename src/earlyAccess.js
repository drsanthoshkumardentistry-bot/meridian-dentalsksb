/* Free early access sign-up. No server and nothing stored by us: the form opens WhatsApp to the founders
 * with the clinic's details already written, and the clinic taps Send. */
export const EARLY_ACCESS_PATH = "/free-early-access";
export const EARLY_ACCESS_WHATSAPP = "919043205927";
export const EARLY_ACCESS_TITLE = "Free early access for dental clinics | MeriDent";
export const EARLY_ACCESS_DESCRIPTION = "MeriDent is free during early access, with no credit card. Tell us about your clinic on WhatsApp and we will help you set it up on a call.";

export const CLINIC_SIZES = ["1 chair", "2 to 3 chairs", "4 or more chairs", "Several branches"];

export const cleanPhone = (value = "") => {
  const digits = String(value).replace(/\D/g, "");
  const local = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits.length === 11 && digits.startsWith("0") ? digits.slice(1) : digits;
  return /^[6-9]\d{9}$/.test(local) ? local : "";
};

export const validateEarlyAccess = (f = {}) => {
  if (!String(f.name || "").trim()) return "Enter your name.";
  if (!String(f.clinic || "").trim()) return "Enter your clinic name.";
  if (!String(f.city || "").trim()) return "Enter your city.";
  if (!cleanPhone(f.phone)) return "Enter a 10-digit mobile number.";
  return "";
};

export const earlyAccessMessage = (f = {}) => {
  const lines = [
    "Hi, I would like free early access to MeriDent.",
    `Name: ${String(f.name || "").trim()}`,
    `Clinic: ${String(f.clinic || "").trim()}`,
    `City: ${String(f.city || "").trim()}`,
    `Mobile: +91 ${cleanPhone(f.phone)}`
  ];
  if (f.size) lines.push(`Clinic size: ${f.size}`);
  if (f.callMe) lines.push("Please call me to help set up.");
  return lines.join("\n");
};

export const earlyAccessLink = (f) => `https://wa.me/${EARLY_ACCESS_WHATSAPP}?text=${encodeURIComponent(earlyAccessMessage(f))}`;
