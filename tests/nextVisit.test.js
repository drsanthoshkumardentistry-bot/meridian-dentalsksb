import { describe, it, expect } from "vitest";
import { dueNextVisits, buildNextVisitMessage, markNextVisitReminded, nextVisitFrom } from "../src/nextVisit.js";
import { buildVisit } from "../src/visits.js";

const now = new Date(2026, 10, 12, 12); // 12 Nov 2026
const pat = (visit = {}, o = {}) => ({ id: "P1", name: "Asha", phone: "9876543210", visits: [{ id: "V1", date: "2026-11-05", nextVisit: "Obturation", nextVisitOn: "2026-11-13", ...visit }], ...o });

describe("next-visit reminders", () => {
  it("lists a patient whose date is within two days, or missed", () => {
    expect(dueNextVisits([pat()], [], now)).toHaveLength(1);
    expect(dueNextVisits([pat({ nextVisitOn: "2026-11-09" })], [], now)[0].daysLate).toBe(3);
  });
  it("skips far dates, long-missed ones, and visits without a date", () => {
    expect(dueNextVisits([pat({ nextVisitOn: "2026-11-20" })], [], now)).toHaveLength(0);
    expect(dueNextVisits([pat({ nextVisitOn: "2026-09-01" })], [], now)).toHaveLength(0);
    expect(dueNextVisits([pat({ nextVisitOn: "" })], [], now)).toHaveLength(0);
  });
  it("skips booked, returned, opted-out, bad number and recently reminded", () => {
    expect(dueNextVisits([pat()], [{ patientId: "P1", date: "2026-11-14", status: "Scheduled" }], now)).toHaveLength(0);
    expect(dueNextVisits([pat()], [{ patientId: "P1", date: "2026-11-10", status: "Completed" }], now)).toHaveLength(0);
    expect(dueNextVisits([pat({}, { consent: { whatsapp: false } })], [], now)).toHaveLength(0);
    expect(dueNextVisits([pat({}, { phone: "12" })], [], now)).toHaveLength(0);
    expect(dueNextVisits([pat({ nextRemindedAt: "2026-11-10T00:00:00Z" })], [], now)).toHaveLength(0);
  });
  it("only looks at the newest visit note", () => {
    const p = pat();
    p.visits.unshift({ id: "V2", date: "2026-11-10", nextVisitOn: "" });
    expect(dueNextVisits([p], [], now)).toHaveLength(0);
  });
  it("writes a message and marks it sent", () => {
    const p = pat();
    const msg = buildNextVisitMessage({ clinicName: "Smile", clinicPhone: "9000000000", patient: p, visit: p.visits[0], formatDate: () => "13 Nov 2026" });
    expect(msg).toContain("13 Nov 2026");
    expect(msg).toContain("Obturation");
    expect(markNextVisitReminded(p, "V1", now).visits[0].nextRemindedAt).toBeTruthy();
  });
  it("adds days to a visit date and validates the new field", () => {
    expect(nextVisitFrom("2026-11-05", 7)).toBe("2026-11-12");
    expect(buildVisit({ treatment: "RCT", date: "2026-11-05", nextVisitOn: "2026-11-12" }, "V", now).visit.nextVisitOn).toBe("2026-11-12");
    expect(buildVisit({ treatment: "RCT", date: "2026-11-05", nextVisitOn: "2026-11-01" }, "V", now).ok).toBe(false);
  });
});
