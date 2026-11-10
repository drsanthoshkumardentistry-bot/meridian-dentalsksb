import { describe, it, expect } from "vitest";
import { findClash, needsUpdate, diarySummary, diaryView, withStatus } from "../src/diary.js";

const now = new Date(2026, 10, 11, 10); // 2026-11-11
const ap = (o) => ({ id: "a", patientName: "Asha", phone: "9876543210", date: "2026-11-11", time: "10:30", chair: "Chair 1", doctor: "Dr A", procedure: "Scaling", status: "Confirmed", ...o });

describe("double booking", () => {
  const book = [ap({ id: "x" })];
  it("flags the same chair within a slot", () => {
    expect(findClash(book, ap({ id: "n", time: "10:45", doctor: "Dr B" }))).toMatchObject({ reason: "chair" });
    expect(findClash(book, ap({ id: "n", time: "10:15", doctor: "Dr B" }))).toMatchObject({ reason: "chair" });
  });
  it("allows a full slot apart, another day, or another chair and doctor", () => {
    expect(findClash(book, ap({ time: "11:00", doctor: "Dr B" }))).toBeNull();
    expect(findClash(book, ap({ date: "2026-11-12" }))).toBeNull();
    expect(findClash(book, ap({ chair: "Chair 2", doctor: "Dr B" }))).toBeNull();
  });
  it("flags the same doctor on a different chair", () => {
    expect(findClash(book, ap({ chair: "Chair 2" }))).toMatchObject({ reason: "doctor" });
  });
  it("ignores cancelled, completed and no-show bookings", () => {
    ["Cancelled", "Completed", "No show"].forEach((status) => expect(findClash([ap({ status })], ap({}))).toBeNull());
  });
});

describe("diary views", () => {
  const list = [
    ap({ id: "past-open", date: "2026-11-09" }),
    ap({ id: "past-done", date: "2026-11-08", status: "Completed" }),
    ap({ id: "t-late", time: "16:00" }),
    ap({ id: "t-early", time: "09:00" }),
    ap({ id: "tom", date: "2026-11-12" }),
    ap({ id: "tom-cancel", date: "2026-11-12", status: "Cancelled" }),
    ap({ id: "later", date: "2026-11-20" })
  ];
  it("summarises", () => {
    expect(diarySummary(list, now)).toEqual({ today: 2, tomorrow: 1, upcoming: 2, needsUpdate: 1 });
  });
  it("shows today in time order", () => {
    expect(diaryView(list, { view: "today" }, now).map((a) => a.id)).toEqual(["t-early", "t-late"]);
  });
  it("shows upcoming active visits soonest first, without cancelled ones", () => {
    expect(diaryView(list, { view: "upcoming" }, now).map((a) => a.id)).toEqual(["t-early", "t-late", "tom", "later"]);
  });
  it("shows past and cancelled newest first, and visits that need a status", () => {
    expect(diaryView(list, { view: "past" }, now).map((a) => a.id)).toEqual(["tom-cancel", "past-open", "past-done"]);
    expect(diaryView(list, { view: "update" }, now).map((a) => a.id)).toEqual(["past-open"]);
    expect(needsUpdate(list[0], now)).toBe(true);
  });
  it("searches by patient, phone, procedure and doctor", () => {
    expect(diaryView([ap({ patientName: "Ravi" }), ap({ id: "b" })], { view: "all", query: "ravi" }, now).length).toBe(1);
  });
});

describe("status", () => {
  it("accepts only known statuses", () => {
    expect(withStatus(ap({}), "No show").status).toBe("No show");
    expect(withStatus(ap({}), "Banana").status).toBe("Confirmed");
  });
});
