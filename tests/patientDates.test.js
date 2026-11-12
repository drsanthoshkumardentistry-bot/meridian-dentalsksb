import { describe, it, expect } from "vitest";
import { patientsInRange, presetRange, rangeText } from "../src/patientDates.js";

const now = new Date(2026, 10, 12, 12); // 12 Nov 2026
const patients = [
  { id: "P1", name: "A", registeredDate: "10/11/2026", visits: [] },
  { id: "P2", name: "B", registeredDate: "01/10/2026", visits: [{ date: "2026-11-11" }] },
  { id: "P3", name: "C", registeredDate: "01/09/2026", visits: [] },
  { id: "P4", name: "D", registeredDate: "01/09/2026", visits: [] },
];
const appointments = [
  { patientId: "P3", date: "2026-11-12", status: "Completed" },
  { patientId: "P4", date: "2026-11-13", status: "Scheduled" },
  { patientId: "P1", date: "2026-11-12", status: "Cancelled" },
];
const invoices = [{ patientId: "P1", date: "11/11/2026" }];
const ids = (list) => list.map((p) => p.id).sort();
const run = (opts) => ids(patientsInRange(patients, { appointments, invoices }, opts));

describe("patients by date", () => {
  it("returns everyone when no dates are set", () => {
    expect(run({ mode: "seen" })).toEqual(["P1", "P2", "P3", "P4"]);
  });
  it("finds patients registered in the range", () => {
    expect(run({ mode: "registered", from: "2026-11-01", to: "2026-11-30" })).toEqual(["P1"]);
    expect(run({ mode: "registered", from: "2026-09-01", to: "2026-09-01" })).toEqual(["P3", "P4"]);
  });
  it("finds patients seen: completed visits, visit notes and invoices; not booked-only or cancelled", () => {
    expect(run({ mode: "seen", from: "2026-11-11", to: "2026-11-12" })).toEqual(["P1", "P2", "P3"]);
    expect(run({ mode: "seen", from: "2026-11-13", to: "2026-11-13" })).toEqual([]);
  });
  it("finds patients booked, including future days, but not cancelled ones", () => {
    expect(run({ mode: "booked", from: "2026-11-12", to: "2026-11-13" })).toEqual(["P3", "P4"]);
  });
  it("treats a blank side as open and the ends as inclusive", () => {
    expect(run({ mode: "booked", from: "2026-11-13" })).toEqual(["P4"]);
    expect(run({ mode: "booked", to: "2026-11-12" })).toEqual(["P3"]);
  });
  it("has quick ranges and readable text", () => {
    expect(presetRange("today", now)).toEqual({ from: "2026-11-12", to: "2026-11-12" });
    expect(presetRange("week", now)).toEqual({ from: "2026-11-06", to: "2026-11-12" });
    expect(presetRange("month", now)).toEqual({ from: "2026-11-01", to: "2026-11-12" });
    expect(presetRange("tomorrow", now).from).toBe("2026-11-13");
    expect(rangeText("2026-11-01", "2026-11-12")).toBe("from 01/11/2026 to 12/11/2026");
    expect(rangeText("2026-11-12", "2026-11-12")).toBe("on 12/11/2026");
  });
});
