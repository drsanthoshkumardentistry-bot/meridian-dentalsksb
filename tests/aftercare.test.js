import { describe, it, expect } from "vitest";
import { AFTERCARE_KINDS, buildAftercare, suggestAftercare } from "../src/aftercare.js";

describe("aftercare messages", () => {
  it("suggests the kind from the visit note", () => {
    expect(suggestAftercare("Extraction of 38")).toBe("extraction");
    expect(suggestAftercare("RCT access opening, tooth 36")).toBe("rootcanal");
    expect(suggestAftercare("GIC filling 46")).toBe("filling");
    expect(suggestAftercare("Scaling and polishing")).toBe("scaling");
    expect(suggestAftercare("Crown preparation")).toBe("crown");
    expect(suggestAftercare("Consultation only")).toBe("");
  });
  it("builds a numbered English message with the first name and clinic", () => {
    const m = buildAftercare({ kind: "extraction", clinicName: "Smile Clinic", patientName: "Asha Raman" });
    expect(m).toMatch(/^Hello Asha,/);
    expect(m).toMatch(/Smile Clinic/);
    expect(m).toMatch(/1\. Bite gently/);
    expect(m).toMatch(/call the clinic/);
    expect(m).not.toMatch(/Raman/);
  });
  it("has every kind in Tamil and Hindi and never gives a dose", () => {
    for (const k of AFTERCARE_KINDS) {
      ["en", "ta", "hi"].forEach((lang) => {
        const m = buildAftercare({ kind: k.id, language: lang, patientName: "A" });
        expect(m.length).toBeGreaterThan(60);
        expect(m).not.toMatch(/\d+\s?mg|tablet/i);
      });
    }
    expect(buildAftercare({ kind: "filling", language: "ta", patientName: "A" })).toMatch(/வணக்கம்/);
    expect(buildAftercare({ kind: "filling", language: "hi", patientName: "A" })).toMatch(/नमस्ते/);
  });
  it("returns nothing for an unknown kind", () => {
    expect(buildAftercare({ kind: "x" })).toBe("");
  });
});
