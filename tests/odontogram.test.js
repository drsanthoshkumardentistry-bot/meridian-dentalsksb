import { describe, it, expect } from "vitest";
import { toothInfo, groupFindings, archLayout, toggleFinding, normalizeConditions, primaryCode, chartedCount } from "../src/odontogram.js";

describe("FDI tooth helpers", () => {
  it("names permanent and primary teeth", () => {
    expect(toothInfo(16).name).toBe("Upper right first molar");
    expect(toothInfo(48).name).toBe("Lower right third molar");
    expect(toothInfo(24).name).toBe("Upper left first premolar");
    expect(toothInfo(33).name).toBe("Lower left canine");
    expect(toothInfo(11).name).toBe("Upper right central incisor");
    expect(toothInfo(74).name).toBe("Lower left first primary molar");
    expect(toothInfo(52).name).toBe("Upper right lateral primary incisor");
  });
  it("rejects invalid numbers", () => {
    [0, 9, 19, 49, 56, 66, 90, "abc", 1.5].forEach((n) => expect(toothInfo(n)).toBeNull());
  });
  it("groups findings in palette order with sorted teeth", () => {
    const palette = [{ id: "CAR" }, { id: "RES" }];
    const g = groupFindings({ 26: "RES", 16: "CAR", 11: "CAR", 99: "ZZZ" }, palette);
    expect(g).toEqual([
      { code: "CAR", teeth: [11, 16] },
      { code: "RES", teeth: [26] },
      { code: "ZZZ", teeth: [99] },
    ]);
  });
  it("lays 16 teeth left to right, mirrored between jaws", () => {
    const nums = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
    const up = archLayout(nums, { upper: true, cy: 160 });
    const lo = archLayout(nums, { upper: false, cy: 250 });
    expect(up.length).toBe(16);
    for (let i = 1; i < 16; i++) expect(up[i].x).toBeGreaterThan(up[i - 1].x);
    expect(up[0].y).toBeGreaterThan(up[7].y); // upper bulges upward
    expect(lo[0].y).toBeLessThan(lo[7].y); // lower bulges downward
    expect(Math.abs(up[0].x + up[15].x - 600)).toBeLessThan(2); // symmetric
  });
});

describe("multiple findings per tooth", () => {
  it("reads old single-code charts and new arrays alike", () => {
    expect(normalizeConditions({ 16: "CAR", 26: ["RES", "CRW", "RES"], 11: [] })).toEqual({ 16: ["CAR"], 26: ["RES", "CRW"] });
  });
  it("adds a second finding and removes one at a time", () => {
    let c = toggleFinding({ 16: "CAR" }, 16, "RCT");
    expect(c).toEqual({ 16: ["CAR", "RCT"] });
    c = toggleFinding(c, 16, "CRW");
    expect(c[16]).toEqual(["CAR", "RCT", "CRW"]);
    c = toggleFinding(c, 16, "CAR");
    expect(c[16]).toEqual(["RCT", "CRW"]);
    c = toggleFinding(toggleFinding(c, 16, "RCT"), 16, "CRW");
    expect(c).toEqual({});
  });
  it("keeps Missing and Healthy on their own", () => {
    expect(toggleFinding({ 46: ["CAR", "RCT"] }, 46, "MIS")).toEqual({ 46: ["MIS"] });
    expect(toggleFinding({ 46: ["MIS"] }, 46, "IMP")).toEqual({ 46: ["IMP"] });
    expect(toggleFinding({ 46: ["CAR"] }, 46, "HLT")).toEqual({ 46: ["HLT"] });
    expect(toggleFinding({ 46: ["HLT"] }, 46, "CAR")).toEqual({ 46: ["CAR"] });
  });
  it("does not change the chart it was given", () => {
    const before = { 16: ["CAR"] };
    toggleFinding(before, 16, "RCT");
    expect(before).toEqual({ 16: ["CAR"] });
  });
  it("colours by the most urgent finding and counts teeth once", () => {
    expect(primaryCode(["CRW", "CAR"])).toBe("CAR");
    expect(primaryCode([])).toBeNull();
    expect(chartedCount({ 16: ["CAR", "RCT"], 26: "RES" })).toBe(2);
  });
  it("lists a tooth under each of its findings", () => {
    const g = groupFindings({ 16: ["CAR", "RCT"], 26: ["CAR"] }, [{ id: "CAR" }, { id: "RCT" }]);
    expect(g).toEqual([{ code: "CAR", teeth: [16, 26] }, { code: "RCT", teeth: [16] }]);
  });
});
