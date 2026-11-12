import { describe, it, expect } from "vitest";
import { DEFAULT_MEDICINES, medicinesOf, cleanMedicine, upsertMedicine, removeMedicine, resetMedicines, prescriptionLine } from "../src/medicines.js";

const ids = () => "m-new";

describe("clinic medicine list", () => {
  it("starts with the standard list and uses the clinic's own once saved", () => {
    expect(medicinesOf({})).toBe(DEFAULT_MEDICINES);
    expect(medicinesOf({ medicines: [] })).toEqual([]);
  });
  it("needs a name, how often and how long, and tidies the rest", () => {
    expect(cleanMedicine({ name: "", frequency: "1-0-1", duration: "3 Days" }).ok).toBe(false);
    expect(cleanMedicine({ name: "X", frequency: "", duration: "3 Days" }).ok).toBe(false);
    expect(cleanMedicine({ name: "X", frequency: "1-0-1", duration: "" }).ok).toBe(false);
    const r = cleanMedicine({ name: "  Dolo   650 ", frequency: "SOS", duration: "2 Days" });
    expect(r.med.name).toBe("Dolo 650");
    expect(r.med.dosage).toBe("1 Tab");
  });
  it("adds, edits and rejects a duplicate name", () => {
    const med = cleanMedicine({ name: "Dolo 650", frequency: "SOS", duration: "2 Days" }).med;
    const added = upsertMedicine({}, med, ids);
    expect(added.profile.medicines).toHaveLength(DEFAULT_MEDICINES.length + 1);
    expect(upsertMedicine(added.profile, { ...med, id: "" }, ids).error).toMatch(/already/);
    const edited = upsertMedicine(added.profile, { ...added.med, duration: "5 Days" }, ids);
    expect(edited.profile.medicines.find((m) => m.id === "m-new").duration).toBe("5 Days");
    expect(edited.profile.medicines).toHaveLength(DEFAULT_MEDICINES.length + 1);
  });
  it("removes one and resets to standard", () => {
    const p = removeMedicine({}, "m-zerodol");
    expect(p.medicines.some((m) => m.id === "m-zerodol")).toBe(false);
    expect(medicinesOf(resetMedicines(p))).toBe(DEFAULT_MEDICINES);
  });
  it("copies values into a prescription line", () => {
    const line = prescriptionLine(DEFAULT_MEDICINES[0], 5);
    expect(line).toMatchObject({ id: 5, drug: "Zerodol-SP", frequency: "1-0-1", instruction: "After Food" });
  });
});
