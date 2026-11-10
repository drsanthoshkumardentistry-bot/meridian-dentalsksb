import { describe, it, expect } from "vitest";
import { licenseDays, leaveDays, buildLeave, setLeaveStatus, removeLeave, onLeaveOn, buildReview, averageRating, staffAlerts } from "../src/staff.js";

const now = new Date(2026, 10, 11, 10);
const emp = (o) => ({ id: "e1", name: "Dr Khan", active: true, ...o });

describe("licences", () => {
  it("counts days and handles missing dates", () => {
    expect(licenseDays("2026-11-21", now)).toBe(10);
    expect(licenseDays("2026-11-10", now)).toBe(-1);
    expect(licenseDays("", now)).toBeNull();
  });
});

describe("leave", () => {
  it("counts inclusive days", () => {
    expect(leaveDays({ startDate: "2026-11-12", endDate: "2026-11-14" })).toBe(3);
    expect(leaveDays({ startDate: "2026-11-12", endDate: "2026-11-12" })).toBe(1);
  });
  it("builds a pending request, defaulting the end to the start", () => {
    const r = buildLeave({ startDate: "2026-11-12", leaveType: "Vacation", reason: " trip " }, [], "L1", now);
    expect(r.ok).toBe(true);
    expect(r.leave).toMatchObject({ id: "L1", type: "Vacation", startDate: "2026-11-12", endDate: "2026-11-12", reason: "trip", status: "Pending" });
  });
  it("rejects missing or reversed dates", () => {
    expect(buildLeave({ startDate: "" }, [], "x", now).error).toMatch(/first day/);
    expect(buildLeave({ startDate: "2026-11-14", endDate: "2026-11-12" }, [], "x", now).error).toMatch(/cannot be before/);
  });
  it("refuses overlap with pending or approved leave but not rejected", () => {
    const existing = [{ id: "a", startDate: "2026-11-12", endDate: "2026-11-14", status: "Approved" }];
    expect(buildLeave({ startDate: "2026-11-14", endDate: "2026-11-16" }, existing, "x", now).ok).toBe(false);
    expect(buildLeave({ startDate: "2026-11-15", endDate: "2026-11-16" }, existing, "x", now).ok).toBe(true);
    expect(buildLeave({ startDate: "2026-11-13" }, [{ ...existing[0], status: "Rejected" }], "x", now).ok).toBe(true);
  });
  it("approves, rejects and removes", () => {
    const e = emp({ leaves: [{ id: "L1", status: "Pending" }, { id: "L2", status: "Pending" }] });
    expect(setLeaveStatus(e, "L1", "Approved").leaves.map((l) => l.status)).toEqual(["Approved", "Pending"]);
    expect(setLeaveStatus(e, "L1", "Banana")).toBe(e);
    expect(removeLeave(e, "L2").leaves.map((l) => l.id)).toEqual(["L1"]);
  });
  it("lists staff on approved leave today only", () => {
    const list = [
      emp({ id: "a", leaves: [{ id: "1", status: "Approved", startDate: "2026-11-10", endDate: "2026-11-12" }] }),
      emp({ id: "b", leaves: [{ id: "2", status: "Pending", startDate: "2026-11-10", endDate: "2026-11-12" }] }),
      emp({ id: "c", leaves: [{ id: "3", status: "Approved", startDate: "2026-11-12", endDate: "2026-11-13" }] })
    ];
    expect(onLeaveOn(list, now).map((e) => e.id)).toEqual(["a"]);
  });
});

describe("reviews", () => {
  it("validates rating and trims notes", () => {
    expect(buildReview({ rating: 0 }, "r").ok).toBe(false);
    expect(buildReview({ rating: 6 }, "r").ok).toBe(false);
    expect(buildReview({ rating: 4, notes: " punctual ", reviewer: "Dr T", date: "2026-11-11" }, "r").review).toMatchObject({ rating: 4, notes: "punctual" });
  });
  it("averages ratings", () => {
    expect(averageRating(emp({ reviews: [{ rating: 4 }, { rating: 5 }, { rating: 5 }] }))).toBe(4.7);
    expect(averageRating(emp({}))).toBeNull();
  });
});

describe("alerts", () => {
  it("raises real alerts only, expired first, and skips inactive staff", () => {
    const list = [
      emp({ id: "a", name: "Dr Khan", licenseExpiry: "2026-12-01" }),
      emp({ id: "b", name: "Ms Rao", licenseExpiry: "2026-11-01" }),
      emp({ id: "c", name: "Mr Das", licenseExpiry: "2030-01-01", leaves: [{ id: "1", status: "Pending" }] }),
      emp({ id: "d", name: "Gone", active: false, licenseExpiry: "2020-01-01" })
    ];
    const a = staffAlerts(list, now);
    expect(a.map((x) => x.text)).toEqual([
      "Ms Rao's licence expired 10 days ago",
      "Dr Khan's licence expires in 20 days",
      "Mr Das has 1 leave request waiting for a decision"
    ]);
  });
  it("is empty when nothing is wrong", () => {
    expect(staffAlerts([emp({ licenseExpiry: "2030-01-01" })], now)).toEqual([]);
    expect(staffAlerts([], now)).toEqual([]);
  });
});
