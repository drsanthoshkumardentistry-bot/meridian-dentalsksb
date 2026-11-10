import { describe, it, expect } from "vitest";
import { isBirthdayToday, dueBirthdays, buildBirthdayMessage, markGreeted } from "../src/greetings.js";

const on = (y, m, d) => new Date(y, m - 1, d, 9);
const p = (o) => ({ id: "P", name: "Asha Devi", phone: "9876543210", dob: "1990-11-11", ...o });

describe("birthdays", () => {
  it("matches month and day, not year, and rejects bad dates", () => {
    expect(isBirthdayToday("1990-11-11", on(2026, 11, 11))).toBe(true);
    expect(isBirthdayToday("1990-11-12", on(2026, 11, 11))).toBe(false);
    expect(isBirthdayToday("2030-11-11", on(2026, 11, 11))).toBe(false);
    for (const bad of ["", null, "11/11/1990", "1990-13-40", "1990-02-30", "1800-11-11"]) expect(isBirthdayToday(bad, on(2026, 11, 11))).toBe(false);
  });
  it("celebrates 29 February on 28 February in common years only", () => {
    expect(isBirthdayToday("2000-02-29", on(2027, 2, 28))).toBe(true);
    expect(isBirthdayToday("2000-02-29", on(2027, 3, 1))).toBe(false);
    expect(isBirthdayToday("2000-02-29", on(2028, 2, 28))).toBe(false);
    expect(isBirthdayToday("2000-02-29", on(2028, 2, 29))).toBe(true);
  });
  it("lists only patients who agreed, have a valid number and were not greeted this year", () => {
    const list = [p({ id: "1" }), p({ id: "2", consent: { whatsapp: false } }), p({ id: "3", phone: "123" }), p({ id: "4", lastGreetedAt: "2026-11-11T05:00:00Z" }), p({ id: "5", lastGreetedAt: "2025-11-11T05:00:00Z", name: "Zed" })];
    const due = dueBirthdays(list, on(2026, 11, 11));
    expect(due.map((d) => d.patient.id)).toEqual(["1", "5"]);
    expect(due[0].age).toBe(36);
  });
  it("greets by first name from the clinic and records it", () => {
    const m = buildBirthdayMessage({ clinicName: "Smile Care", patient: p() });
    expect(m).toContain("Happy birthday, Asha!");
    expect(m).toContain("Smile Care");
    expect(markGreeted(p(), on(2026, 11, 11)).lastGreetedAt).toMatch(/^2026-11-1/);
    expect(buildBirthdayMessage({ patient: { name: "" } })).toContain("Happy birthday, there!");
  });
});
