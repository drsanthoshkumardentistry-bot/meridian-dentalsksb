import { describe, it, expect } from "vitest";
import { rangeProblem, windowFor } from "../src/dateRange.js";
import { validateBookingRequest } from "../src/booking.js";

const now = new Date(2026, 10, 15, 12);
describe("sensible appointment dates", () => {
  it("accepts today, last month and next year", () => {
    for (const d of ["2026-11-15", "2026-10-15", "2027-11-15"]) expect(rangeProblem(d, now)).toBe("");
  });
  it("rejects year 1900 and year 9999 and anything far away", () => {
    expect(rangeProblem("1900-01-01", now)).toMatch(/past/);
    expect(rangeProblem("9999-12-31", now)).toMatch(/ahead/);
    expect(rangeProblem("2020-06-01", now)).toMatch(/past/);
    expect(rangeProblem("2030-01-01", now)).toMatch(/ahead/);
  });
  it("ignores empty or odd input (other checks handle those)", () => {
    for (const d of ["", null, undefined, "garbage"]) expect(rangeProblem(d, now)).toBe("");
  });
  it("window edges are inclusive", () => {
    const w = windowFor(now);
    expect(rangeProblem(w.min, now)).toBe("");
    expect(rangeProblem(w.maxAhead, now)).toBe("");
  });
  it("online booking: a date more than a year away is refused", () => {
    const f = (date) => validateBookingRequest({ name: "Asha K", phone: "9876543210", date, slot: "Morning" }, now);
    expect(f("2027-11-10").ok).toBe(true);
    expect(f("9999-12-31")).toMatchObject({ ok: false, error: /within the next year/ });
  });
});
