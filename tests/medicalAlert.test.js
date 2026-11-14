import { describe, it, expect } from "vitest";
import { alertText, alertParts, regularMedicines } from "../src/medicalAlert.js";

describe("medical alert", () => {
  it("combines the alert text, ticked conditions, typed conditions and allergies", () => {
    expect(alertText({ medicalAlert: "Thyroid", systemic: { hypotension: true, diabetes: true }, conditions: "Asthma; Epilepsy", allergies: "Penicillin" }))
      .toBe("Thyroid, Hypotension, Diabetes, Asthma, Epilepsy, Allergic to Penicillin");
  });
  it("lists a fact once even if typed and ticked", () => {
    expect(alertParts({ medicalAlert: "Thyroid", systemic: { thyroid: true } })).toEqual(["Thyroid"]);
    expect(alertParts({ medicalAlert: "hypotension", systemic: { hypotension: true } })).toEqual(["hypotension"]);
  });
  it("ignores none, nil and NKDA answers", () => {
    expect(alertText({ medicalAlert: "None", conditions: "Nil", allergies: "NKDA" })).toBe("");
    expect(alertText({})).toBe("");
    expect(alertText(null)).toBe("");
  });
  it("reads regular medicines", () => {
    expect(regularMedicines({ currentMedicines: " Midodrine 2.5 mg " })).toBe("Midodrine 2.5 mg");
    expect(regularMedicines({ currentMedicines: "None" })).toBe("");
  });
});

import { SYSTEM_GROUPS, SYSTEMIC_CONDITIONS, tickedInGroup } from "../src/medicalAlert.js";
describe("conditions by body system", () => {
  it("keeps every earlier condition id and has no repeated id", () => {
    const ids = SYSTEMIC_CONDITIONS.map((c) => c.id);
    ["hypertension", "hypotension", "diabetes", "thyroid", "cardiac", "allergy", "bleeding", "respiratory", "epilepsy"].forEach((id) => expect(ids).toContain(id));
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("groups heart, lung, sugar and nerve conditions under their own system", () => {
    const where = (id) => SYSTEM_GROUPS.find((g) => g.items.some((c) => c.id === id)).title;
    expect(where("cardiac")).toBe("Cardiovascular system");
    expect(where("respiratory")).toBe("Respiratory system");
    expect(where("diabetes")).toBe("Endocrine and metabolic");
    expect(where("epilepsy")).toBe("Nervous system");
  });
  it("puts new conditions into the alert line and counts ticks per system", () => {
    const p = { systemic: { cardiac: true, pacemaker: true, kidney: true } };
    expect(alertText(p)).toBe("Heart disease, Pacemaker or stent, Kidney disease");
    expect(tickedInGroup(p, SYSTEM_GROUPS[0])).toBe(2);
    expect(tickedInGroup({}, SYSTEM_GROUPS[0])).toBe(0);
    expect(tickedInGroup(null, SYSTEM_GROUPS[0])).toBe(0);
  });
});
