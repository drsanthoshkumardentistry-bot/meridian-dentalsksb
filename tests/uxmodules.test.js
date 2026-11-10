import { describe, it, expect } from "vitest";
import { globalSearch } from "../src/search.js";
import { patientSummary } from "../src/patientSummary.js";
import { buildVisit, sortVisits, addVisit, removeVisit } from "../src/visits.js";
import { shiftDay, dayGrid, hourMarks, SLOT_PX } from "../src/dayView.js";

const now = new Date(2026, 10, 11, 10);

describe("globalSearch", () => {
  const data = {
    patients: [
      { id: "P-1", name: "Asha Devi", phone: "9876543210" },
      { id: "P-2", name: "Ravi Kumar", phone: "9000011111" },
      { id: "P-3", name: "Meena Asha", phone: "9111122222" }
    ],
    appointments: [{ id: "A1", patientName: "Ravi Kumar", phone: "9000011111", procedure: "Scaling", date: "2026-11-12", doctor: "Dr T" }],
    invoices: [{ id: "INV/2026-27/0007", patient: "Asha Devi", treatment: "Root canal" }]
  };
  it("ignores very short queries", () => expect(globalSearch(data, "a").total).toBe(0));
  it("ranks names that start with the query first", () => {
    expect(globalSearch(data, "asha").patients.map((p) => p.id)).toEqual(["P-1", "P-3"]);
  });
  it("finds by phone digits, with or without spaces and +91", () => {
    expect(globalSearch(data, "98765").patients.map((p) => p.id)).toEqual(["P-1"]);
    expect(globalSearch(data, "+91 90000").patients.map((p) => p.id)).toEqual(["P-2"]);
  });
  it("searches appointments and invoices too", () => {
    expect(globalSearch(data, "scaling").appointments.length).toBe(1);
    expect(globalSearch(data, "0007").invoices.length).toBe(1);
    expect(globalSearch(data, "root").invoices.length).toBe(1);
  });
  it("respects the limit", () => {
    const many = { patients: Array.from({ length: 20 }, (_, i) => ({ id: `P-${i}`, name: `Sam ${i}`, phone: "" })) };
    expect(globalSearch(many, "sam", 5).patients.length).toBe(5);
  });
});

describe("patientSummary", () => {
  const patient = { id: "P-1", name: "Asha Devi", plans: [{ status: "Proposed" }, { status: "Billed" }, { status: "Approved" }], toothConditions: { 16: ["CAR"] }, visits: [{ date: "2026-10-01" }] };
  const inv = (o) => ({ id: "I", patientId: "P-1", patient: "Asha Devi", totalP: 100000, payments: [{ date: "01/11/2026", mode: "Cash", amountP: 40000 }], ...o });
  it("adds up dues, plans and next visit for the right patient only", () => {
    const s = patientSummary(
      patient,
      [inv({}), inv({ id: "J", patientId: "P-9", patient: "Other" }), inv({ id: "K", patientId: "", patient: "asha devi", totalP: 50000, payments: [] })],
      [
        { patientId: "P-1", date: "2026-11-15", time: "10:00", status: "Confirmed" },
        { patientId: "P-1", date: "2026-11-13", time: "09:00", status: "Confirmed" },
        { patientId: "P-1", date: "2026-11-12", time: "09:00", status: "Cancelled" },
        { patientId: "P-1", date: "2026-11-05", time: "09:00", status: "Completed" }
      ],
      now
    );
    expect(s.dueP).toBe(60000 + 50000);
    expect(s.invoiceCount).toBe(2);
    expect(s.nextAppt.date).toBe("2026-11-13");
    expect(s.lastVisitDate).toBe("2026-11-05");
    expect(s.plansOpen).toBe(2);
    expect(s.teethCharted).toBe(1);
  });
  it("falls back to the latest visit note and handles an empty file", () => {
    expect(patientSummary(patient, [], [], now).lastVisitDate).toBe("2026-10-01");
    expect(patientSummary({ id: "x", name: "N" }, [], [], now)).toMatchObject({ dueP: 0, nextAppt: null, lastVisitDate: "", plansOpen: 0 });
  });
});

describe("visit notes", () => {
  it("needs some content and a sensible date", () => {
    expect(buildVisit({ date: "2026-11-11" }, "v", now).ok).toBe(false);
    expect(buildVisit({ complaint: "pain", date: "2026-11-12" }, "v", now).error).toMatch(/future/);
    expect(buildVisit({ complaint: "pain", date: "11/11/2026" }, "v", now).ok).toBe(false);
  });
  it("defaults to today and trims", () => {
    const r = buildVisit({ complaint: "  pain 36 ", advice: "soft diet" }, "v", now);
    expect(r.visit).toMatchObject({ date: "2026-11-11", complaint: "pain 36", advice: "soft diet", findings: "" });
  });
  it("keeps newest first and can remove", () => {
    let p = { visits: [] };
    p = addVisit(p, { id: "a", date: "2026-11-01" });
    p = addVisit(p, { id: "b", date: "2026-11-10" });
    p = addVisit(p, { id: "c", date: "2026-11-10" });
    expect(p.visits.map((v) => v.id)).toEqual(["c", "b", "a"]);
    expect(removeVisit(p, "b").visits.map((v) => v.id)).toEqual(["c", "a"]);
    expect(sortVisits([]).length).toBe(0);
  });
});

describe("day grid", () => {
  const chairs = ["Chair 1", "Chair 2"];
  const ap = (o) => ({ id: "x", date: "2026-11-11", time: "09:00", chair: "Chair 1", status: "Confirmed", patientName: "A", ...o });
  it("shifts days across month ends", () => {
    expect(shiftDay("2026-11-30", 1)).toBe("2026-12-01");
    expect(shiftDay("2026-11-01", -1)).toBe("2026-10-31");
  });
  it("places visits per chair at the right height", () => {
    const g = dayGrid([ap({ id: "1", time: "08:00" }), ap({ id: "2", time: "10:30", chair: "Chair 2" })], "2026-11-11", chairs);
    expect(g.columns.map((c) => c.chair)).toEqual(chairs);
    expect(g.columns[0].items[0].top).toBe(0);
    expect(g.columns[1].items[0].top).toBe(5 * SLOT_PX);
    expect(g.heightPx).toBe(24 * SLOT_PX);
  });
  it("leaves out cancelled visits, reports off-hours ones, and adds unknown chairs", () => {
    const g = dayGrid([ap({ id: "1", status: "Cancelled" }), ap({ id: "2", time: "21:00" }), ap({ id: "3", chair: "Chair 9" }), ap({ date: "2026-11-12" })], "2026-11-11", chairs);
    expect(g.offHours.map((a) => a.id)).toEqual(["2"]);
    expect(g.columns.map((c) => c.chair)).toEqual([...chairs, "Chair 9"]);
    expect(g.total).toBe(2);
  });
  it("has hour marks for each opening hour", () => {
    expect(hourMarks().length).toBe(12);
  });
});
