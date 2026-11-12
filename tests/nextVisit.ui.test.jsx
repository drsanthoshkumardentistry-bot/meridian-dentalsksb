import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NextVisitPanel } from "../src/components/FollowUpPanels.jsx";

const item = { patient: { id: "P1", name: "Asha" }, visit: { id: "V1", nextVisit: "Obturation" }, daysLate: 2 };

describe("NextVisitPanel", () => {
  it("shows who is overdue and sends a reminder", () => {
    const onRemind = vi.fn();
    render(<NextVisitPanel items={[item]} onRemind={onRemind} onSnooze={() => {}} />);
    expect(screen.getByText(/2 days overdue/)).toBeTruthy();
    fireEvent.click(screen.getByText("Remind"));
    expect(onRemind).toHaveBeenCalledWith(item);
  });
  it("shows nothing when nobody is due", () => {
    const { container } = render(<NextVisitPanel items={[]} onRemind={() => {}} onSnooze={() => {}} />);
    expect(container.firstChild).toBeNull();
  });
});
