import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import TodayDesk from "../src/components/TodayDesk.jsx";
import { NAV_BY_ROLE } from "../src/roles.js";
const summary = { appts: [{ id: "1", time: "10:30", patientName: "Ravi", status: "Confirmed" }], upcomingCount: 1, doneCount: 0, unpaidCount: 0, unpaidP: 0, overdue: [], leadsDue: [], expiring: [] };
describe("Today inside the diary", () => {
  afterEach(cleanup);
  it("embedded desk shows as a section, without the duplicate Open diary link", () => {
    render(<TodayDesk embedded summary={summary} onGo={() => {}} />);
    expect(screen.getByRole("heading", { name: "Today at the desk" })).toBeTruthy();
    expect(screen.queryByText("Open diary")).toBeNull();
  });
  it("no role has a separate Today screen", () => {
    Object.values(NAV_BY_ROLE).filter(Boolean).forEach((l) => expect(l).not.toContain("Today"));
  });
});
