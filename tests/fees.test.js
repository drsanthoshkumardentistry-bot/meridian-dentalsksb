import { describe, it, expect } from "vitest";
import { buildFee, sortedFees, findFee, applyFee, MAX_FEES } from "../src/fees.js";

const fees = [{ id: "F2", name: "Root canal treatment", amount: 4500, taxCategory: "therapeutic" }, { id: "F1", name: "Teeth whitening", amount: 6000, taxCategory: "cosmetic" }];

describe("fees", () => {
  it("validates the add form", () => {
    expect(buildFee({ name: "  Scaling   and polishing ", amount: "800" }, [], "F3").fee).toEqual({ id: "F3", name: "Scaling and polishing", amount: 800, taxCategory: "therapeutic" });
    expect(buildFee({ name: "", amount: "5" }, [], "x").error).toMatch(/name/);
    expect(buildFee({ name: "A", amount: "" }, [], "x").error).toMatch(/fee/);
    expect(buildFee({ name: "A", amount: "0" }, [], "x").error).toMatch(/more than zero/);
    expect(buildFee({ name: "A", amount: "-4" }, [], "x").error).toMatch(/more than zero/);
    expect(buildFee({ name: "A", amount: "99999999" }, [], "x").error).toMatch(/too large/);
    expect(buildFee({ name: "root CANAL treatment", amount: "1" }, fees, "x").error).toMatch(/already/);
    expect(buildFee({ name: "A", amount: "1", taxCategory: "weird" }, [], "x").fee.taxCategory).toBe("therapeutic");
    expect(buildFee({ name: "A", amount: "1" }, Array.from({ length: MAX_FEES }, (_, i) => ({ id: i, name: `n${i}` })), "x").error).toMatch(/up to/);
  });
  it("sorts by name and drops unreadable entries", () => {
    expect(sortedFees([...fees, null, { id: "z", name: "", amount: 5 }, { id: "y", name: "Free", amount: 0 }]).map((f) => f.id)).toEqual(["F2", "F1"]);
    expect(sortedFees(undefined)).toEqual([]);
  });
  it("finds a fee ignoring case and spacing", () => {
    expect(findFee(fees, "  ROOT canal   treatment ").id).toBe("F2");
    expect(findFee(fees, "root")).toBeNull();
    expect(findFee(fees, "")).toBeNull();
  });
  it("fills the amount and tax type only while the amount is empty", () => {
    const blank = { id: "L", description: "", amount: "", taxCategory: "therapeutic" };
    expect(applyFee(blank, fees, "Teeth whitening")).toMatchObject({ description: "Teeth whitening", amount: "6000", taxCategory: "cosmetic" });
    expect(applyFee({ ...blank, amount: "5000" }, fees, "Teeth whitening").amount).toBe("5000");
    expect(applyFee(blank, fees, "Teeth wh")).toMatchObject({ description: "Teeth wh", amount: "" });
    expect(applyFee(blank, undefined, "Anything").amount).toBe("");
  });
});
