// The clinic's own medicine list for prescriptions. Starts with common dental medicines; the clinic can
// add, change, remove and reset. A prescription line copies the values, so later edits never change past slips.

export const DEFAULT_MEDICINES = [
  { id: "m-zerodol", name: "Zerodol-SP", generic: "Aceclofenac 100mg + Paracetamol 325mg + Serratiopeptidase 15mg", dosage: "1 Tab", frequency: "1-0-1", duration: "3 Days", instruction: "After Food" },
  { id: "m-moxikind", name: "Moxikind-CV 625", generic: "Amoxicillin 500mg + Clavulanic Acid 125mg", dosage: "1 Tab", frequency: "1-0-1", duration: "5 Days", instruction: "After Food" },
  { id: "m-ketorol", name: "Ketorol-DT", generic: "Ketorolac Tromethamine 10mg (Dispersible)", dosage: "1 Tab", frequency: "SOS", duration: "2 Days", instruction: "Dissolve in half cup water" },
  { id: "m-metrogyl", name: "Metrogyl 400", generic: "Metronidazole 400mg", dosage: "1 Tab", frequency: "1-1-1", duration: "3 Days", instruction: "After Food" },
  { id: "m-rexidin", name: "Rexidin 0.2%", generic: "Chlorhexidine Gluconate 0.2% w/v Mouthwash", dosage: "10 ml", frequency: "1-0-1", duration: "7 Days", instruction: "Rinse for 1 min after brushing" },
  { id: "m-kenacort", name: "Kenacort 0.1%", generic: "Triamcinolone Acetonide 0.1% Oral Paste", dosage: "Thin layer", frequency: "0-0-1", duration: "5 Days", instruction: "Apply at bedtime over the ulcer" },
];

export const FREQUENCY_HINTS = ["1-0-1", "1-1-1", "1-0-0", "0-1-0", "0-0-1", "SOS", "Once a week"];
export const DURATION_HINTS = ["1 Day", "2 Days", "3 Days", "5 Days", "7 Days", "10 Days", "14 Days", "Ongoing"];
export const MAX_MEDICINES = 80;

export const medicinesOf = (profile) => (Array.isArray(profile?.medicines) ? profile.medicines : DEFAULT_MEDICINES);

const clip = (v, n) => String(v ?? "").trim().replace(/\s+/g, " ").slice(0, n);

/** Check and tidy one medicine form. Returns { ok, med } or { ok: false, error }. */
export const cleanMedicine = (form, id) => {
  const med = {
    id: id || form.id || "",
    name: clip(form.name, 60),
    generic: clip(form.generic, 160),
    dosage: clip(form.dosage, 40) || "1 Tab",
    frequency: clip(form.frequency, 30),
    duration: clip(form.duration, 30),
    instruction: clip(form.instruction, 120),
  };
  if (!med.name) return { ok: false, error: "Type the medicine name" };
  if (!med.frequency) return { ok: false, error: "Type how often, for example 1-0-1" };
  if (!med.duration) return { ok: false, error: "Type for how long, for example 5 Days" };
  return { ok: true, med };
};

/** Add a new medicine or replace one with the same id. Names must stay unique. */
export const upsertMedicine = (profile, med, newId) => {
  const list = medicinesOf(profile);
  const clash = list.some((m) => m.id !== med.id && m.name.toLowerCase() === med.name.toLowerCase());
  if (clash) return { error: "That medicine is already in your list" };
  const exists = med.id && list.some((m) => m.id === med.id);
  if (!exists && list.length >= MAX_MEDICINES) return { error: `Up to ${MAX_MEDICINES} medicines` };
  const saved = exists ? med : { ...med, id: newId() };
  return { profile: { ...profile, medicines: exists ? list.map((m) => (m.id === med.id ? saved : m)) : [...list, saved] }, med: saved };
};
export const removeMedicine = (profile, id) => ({ ...profile, medicines: medicinesOf(profile).filter((m) => m.id !== id) });
export const resetMedicines = (profile) => {
  const { medicines, ...rest } = profile || {};
  return rest;
};

/** A prescription line for a patient's slip. */
export const prescriptionLine = (med, id) => ({
  id, drug: med.name, generic: med.generic || "", dosage: med.dosage || "1 Tab",
  frequency: med.frequency, duration: med.duration, instruction: med.instruction || "After food",
});
