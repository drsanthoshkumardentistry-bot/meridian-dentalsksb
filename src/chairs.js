// Clinic chairs (operatories). Names are what appointments store, so the defaults match the old fixed list.
export const DEFAULT_CHAIRS = [
  { id: "c1", name: "Chair 1 (Main Operatory)", note: "" },
  { id: "c2", name: "Chair 2 (Pediatric / Perio)", note: "" },
  { id: "c3", name: "Chair 3 (Prosthodontics)", note: "" },
];
export const MAX_CHAIRS = 20;
export const MAX_NOTE = 300;

export const chairsOf = (profile) =>
  Array.isArray(profile?.chairs) && profile.chairs.length ? profile.chairs : DEFAULT_CHAIRS;
export const chairNames = (profile) => chairsOf(profile).map((c) => c.name).filter(Boolean);

export const cleanNote = (s) => String(s ?? "").slice(0, MAX_NOTE);

export const addChair = (chairs, id) => {
  if (chairs.length >= MAX_CHAIRS) return { chairs, error: `Up to ${MAX_CHAIRS} chairs` };
  let n = chairs.length + 1;
  const taken = new Set(chairs.map((c) => c.name));
  while (taken.has(`Chair ${n}`)) n += 1;
  return { chairs: [...chairs, { id, name: `Chair ${n}`, note: "" }] };
};
export const updateChair = (chairs, id, patch) =>
  chairs.map((c) => (c.id === id ? { ...c, ...patch, note: patch.note !== undefined ? cleanNote(patch.note) : c.note } : c));
export const removeChair = (chairs, id) =>
  chairs.length <= 1 ? { chairs, error: "Keep at least one chair" } : { chairs: chairs.filter((c) => c.id !== id) };
export const nameProblem = (chairs, id, name) => {
  const t = String(name).trim();
  if (!t) return "Give the chair a name";
  if (chairs.some((c) => c.id !== id && c.name.trim().toLowerCase() === t.toLowerCase())) return "Another chair has this name";
  return "";
};

export const setProfileNote = (profile, key, text) => ({
  ...profile,
  notes: { ...(profile.notes || {}), [key]: cleanNote(text) },
});
