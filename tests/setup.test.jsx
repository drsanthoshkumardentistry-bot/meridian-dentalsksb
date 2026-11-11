import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { setupSteps, setupProgress } from "../src/setup.js";
import SetupChecklist from "../src/components/SetupChecklist.jsx";

afterEach(cleanup);
const full = { profile: { drName: "Dr T", state: "TN", councilRegNumber: "123", upiId: "smile@upi", fees: [{ id: "F" }], onlineBooking: true }, patients: [{}], appointments: [{}], invoices: [{}] };

describe("setup progress", () => {
  it("starts with nothing done and points at the first step", () => {
    const p = setupProgress({});
    expect(p).toMatchObject({ doneCount: 0, total: 7, complete: false });
    expect(p.next.id).toBe("profile");
  });
  it("ticks steps from real data", () => {
    const p = setupProgress({ ...full, appointments: [], invoices: [], profile: { ...full.profile, upiId: "not a upi" } });
    expect(setupSteps({ ...full, appointments: [], invoices: [], profile: { ...full.profile, upiId: "not a upi" } }).filter((s) => !s.done).map((s) => s.id)).toEqual(["upi", "appointment", "invoice"]);
    expect(p.doneCount).toBe(4);
  });
  it("is complete when everything is done", () => expect(setupProgress(full)).toMatchObject({ complete: true, next: null, doneCount: 7 }));
  it("needs all three profile fields", () => expect(setupSteps({ profile: { drName: "Dr T", state: "TN" } })[0].done).toBe(false));
});

describe("SetupChecklist", () => {
  it("shows progress, opens a step, and can be hidden", () => {
    const onGo = vi.fn(), onDismiss = vi.fn();
    render(<SetupChecklist progress={setupProgress({ patients: [{}] })} onGo={onGo} onDismiss={onDismiss} />);
    expect(screen.getByText("1 of 7 done")).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("14");
    fireEvent.click(screen.getAllByText("Open")[0]);
    expect(onGo).toHaveBeenCalledWith("Practice Profile");
    fireEvent.click(screen.getByText("Hide this list"));
    expect(onDismiss).toHaveBeenCalled();
  });
  it("renders nothing when complete or dismissed", () => {
    expect(render(<SetupChecklist progress={setupProgress(full)} />).container.innerHTML).toBe("");
    cleanup();
    expect(render(<SetupChecklist progress={setupProgress({})} dismissed />).container.innerHTML).toBe("");
  });
});
