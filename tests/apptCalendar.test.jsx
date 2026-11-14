import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ApptCalendar from "../src/components/ApptCalendar.jsx";
import { monthGrid, countsByDate, shiftMonth } from "../src/calendar.js";

afterEach(cleanup);
const now = new Date(2026, 10, 14, 10);
const appts = [
  { id: "1", date: "2026-11-14", status: "Confirmed" }, { id: "2", date: "2026-11-14" },
  { id: "3", date: "2026-11-20", status: "Cancelled" }, { id: "4", date: "2026-11-25", status: "Completed" },
];

describe("calendar helpers", () => {
  it("counts visits per day and skips cancelled", () => {
    expect(countsByDate(appts)).toEqual({ "2026-11-14": 2, "2026-11-25": 1 });
    expect(countsByDate([null, {}, undefined])).toEqual({});
  });
  it("builds Monday-first full weeks with today marked", () => {
    const w = monthGrid(appts, 2026, 10, now); // Nov 2026 starts on a Sunday
    expect(w.every((r) => r.length === 7)).toBe(true);
    expect(w[0][6]).toMatchObject({ date: "2026-11-01", inMonth: true });
    expect(w[0][0].inMonth).toBe(false);
    const cells = w.flat();
    expect(cells.filter((c) => c.today).map((c) => c.date)).toEqual(["2026-11-14"]);
    expect(cells.find((c) => c.date === "2026-11-14").count).toBe(2);
    expect(cells.filter((c) => c.inMonth)).toHaveLength(30);
  });
  it("moves months across years", () => {
    expect(shiftMonth({ year: 2026, month: 11 }, 1)).toEqual({ year: 2027, month: 0 });
    expect(shiftMonth({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 });
  });
});

describe("ApptCalendar", () => {
  it("opens, shows counts, and picks a date", () => {
    const onPick = vi.fn();
    render(<ApptCalendar appointments={appts} onPick={onPick} now={now} />);
    fireEvent.click(screen.getByRole("button", { name: "Appointment calendar" }));
    expect(screen.getByText("November 2026")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "2026-11-14, 2 visits" }));
    expect(onPick).toHaveBeenCalledWith("2026-11-14");
    expect(screen.queryByTestId("appt-calendar")).toBeNull();
  });
  it("changes month and closes on Escape", () => {
    render(<ApptCalendar appointments={appts} onPick={vi.fn()} now={now} />);
    fireEvent.click(screen.getByRole("button", { name: "Appointment calendar" }));
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByText("December 2026")).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("appt-calendar")).toBeNull();
  });
});
