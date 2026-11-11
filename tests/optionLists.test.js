import { describe, it, expect } from "vitest";
import { listOf, withCurrent, addOption, removeOption, moveOption, setList, resetList, LIST_DEFS, MAX_OPTIONS } from "../src/optionLists.js";

describe("option lists", () => {
  it("defaults to the old options", () => {
    expect(listOf({}, "visitTypes")).toEqual(["New patient", "Follow-up", "Review", "Emergency"]);
    expect(listOf({ lists: { shifts: [] } }, "shifts")).toEqual(LIST_DEFS.shifts.defaults);
  });
  it("adds, rejects blanks and duplicates, and limits count", () => {
    const l = ["A"];
    expect(addOption(l, "  B  b ").list).toEqual(["A", "B b"]);
    expect(addOption(l, " ").error).toMatch(/Type/);
    expect(addOption(l, "a").error).toMatch(/already/);
    const full = Array.from({ length: MAX_OPTIONS }, (_, i) => `o${i}`);
    expect(addOption(full, "x").error).toMatch(/Up to/);
  });
  it("removes but keeps one, and reorders", () => {
    expect(removeOption(["A"], "A").error).toMatch(/at least one/);
    expect(removeOption(["A", "B"], "A").list).toEqual(["B"]);
    expect(moveOption(["A", "B", "C"], "C", -1)).toEqual(["A", "C", "B"]);
    expect(moveOption(["A", "B"], "A", -1)).toEqual(["A", "B"]);
  });
  it("saves and resets in the profile", () => {
    const p = setList({ name: "x" }, "shifts", ["Night"]);
    expect(listOf(p, "shifts")).toEqual(["Night"]);
    expect(listOf(resetList(p, "shifts"), "shifts")).toEqual(LIST_DEFS.shifts.defaults);
  });
  it("keeps a removed value selectable on old records", () => {
    expect(withCurrent(["A"], "Z")).toEqual(["Z", "A"]);
    expect(withCurrent(["A"], "A")).toEqual(["A"]);
  });
});
