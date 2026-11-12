import { describe, it, expect } from "vitest";
import { profileGaps } from "../src/profileGaps.js";
describe("profileGaps", () => {
  it("names what is missing", () => {
    expect(profileGaps({ drName: "A", state: "", councilRegNumber: "  " })).toEqual(["state", "Dental Council registration number"]);
    expect(profileGaps()).toHaveLength(3);
    expect(profileGaps({ drName: "A", state: "TN", councilRegNumber: "123" })).toEqual([]);
  });
});
