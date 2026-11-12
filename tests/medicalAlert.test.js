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
