// Dropdown lists the clinic can edit. Defaults match the old fixed options.
export const LIST_DEFS = {
  visitTypes: { label: "Visit types", defaults: ["New patient", "Follow-up", "Review", "Emergency"] },
  procedures: { label: "Common procedures", defaults: ["Consultation", "Scaling and polishing", "Composite filling", "Root canal treatment", "Extraction", "Crown", "Dental X-ray", "Orthodontic review"] },
  staffRoles: { label: "Staff roles", defaults: ["Orthodontist", "Endodontist", "Oral & Maxillofacial Surgeon", "Periodontist", "General Dentistry", "Hygienist", "Dental Assistant"] },
  shifts: { label: "Staff shifts", defaults: ["Morning", "Evening", "Full day"] },
  referralSources: { label: "How patients find you", defaults: ["Walk-in", "Doctor referral", "Friend / family", "Google / website", "Social media", "Camp / school", "Other"] },
  guardianRelations: { label: "Guardian relations", defaults: ["Mother", "Father", "Guardian", "Other"] },
  stockCategories: { label: "Stock categories", defaults: ["Restorative", "Surgical", "Materials", "Medications"] },
};
export const MAX_OPTIONS = 30;
export const MAX_OPTION_LEN = 40;

export const listOf = (profile, key) => {
  const custom = profile?.lists?.[key];
  return Array.isArray(custom) && custom.length ? custom : LIST_DEFS[key].defaults;
};

/** Keeps a value already in use selectable even if the clinic later removed it from the list. */
export const withCurrent = (list, current) => (current && !list.includes(current) ? [current, ...list] : list);

export const addOption = (list, text) => {
  const t = String(text ?? "").trim().replace(/\s+/g, " ").slice(0, MAX_OPTION_LEN);
  if (!t) return { list, error: "Type an option first" };
  if (list.some((x) => x.toLowerCase() === t.toLowerCase())) return { list, error: "That option is already there" };
  if (list.length >= MAX_OPTIONS) return { list, error: `Up to ${MAX_OPTIONS} options` };
  return { list: [...list, t] };
};
export const removeOption = (list, text) =>
  list.length <= 1 ? { list, error: "Keep at least one option" } : { list: list.filter((x) => x !== text) };
export const moveOption = (list, text, dir) => {
  const i = list.indexOf(text), j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
};
export const setList = (profile, key, list) => ({ ...profile, lists: { ...(profile.lists || {}), [key]: list } });
export const resetList = (profile, key) => {
  const lists = { ...(profile.lists || {}) };
  delete lists[key];
  return { ...profile, lists };
};
