import { describe, it, expect } from "vitest";
import { buildArchive, recordDate, archiveFileName } from "../src/portability.js";
describe("archive of old records", () => {
  const now = new Date(2026, 10, 19);
  const data = {
    patients: [{ id: "p1", name: "A" }, { id: "p2", name: "B" }],
    invoices: [{ id: "i1", date: "10/03/2023", patientId: "p1" }, { id: "i2", date: "01/10/2026", patientId: "p2" }],
    appointments: [{ id: "a1", date: "2022-05-01", patientId: "p1" }, { id: "a2", date: "2026-11-01", patientId: "p2" }]
  };
  it("reads both date styles", () => {
    expect(recordDate("10/03/2023").getMonth()).toBe(2);
    expect(recordDate("2022-05-01").getFullYear()).toBe(2022);
    expect(recordDate("junk")).toBeNull();
  });
  it("keeps only records older than the cutoff, and deletes nothing", () => {
    const a = buildArchive(data, 2, now);
    expect(a.kind).toBe("archive");
    expect(a.data.invoices.map((i) => i.id)).toEqual(["i1"]);
    expect(a.data.appointments.map((i) => i.id)).toEqual(["a1"]);
    expect(a.data.patients.map((p) => p.id)).toEqual(["p1"]);
    expect(data.invoices.length).toBe(2);
    expect(archiveFileName(a, now)).toContain("2024-11-19");
  });
});
