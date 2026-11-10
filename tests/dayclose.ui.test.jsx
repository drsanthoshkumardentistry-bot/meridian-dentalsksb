import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import DayClose from "../src/components/DayClose.jsx";
import BirthdayPanel from "../src/components/BirthdayPanel.jsx";
import { dayClose } from "../src/dayClose.js";

afterEach(cleanup);
const now = new Date(2026, 10, 11, 18);
const summary = dayClose({ invoices: [{ id: "I", patient: "A", date: "11/11/2026", totalP: 100000, items: [], payments: [{ date: "11/11/2026", mode: "Cash", amountP: 100000 }] }] }, now);

describe("DayClose", () => {
  it("shows the money and checks counted cash", () => {
    const onCopy = vi.fn();
    render(<DayClose summary={summary} clinicName="Smile Care" onCopy={onCopy} />);
    expect(screen.getByText("₹1,000.00", { selector: ".text-emerald-700" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Cash counted (₹)"), { target: { value: "900" } });
    expect(screen.getByRole("status").textContent).toBe("₹100.00 short");
    fireEvent.change(screen.getByLabelText("Cash counted (₹)"), { target: { value: "1000" } });
    expect(screen.getByRole("status").textContent).toBe("Matches the invoices");
    fireEvent.click(screen.getByText("Copy summary"));
    expect(onCopy.mock.calls[0][0]).toContain("Cash: expected ₹1,000.00, counted ₹1,000.00, matches");
  });
});
describe("BirthdayPanel", () => {
  it("lists birthdays, sends once per tap, and hides when empty or read-only", () => {
    const onGreet = vi.fn();
    const due = [{ patient: { id: "P1", name: "Asha" }, age: 36 }];
    render(<BirthdayPanel due={due} onGreet={onGreet} />);
    fireEvent.click(screen.getByText("Send wishes"));
    expect(onGreet).toHaveBeenCalledWith(due[0].patient);
    expect(screen.getByText(/turns 36/)).toBeTruthy();
    cleanup();
    render(<BirthdayPanel due={due} onGreet={onGreet} canWrite={false} />);
    expect(screen.queryByText("Send wishes")).toBeNull();
    cleanup();
    expect(render(<BirthdayPanel due={[]} onGreet={onGreet} />).container.innerHTML).toBe("");
  });
});
