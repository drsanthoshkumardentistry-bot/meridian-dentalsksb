import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import NowPanel from "../src/components/NowPanel.jsx";
describe("NowPanel", () => {
  afterEach(cleanup);
  it("shows the next patient, alerts and books", () => {
    const onGo = vi.fn(); const onNew = vi.fn();
    render(<NowPanel next={{ patientName: "Ravi", time: "17:00", procedure: "RCT" }} alerts={[{ text: "2 overdue bills", to: "Billing & Invoices", tone: "red" }]} onGo={onGo} onNewAppointment={onNew} />);
    expect(screen.getByText("Ravi")).toBeTruthy();
    fireEvent.click(screen.getByText("2 overdue bills"));
    expect(onGo).toHaveBeenCalledWith("Billing & Invoices");
    fireEvent.click(screen.getByRole("button", { name: /New appointment/ }));
    expect(onNew).toHaveBeenCalled();
  });
  it("handles empty and read-only", () => {
    render(<NowPanel onGo={() => {}} canBook={false} />);
    expect(screen.getByText("No visits coming up today.")).toBeTruthy();
    expect(screen.getByText("All clear.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /New appointment/ })).toBeNull();
  });
});

import { NowStrip } from "../src/components/NowPanel.jsx";
describe("NowStrip", () => {
  afterEach(cleanup);
  it("shows next patient, alert chips and New", () => {
    const onGo = vi.fn(); const onNew = vi.fn();
    render(<NowStrip next={{ patientName: "Ravi", time: "17:00" }} alerts={[{ text: "3 items to reorder", to: "Stock Maintenance", tone: "red" }]} onGo={onGo} onNewAppointment={onNew} />);
    fireEvent.click(screen.getByText("3 items to reorder"));
    expect(onGo).toHaveBeenCalledWith("Stock Maintenance");
    fireEvent.click(screen.getByRole("button", { name: /New/ }));
    expect(onNew).toHaveBeenCalled();
  });
});
