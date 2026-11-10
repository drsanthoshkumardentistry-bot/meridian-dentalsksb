import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import BranchesCard from "../src/components/BranchesCard.jsx";

afterEach(() => cleanup());
const branches = [{ id: "main", name: "Main" }, { id: "B2", name: "Peelamedu" }];
const data = { patients: [{ id: "p1", name: "Asha" }], appointments: [{ id: "a1", patientId: "p1", date: "2026-11-12" }], invoices: [], queue: [] };

describe("Move a patient form", () => {
  it("previews the records, asks to confirm, then hands the result to onTransfer", () => {
    const onTransfer = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<BranchesCard branches={branches} data={data} onChange={() => {}} newId={() => "x"} onTransfer={onTransfer} />);
    fireEvent.change(screen.getByLabelText("Patient to move"), { target: { value: "p1" } });
    expect(screen.getByText(/Asha has 1 appointment\(s\) and 0 invoice\(s\)/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Move to branch"), { target: { value: "B2" } });
    fireEvent.click(screen.getByText("Move patient"));
    expect(onTransfer).toHaveBeenCalledTimes(1);
    expect(onTransfer.mock.calls[0][0].patients[0].branchId).toBe("B2");
    expect(screen.getByRole("status").textContent).toMatch(/Asha moved to Peelamedu/);
  });
  it("is hidden with one branch and refuses the same branch", () => {
    const { rerender } = render(<BranchesCard branches={[branches[0]]} data={data} onChange={() => {}} newId={() => "x"} onTransfer={() => {}} />);
    expect(screen.queryByLabelText("Move a patient")).toBeNull();
    rerender(<BranchesCard branches={branches} data={data} onChange={() => {}} newId={() => "x"} onTransfer={() => {}} />);
    fireEvent.change(screen.getByLabelText("Patient to move"), { target: { value: "p1" } });
    fireEvent.change(screen.getByLabelText("Move to branch"), { target: { value: "main" } });
    fireEvent.click(screen.getByText("Move patient"));
    expect(screen.getByRole("alert").textContent).toMatch(/already in that branch/);
  });
});
