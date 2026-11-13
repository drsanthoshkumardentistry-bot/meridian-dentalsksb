import { describe, it, expect } from "vitest";
import { findDuplicates, duplicateWarning, duplicateKey } from "../src/duplicates.js";

const list = [
  { id: "1", name: "Asha K", phone: "9876543210" },
  { id: "2", name: "Ravi", phone: "+91 98765-43210" },
  { id: "3", name: "Meena", phone: "9000000001" },
  null,
];

describe("duplicates", () => {
  it("finds same name and mobile", () => {
    const f = findDuplicates(list, { name: "  asha  k ", phone: "09876543210" });
    expect(f.same.map((p) => p.id)).toEqual(["1"]);
    expect(f.shared.map((p) => p.id)).toEqual(["2"]);
  });
  it("treats a shared mobile with another name as maybe", () => {
    const f = findDuplicates(list, { name: "Kiran", phone: "98765 43210" });
    expect(f.same).toEqual([]);
    expect(f.shared).toHaveLength(2);
    expect(duplicateWarning(f)).toMatch(/family member/);
  });
  it("finds nothing for a new person", () => {
    const f = findDuplicates(list, { name: "New", phone: "9111111111" });
    expect(duplicateWarning(f)).toBe("");
  });
  it("ignores short or missing numbers and bad input", () => {
    expect(findDuplicates(list, { name: "Asha K", phone: "123" }).same).toEqual([]);
    expect(findDuplicates(null, {}).same).toEqual([]);
    expect(findDuplicates(list).shared).toEqual([]);
  });
  it("gives the same key for the same entries", () => {
    expect(duplicateKey({ name: "Asha  K", phone: "+91 9876543210" })).toBe(duplicateKey({ name: "asha k", phone: "9876543210" }));
  });
});
