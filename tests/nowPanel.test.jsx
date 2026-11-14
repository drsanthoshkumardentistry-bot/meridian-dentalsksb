import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
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
  it("is shown on every screen size and hides New when booking is not allowed", () => {
    render(<NowStrip onGo={() => {}} canBook={false} />);
    expect(screen.getByTestId("now-strip").className).not.toMatch(/xl:hidden/);
    expect(screen.queryByRole("button", { name: /New/ })).toBeNull();
  });
});
