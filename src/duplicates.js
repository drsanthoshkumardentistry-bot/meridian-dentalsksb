/* Spot a patient who may already be registered, so a clinic does not end up with two records for one person.
 * Same mobile number (last 10 digits) and the same name, or the same name and mobile together, counts as a match.
 * Family members often share a phone, so a shared number alone is only a "maybe", not a block. */

const last10 = (v) => String(v ?? "").replace(/\D/g, "").slice(-10);
const nameKey = (v) => String(v ?? "").toLowerCase().replace(/[^a-z0-9஀-௿ऀ-ॿ]+/g, " ").trim().replace(/\s+/g, " ");

/** Patients that look like the person being added. `same` = same name and same mobile; `shared` = same mobile, different name. */
export const findDuplicates = (patients, { name, phone } = {}) => {
  const n = nameKey(name);
  const ph = last10(phone);
  const list = Array.isArray(patients) ? patients : [];
  const same = [], shared = [];
  for (const p of list) {
    if (!p || typeof p !== "object") continue;
    const samePhone = ph.length === 10 && last10(p.phone) === ph;
    const sameName = n.length > 0 && nameKey(p.name) === n;
    if (samePhone && sameName) same.push(p);
    else if (samePhone) shared.push(p);
  }
  return { same, shared };
};

/** One-line warning for the toast, or "" when nothing matches. */
export const duplicateWarning = (found) => {
  if (found.same.length) return `${found.same[0].name} with this mobile number is already registered. Tap Register again to add a second record anyway.`;
  if (found.shared.length) return `${found.shared[0].name} already uses this mobile number. If this is a family member, tap Register again to continue.`;
  return "";
};

/** Key that says "the clinic already saw this warning for exactly these entries". */
export const duplicateKey = ({ name, phone } = {}) => `${nameKey(name)}|${last10(phone)}`;
