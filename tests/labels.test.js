import { describe, it, expect } from "vitest";
import { LABELS, MAX_LABELS, toggleLabel, labelsOf, filterByLabel, hasLabel } from "../src/labels.js";

describe("patient labels", () => {
  it("adds and removes a label", () => {
    const a = toggleLabel({ id: "P1" }, "vip");
    expect(a.patient.labels).toEqual(["vip"]);
    expect(hasLabel(a.patient, "vip")).toBe(true);
    expect(toggleLabel(a.patient, "vip").patient.labels).toEqual([]);
  });
  it("stops at five labels and ignores unknown ones", () => {
    let p = { id: "P1" };
    LABELS.slice(0, MAX_LABELS).forEach((l) => { p = toggleLabel(p, l.id).patient; });
    const over = toggleLabel(p, LABELS[MAX_LABELS].id);
    expect(over.error).toMatch(/up to 5/);
    expect(over.patient.labels.length).toBe(5);
    expect(toggleLabel(p, "nonsense").error).toBe("Unknown label");
    expect(labelsOf({ labels: ["vip", "gone"] }).map((l) => l.id)).toEqual(["vip"]);
  });
  it("filters the patient list", () => {
    const ps = [{ id: 1, labels: ["vip"] }, { id: 2, labels: ["child"] }, { id: 3 }];
    expect(filterByLabel(ps, "vip").map((p) => p.id)).toEqual([1]);
    expect(filterByLabel(ps, "").length).toBe(3);
  });
});
