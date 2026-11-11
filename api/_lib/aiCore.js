// Shared logic for the AI writing helper. Pure functions so they can be tested without a network.
// The helper only rewrites what the dentist typed or what is already in the plan. It never diagnoses.

export const MODEL = "claude-haiku-5-5";
export const GEMINI_MODEL = "gemini-2.5-flash";
export const MAX_TEXT = 4000;
export const MAX_ITEMS = 30;
export const LANGUAGE_NAMES = { English: "English", Tamil: "Tamil", Hindi: "Hindi", Telugu: "Telugu", Malayalam: "Malayalam", Kannada: "Kannada", Marathi: "Marathi", Bengali: "Bengali", Gujarati: "Gujarati", Punjabi: "Punjabi" };

const RULES = [
  "You are MeriDent AI, a writing assistant inside a dental practice app in India.",
  "You only reorganise or rephrase information you are given. You never add findings, diagnoses, treatments, doses, medicines, prices or promises that are not in the input.",
  "If something is missing, leave it blank instead of guessing.",
  "Never include a patient's name, phone number or address.",
].join(" ");

export const cleanText = (value, max = MAX_TEXT) =>
  String(value == null ? "" : value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);

export const languageName = (value) => LANGUAGE_NAMES[cleanText(value, 20)] || "English";

/** Returns { ok, system, user, kind } or { ok:false, error } for a request body. */
export const buildRequest = (body = {}) => {
  const task = cleanText(body.task, 30);
  if (task === "visit_note") {
    const notes = cleanText(body.notes);
    if (notes.length < 10) return { ok: false, error: "Type a few words about the visit first." };
    return {
      ok: true,
      kind: "json",
      system: `${RULES} Return only a JSON object with the string keys complaint, findings, treatment, advice, nextVisit. Use short clinical wording in English. Use "" for anything the notes do not say.`,
      user: `Dentist's rough notes:\n${notes}`,
    };
  }
  if (task === "plan_explain") {
    const items = (Array.isArray(body.items) ? body.items : []).slice(0, MAX_ITEMS)
      .map((it) => ({ description: cleanText(it && it.description, 120), tooth: cleanText(it && it.tooth, 30), amount: Number(it && it.amount) || 0 }))
      .filter((it) => it.description);
    if (!items.length) return { ok: false, error: "This plan has no treatments to explain." };
    const language = languageName(body.language);
    const lines = items.map((it) => `- ${it.description}${it.tooth ? ` (tooth ${it.tooth})` : ""}${it.amount ? `, Rs ${it.amount}` : ""}`).join("\n");
    return {
      ok: true,
      kind: "text",
      system: `${RULES} Write a short, warm, plain-language explanation of the treatment plan for the patient, in ${language}. Say what each treatment is for in one simple sentence, and keep any amounts exactly as given. Do not promise results or say a treatment is urgent. No headings, under 150 words, and end by inviting the patient to ask the dentist questions.`,
      user: `Treatment plan:\n${lines}`,
    };
  }
  return { ok: false, error: "Unknown request." };
};

const FIELDS = ["complaint", "findings", "treatment", "advice", "nextVisit"];

/** Pull the visit-note fields out of whatever the model returned. */
export const parseVisitNote = (text) => {
  const raw = String(text || "");
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const data = JSON.parse(raw.slice(start, end + 1));
    const out = {};
    FIELDS.forEach((k) => { out[k] = cleanText(data[k], 600); });
    return out;
  } catch (error) {
    return null;
  }
};

/** Best-effort limit per login: `limit` calls per `windowMs`. Resets when the function restarts. */
export const makeLimiter = (limit = 40, windowMs = 60 * 60 * 1000) => {
  const hits = new Map();
  return (key, now = Date.now()) => {
    const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (recent.length >= limit) { hits.set(key, recent); return false; }
    recent.push(now);
    hits.set(key, recent);
    return true;
  };
};
