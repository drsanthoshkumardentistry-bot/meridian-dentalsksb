// Pure rules for MeriDent Connect: validation, consent wording, ordering. No Firebase here.

export const SPECIALTIES = [
  ["general", "General dentistry"],
  ["endodontics", "Endodontics (root canal)"],
  ["oral_surgery", "Oral and maxillofacial surgery"],
  ["periodontics", "Periodontics"],
  ["orthodontics", "Orthodontics"],
  ["prosthodontics", "Prosthodontics"],
  ["pedodontics", "Pediatric dentistry"],
  ["implantology", "Implantology"],
  ["oral_medicine", "Oral medicine and radiology"],
  ["oral_pathology", "Oral pathology"],
  ["public_health", "Public health dentistry"]
];
export const specialtyLabel = (id) => (SPECIALTIES.find(([k]) => k === id) || [id, id])[1];

export const DISTANCES_KM = [5, 10, 25, 50, 100];
export const URGENCIES = [
  ["routine", "Routine"],
  ["soon", "Soon (this week)"],
  ["urgent", "Urgent (today)"]
];

export const CONSENT_VERSION = 1;
// PLACEHOLDER wording. Replace with lawyer-reviewed text and raise CONSENT_VERSION when it changes.
export const CONSENT_TEXT =
  "I confirm the patient has been informed and has agreed to share the details below with the receiving dentist for this referral.";

export const MAX_SUMMARY = 1500;

const isIndianMobile = (v) => /^[6-9]\d{9}$/.test(String(v || "").replace(/\D/g, "").replace(/^91(?=\d{10}$)/, ""));
export const digits10 = (v) => String(v || "").replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");

/** Registration form check. Returns an error message or "". */
export const validateProfile = (f) => {
  const need = [
    ["fullName", "your name"],
    ["qualification", "your qualification, for example BDS or MDS (Endodontics)"],
    ["councilState", "the State Dental Council you are registered with"],
    ["registrationNo", "your dental council registration number"],
    ["clinicName", "your clinic name"],
    ["clinicAddress", "your full clinic address with pin code"]
  ];
  for (const [k, what] of need) if (!String(f[k] || "").trim()) return `Enter ${what}.`;
  if (!SPECIALTIES.some(([k]) => k === f.specialty)) return "Choose your specialty.";
  if (!isIndianMobile(f.phone)) return "Enter a valid 10-digit Indian mobile number for the clinic.";
  if (f.whatsapp && !isIndianMobile(f.whatsapp)) return "WhatsApp number must be a valid 10-digit Indian mobile number.";
  return "";
};

/** Consult request check. Case details need consent; the patient is named by initials or an ID only. */
export const validateConsult = ({ urgency, patientRef, caseSummary, consent }) => {
  if (!URGENCIES.some(([k]) => k === urgency)) return "Choose how urgent the request is.";
  const ref = String(patientRef || "").trim();
  if (ref && !/^[A-Za-z0-9 .\-]{1,12}$/.test(ref)) return "Use the patient's initials or an ID of up to 12 characters, not their full name.";
  const summary = String(caseSummary || "").trim();
  if (summary.length > MAX_SUMMARY) return `Keep the case summary under ${MAX_SUMMARY} characters.`;
  if (summary && !consent) return "Tick the box to confirm the patient agreed to share these details.";
  return "";
};

/** Nearest first, then name. No paid, rating or popularity signal. */
export const orderResults = (list) =>
  [...list].sort((a, b) => a.distanceKm - b.distanceKm || String(a.fullName).localeCompare(String(b.fullName)));

export const filterResults = (list, { specialty = "all", acceptingOnly = true, excludeId, emergencyOnly = false, onlyIds = null } = {}) =>
  list.filter(
    (d) =>
      d.id !== excludeId &&
      (!emergencyOnly || d.emergencyAvailable === true) &&
      (!onlyIds || onlyIds.includes(d.id)) &&
      (specialty === "all" || d.specialty === specialty) &&
      (!acceptingOnly || d.acceptingReferrals !== false)
  );

const NEXT = { sent: ["accepted", "declined"], accepted: ["completed"] };
export const canMoveTo = (from, to) => (NEXT[from] || []).includes(to);

export const waLink = (number, text) => {
  const n = digits10(number);
  return n ? `https://wa.me/91${n}${text ? `?text=${encodeURIComponent(text)}` : ""}` : "";
};
export const telLink = (number) => (digits10(number) ? `tel:+91${digits10(number)}` : "");
export const osmLink = (lat, lng) => `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;

/** Turn-by-turn directions in the phone's maps app (Google Maps opens on Android and the web). */
export const directionsLink = (lat, lng) =>
  Number.isFinite(lat) && Number.isFinite(lng) ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}` : "";

/** Saved specialists are kept on this device only. */
export const toggleSaved = (ids, id) => {
  const list = Array.isArray(ids) ? ids.filter((x) => typeof x === "string") : [];
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id].slice(-100);
};

/** A short text a dentist can paste into WhatsApp to pass a specialist on. */
export const shareText = (d) =>
  [`${d.fullName}, ${d.qualification}`, specialtyLabel(d.specialty), `${d.clinicName}, ${d.clinicAddress}`, d.phone ? `Phone: ${digits10(d.phone)}` : "", d.timings ? `Timings: ${d.timings}` : ""]
    .filter(Boolean).join("\n");
