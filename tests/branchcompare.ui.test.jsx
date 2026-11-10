import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import BranchCompare from "../src/components/BranchCompare.jsx";
import { branchComparison } from "../src/branchReport.js";

afterEach(cleanup);
const branches = [{ id: "main", name: "Main branch" }, { id: "br2", name: "Peelamedu" }];
const data = {
  invoices: [
    { id: "1", branchId: "main", date: "05/11/2026", totalP: 500000, payments: [{ date: "05/11/2026", mode: "Cash", amountP: 300000 }] },
    { id: "2", branchId: "br2", date: "07/11/2026", totalP: 200000, payments: [{ date: "07/11/2026", mode: "UPI", amountP: 200000 }] },
  ],
  appointments: [{ id: "a", branchId: "main", date: "2026-11-05", status: "Completed" }, { id: "b", branchId: "main", date: "2026-11-06", status: "No show" }],
  patients: [],
};

describe("BranchCompare", () => {
  it("shows each branch, its share and an all-branches total", () => {
    render(<BranchCompare cmp={branchComparison(branches, data, "2026-11")} ym="2026-11" onDownload={() => {}} />);
    const sec = within(screen.getByTestId("branch-compare"));
    expect(sec.getByText(/Main branch · highest/)).toBeTruthy();
    expect(sec.getByLabelText("Main branch received 60 percent of the money")).toBeTruthy();
    expect(sec.getByLabelText("Peelamedu received 40 percent of the money")).toBeTruthy();
    const total = sec.getByText("All branches").closest("tr");
    expect(total.textContent).toContain("5,000");
    expect(total.textContent).toContain("1 (50%)");
  });
  it("downloads the comparison", () => {
    const onDownload = vi.fn();
    render(<BranchCompare cmp={branchComparison(branches, data, "2026-11")} ym="2026-11" onDownload={onDownload} />);
    fireEvent.click(screen.getByRole("button", { name: /Branches \(spreadsheet\)/ }));
    expect(onDownload).toHaveBeenCalled();
  });
  it("is hidden for a single branch", () => {
    const { container } = render(<BranchCompare cmp={branchComparison([branches[0]], data, "2026-11")} ym="2026-11" onDownload={() => {}} />);
    expect(container.firstChild).toBeNull();
  });
});
