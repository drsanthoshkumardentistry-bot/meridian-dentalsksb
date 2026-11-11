// Clinic-editable wording for prescription messages and invoices.
export const RX_ADVICE_DEFAULT = [
  "Please take prescribed medications strictly on time.",
  "In case of persistent swelling or drug allergy, contact clinic immediately.",
];
export const MAX_TEXT = 600;

const clean = (s) => String(s ?? "").slice(0, MAX_TEXT);

/** One advice line per row of the clinic's text; falls back to the standard two lines. */
export const rxAdviceLines = (profile) => {
  const lines = String(profile?.texts?.rxAdvice ?? "").split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 8);
  return lines.length ? lines : RX_ADVICE_DEFAULT;
};
export const setText = (profile, key, value) => ({ ...profile, texts: { ...(profile.texts || {}), [key]: clean(value) } });
export const resetText = (profile, key) => {
  const texts = { ...(profile.texts || {}) };
  delete texts[key];
  return { ...profile, texts };
};
