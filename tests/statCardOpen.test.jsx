import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { StatCard } from "../src/components/DashCards.jsx";
import { buildNotifications } from "../src/notifications.js";

describe("dashboard cards open their screens", () => {
  it("is a button that opens when given onOpen", () => {
    const onOpen = vi.fn();
    render(<StatCard title="Patients" value={3} note="n" icon={<span />} onOpen={onOpen} openLabel="open patients" />);
    fireEvent.click(screen.getByRole("button", { name: "Patients: open patients" }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
  it("stays a plain card without onOpen", () => {
    render(<StatCard title="Patients" value={3} note="n" icon={<span />} />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("online booking notifications", () => {
  it("lists new online requests first and opens the diary", () => {
    const n = buildNotifications({ bookings: 2 });
    expect(n[0]).toMatchObject({ kind: "booking", to: "Appointments Diary" });
    expect(n[0].text).toContain("2 new online appointment requests");
  });
  it("uses singular wording and hides when none or no diary access", () => {
    expect(buildNotifications({ bookings: 1 })[0].text).toContain("1 new online appointment request ");
    expect(buildNotifications({ bookings: 0 })).toEqual([]);
    expect(buildNotifications({ bookings: 3, showAppointments: false })).toEqual([]);
  });
});
