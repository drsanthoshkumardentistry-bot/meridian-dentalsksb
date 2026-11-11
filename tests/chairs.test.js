import { describe, it, expect } from "vitest";
import { chairsOf, chairNames, addChair, updateChair, removeChair, nameProblem, setProfileNote, DEFAULT_CHAIRS, MAX_CHAIRS, MAX_NOTE } from "../src/chairs.js";

describe("chairs", () => {
  it("keeps the old three names by default", () => {
    expect(chairNames({})).toEqual(["Chair 1 (Main Operatory)", "Chair 2 (Pediatric / Perio)", "Chair 3 (Prosthodontics)"]);
    expect(chairsOf({ chairs: [] })).toBe(DEFAULT_CHAIRS);
  });
  it("adds with a free name, renames, notes and removes", () => {
    let cs = [{ id: "a", name: "Chair 2", note: "" }];
    cs = addChair(cs, "b").chairs;
    expect(cs[1].name).toBe("Chair 3");
    cs = updateChair(cs, "b", { name: "Implant room", note: "x".repeat(500) });
    expect(cs[1].name).toBe("Implant room");
    expect(cs[1].note.length).toBe(MAX_NOTE);
    expect(removeChair(cs, "b").chairs.length).toBe(1);
    expect(removeChair([cs[0]], "a").error).toMatch(/at least one/);
  });
  it("limits count and rejects blank or duplicate names", () => {
    const many = Array.from({ length: MAX_CHAIRS }, (_, i) => ({ id: String(i), name: `C${i}`, note: "" }));
    expect(addChair(many, "z").error).toMatch(/Up to/);
    expect(nameProblem(many, "0", " ")).toMatch(/name/);
    expect(nameProblem(many, "0", "c1")).toMatch(/Another/);
    expect(nameProblem(many, "0", "C0")).toBe("");
  });
  it("stores a profile note", () => {
    expect(setProfileNote({ name: "A" }, "gstin", "hello").notes).toEqual({ gstin: "hello" });
  });
});
