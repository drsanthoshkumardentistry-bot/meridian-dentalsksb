import { normalizeConditions, groupFindings, toothInfo } from "./odontogram.js";
import { parseTeeth } from "./plans.js";
import { dateKey } from "./reminders.js";

const ADVICE = {
  CAR: "Restore carious teeth soon. Cut down sugary snacks between meals.",
  RCT: "Avoid hard food on the root-treated tooth until the final crown or filling.",
  FRC: "Avoid biting hard food on the fractured tooth. Return at once if pain or swelling starts.",
  SCL: "Brush twice daily and clean between teeth. Review in 6 months.",
  MIS: "Discuss replacement options for the missing tooth.",
  IMP: "Keep the implant area very clean. Come for regular review.",
};

/**
 * Draft a visit note from what is already charted. The doctor edits it before saving:
 * nothing here claims a treatment was done.
 */
export const draftVisitNote = (patient = {}, palette = [], now = new Date()) => {
  const conditions = normalizeConditions(patient.toothConditions || {});
  const label = (code) => (palette.find((p) => p.id === code) || {}).label || code;
  const groups = groupFindings(conditions, palette).filter((g) => g.code !== "HLT");
  const findings = groups.map((g) => `${label(g.code)}: ${g.teeth.join(", ")}`).join(". ");

  const advice = groups.map((g) => ADVICE[g.code]).filter(Boolean);

  const planned = (patient.plans || [])
    .filter((p) => p.status === "Approved")
    .flatMap((p) => p.items)
    .filter((it) => it.description);
  const first = planned[0];
  const nextVisit = first
    ? `${first.description}${parseTeeth(first.tooth).some((n) => toothInfo(n)) ? `, tooth ${parseTeeth(first.tooth).join(", ")}` : ""}`
    : "";

  return { date: dateKey(now), complaint: "", findings: findings ? `${findings}.` : "", treatment: "", advice: advice.join(" "), nextVisit };
};
