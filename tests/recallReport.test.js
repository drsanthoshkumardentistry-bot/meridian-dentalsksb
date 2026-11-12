import { describe, it, expect } from "vitest";
import { recallConversion } from "../src/recallReport.js";
import { dentistEarnings } from "../src/dentistReport.js";

describe("recall conversion", () => {
  const patients = [
    { id: "p1", name: "A", lastRecallAt: "2026-11-03T05:00:00.000Z" },
    { id: "p2", name: "B", lastRecallAt: "2026-11-04T05:00:00.000Z" },
    { id: "p3", name: "C", lastRecallAt: "2026-10-04T05:00:00.000Z" },
    { id: "p4", name: "D" },
    null,
  ];
  const appts = [
    { patientId: "p1", date: "2026-11-10", status: "Completed" },
    { patientId: "p2", date: "2026-11-02", status: "Scheduled" }, // before the message
    { patientId: "p2", date: "2026-11-20", status: "Cancelled" },
    null,
  ];
  it("counts patients who booked or came after the message", () => {
    expect(recallConversion(patients, appts, "2026-11")).toEqual({ sent: 2, returned: 1, completed: 1, ratePct: 50 });
  });
  it("is empty and safe with no data", () => {
    expect(recallConversion(undefined, undefined, "2026-11")).toEqual({ sent: 0, returned: 0, completed: 0, ratePct: 0 });
  });
});

describe("no-shows by dentist", () => {
  it("counts no-shows against booked visits, ignoring cancelled", () => {
    const appts = [
      { doctor: "Dr A", date: "2026-11-02", status: "Completed" },
      { doctor: "Dr A", date: "2026-11-03", status: "No show" },
      { doctor: "Dr A", date: "2026-11-04", status: "Cancelled" },
      { doctor: "Dr A", date: "2026-10-04", status: "No show" },
      null,
    ];
    const r = dentistEarnings([], appts, "2026-11").rows[0];
    expect(r).toMatchObject({ name: "Dr A", completedVisits: 1, noShows: 1, booked: 2, noShowRate: 50 });
  });
});
