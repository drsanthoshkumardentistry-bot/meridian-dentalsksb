// Saved prescription sets ("templates"): a named group of medicines added to a slip in one tap.
// Stored in the clinic profile. A slip line copies the values, so editing a set never changes past slips.
import { DEFAULT_MEDICINES } from "./medicines.js";

export const MAX_SETS = 30;
export const MAX_SET_ITEMS = 15;

const byId = (id) => DEFAULT_MEDICINES.find((m) => m.id === id);
const pick = (ids) => ids.map(byId).filter(Boolean);

// Starting points only. The dentist chooses what to prescribe; edit or delete any of these.
export const DEFAULT_RX_SETS = [
  { id: "set-extraction", name: "After extraction", items: pick(["m-zerodol", "m-moxikind", "m-rexidin"]) },
  { id: "set-pain", name: "Toothache / infection", items: pick(["m-zerodol", "m-moxikind", "m-metrogyl"]) },
  { id: "set-gum", name: "Gum problem", items: pick(["m-metrogyl", "m-rexidin"]) },
  { id: "set-ulcer", name: "Mouth ulcer", items: pick(["m-kenacort", "m-rexidin"]) },
];

export const rxSetsOf = (profile) => (Array.isArray(profile?.rxSets) ? profile.rxSets : DEFAULT_RX_SETS);

const clip = (v, n) => String(v ?? "").trim().replace(/\s+/g, " ").slice(0, n);
const cleanItem = (m) => ({
  id: "", name: clip(m.name ?? m.drug, 60), generic: clip(m.generic, 160), dosage: clip(m.dosage, 40) || "1 Tab",
  frequency: clip(m.frequency, 30), duration: clip(m.duration, 30), instruction: clip(m.instruction, 120),
});

/** Save the lines of a slip as a set. A set with the same name is replaced. Returns { profile } or { error }. */
export const saveRxSet = (profile, name, lines, newId) => {
  const title = clip(name, 40);
  if (!title) return { error: "Type a name for the set" };
  const items = (Array.isArray(lines) ? lines : []).map(cleanItem).filter((m) => m.name && m.frequency && m.duration).slice(0, MAX_SET_ITEMS);
  if (!items.length) return { error: "Add at least one medicine to the slip first" };
  const list = rxSetsOf(profile);
  const same = list.find((s) => s.name.toLowerCase() === title.toLowerCase());
  if (!same && list.length >= MAX_SETS) return { error: `Up to ${MAX_SETS} sets` };
  const saved = { id: same ? same.id : newId(), name: title, items };
  return { profile: { ...profile, rxSets: same ? list.map((s) => (s.id === same.id ? saved : s)) : [...list, saved] }, set: saved };
};
export const removeRxSet = (profile, id) => ({ ...profile, rxSets: rxSetsOf(profile).filter((s) => s.id !== id) });
export const resetRxSets = (profile) => { const { rxSets, ...rest } = profile || {}; return rest; };

/** The lines of a set that are not already on the slip (matched by medicine name). */
export const newLinesFromSet = (set, slip = []) => {
  const have = new Set((slip || []).map((l) => String(l.drug || "").toLowerCase()));
  return (set?.items || []).filter((m) => !have.has(String(m.name).toLowerCase()));
};
