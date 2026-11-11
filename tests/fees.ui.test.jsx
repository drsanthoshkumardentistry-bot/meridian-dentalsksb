import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import FeeList from "../src/components/FeeList.jsx";

afterEach(cleanup);
describe("FeeList", () => {
  it("adds a fee, refuses duplicates, and removes", () => {
    const onChange = vi.fn();
    const fees = [{ id: "F1", name: "Scaling", amount: 800, taxCategory: "therapeutic" }];
    render(<FeeList fees={fees} onChange={onChange} newId={(p) => `${p}-9`} />);
    fireEvent.change(screen.getByLabelText("Procedure name"), { target: { value: "Teeth whitening" } });
    fireEvent.change(screen.getByLabelText("Fee in rupees"), { target: { value: "6000" } });
    fireEvent.change(screen.getByLabelText("Tax type"), { target: { value: "cosmetic" } });
    fireEvent.click(screen.getByText("Add"));
    expect(onChange.mock.calls[0][0].map((f) => f.name)).toEqual(["Scaling", "Teeth whitening"]);
    fireEvent.change(screen.getByLabelText("Procedure name"), { target: { value: "scaling" } });
    fireEvent.change(screen.getByLabelText("Fee in rupees"), { target: { value: "5" } });
    fireEvent.click(screen.getByText("Add"));
    expect(screen.getByRole("alert").textContent).toMatch(/already in your list/);
    fireEvent.click(screen.getByLabelText("Remove Scaling"));
    expect(onChange.mock.calls[1][0]).toEqual([]);
  });
});
