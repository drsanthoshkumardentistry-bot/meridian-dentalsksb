import { describe, it, expect } from "vitest";
import { suggestClass, setCariesDetail, pruneCariesDetails, cariesText } from "../src/caries.js";

describe("Black class suggestion", () => {
  it("molar and premolar", () => {
    expect(suggestClass(36, { surfaces: ["O"] })).toBe("I");
    expect(suggestClass(36, { surfaces: ["B"] })).toBe("I");
    expect(suggestClass(36, { surfaces: ["M", "O"] })).toBe("II");
    expect(suggestClass(15, { surfaces: ["D"] })).toBe("II");
  });
  it("incisor and canine", () => {
    expect(suggestClass(11, { surfaces: ["M"] })).toBe("III");
    expect(suggestClass(11, { surfaces: ["D", "O"] })).toBe("IV");
    expect(suggestClass(13, { surfaces: ["L"] })).toBe("I");
    expect(suggestClass(21, { surfaces: ["O"] })).toBe("VI");
  });
  it("cervical and cusp tip", () => {
    expect(suggestClass(36, { cervical: true })).toBe("V");
    expect(suggestClass(36, { tip: true })).toBe("VI");
    expect(suggestClass(11, { tip: true })).toBe("VI");
  });
  it("gives nothing for a bad tooth or no surfaces", () => {
    expect(suggestClass(99, { surfaces: ["O"] })).toBe("");
    expect(suggestClass(36, {})).toBe("");
  });
});

describe("caries details", () => {
  it("re-suggests until the class is picked by hand", () => {
    let d = setCariesDetail({}, 36, { surfaces: ["O"] });
    expect(d[36].cls).toBe("I");
    d = setCariesDetail(d, 36, { surfaces: ["M", "O"] });
    expect(d[36].cls).toBe("II");
    d = setCariesDetail(d, 36, { cls: "V" });
    d = setCariesDetail(d, 36, { surfaces: ["O"] });
    expect(d[36].cls).toBe("V");
    d = setCariesDetail(d, 36, { cls: "" });
    d = setCariesDetail(d, 36, { surfaces: ["D", "O"] });
    expect(d[36].cls).toBe("II");
  });
  it("cleans junk input and survives damaged maps", () => {
    const d = setCariesDetail(null, 36, { surfaces: ["Z", "O", "O"], cls: "IX", depth: "x" });
    expect(d[36]).toMatchObject({ cls: "", surfaces: ["O"], depth: "" });
    expect(() => setCariesDetail([], 11, { surfaces: ["M"] })).not.toThrow();
  });
  it("drops details when the Caries finding is removed", () => {
    const d = { 36: { cls: "I" }, 11: { cls: "III" } };
    expect(Object.keys(pruneCariesDetails(d, { 36: ["CAR", "RCT"], 11: ["RES"] }))).toEqual(["36"]);
    expect(pruneCariesDetails(undefined, {})).toEqual({});
  });
  it("writes it in words", () => {
    const d = setCariesDetail({}, 36, { surfaces: ["D", "M", "O"], depth: "dentine" });
    expect(cariesText(d[36])).toBe("Class II (MOD), dentine");
    expect(cariesText(undefined)).toBe("");
  });
});
