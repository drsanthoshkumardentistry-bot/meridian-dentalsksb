import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
afterEach(cleanup);
import ExpensesCard from "../src/components/ExpensesCard.jsx";
import ClaimModal from "../src/components/ClaimModal.jsx";
import { computeLineItemTotals } from "../src/billing.js";

const exp = [{ id: "a", date: "2026-11-02", category: "Rent", amountP: 1000000, mode: "Cash", note: "Nov rent" }];

describe("ExpensesCard", () => {
  it("shows profit and lets an owner add and delete", () => {
    const onAdd = vi.fn(() => ""); const onRemove = vi.fn();
    render(<ExpensesCard expenses={exp} invoices={[]} ym="2026-11" canEdit onAdd={onAdd} onRemove={onRemove} onDownload={() => {}} />);
    expect(screen.getByText("Loss")).toBeTruthy();
    expect(screen.getByTestId("profit-value").textContent).toContain("10,000");
    fireEvent.change(screen.getByLabelText(/Amount/), { target: { value: "500" } });
    fireEvent.click(screen.getByText("Add expense"));
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ amount: "500" }));
    fireEvent.click(screen.getByLabelText(/Delete Rent expense/));
    expect(onRemove).toHaveBeenCalledWith("a");
  });
  it("shows a validation message and hides the form for read-only roles", () => {
    const { rerender } = render(<ExpensesCard expenses={[]} invoices={[]} ym="2026-11" canEdit onAdd={() => "Enter an amount greater than zero"} onRemove={() => {}} onDownload={() => {}} />);
    fireEvent.click(screen.getByText("Add expense"));
    expect(screen.getByRole("alert").textContent).toMatch(/amount/);
    rerender(<ExpensesCard expenses={exp} invoices={[]} ym="2026-11" canEdit={false} onAdd={() => ""} onRemove={() => {}} onDownload={() => {}} />);
    expect(screen.queryByText("Add expense")).toBeNull();
    expect(screen.queryByLabelText(/Delete Rent/)).toBeNull();
  });
});

describe("ClaimModal", () => {
  const { lines, exemptP, taxableGstP, ...t } = computeLineItemTotals({ items: [{ description: "RCT", amount: 8000, taxCategory: "therapeutic" }] });
  const inv = { id: "INV/9", patient: "Asha", ...t, payments: [], date: "1/1/2026" };
  it("saves a claim and reports errors", () => {
    const onSave = vi.fn();
    render(<ClaimModal invoice={inv} onClose={() => {}} onSave={onSave} />);
    fireEvent.click(screen.getByText("Save claim"));
    expect(screen.getByRole("alert").textContent).toMatch(/insurer/i);
    fireEvent.change(screen.getByPlaceholderText(/Star Health/), { target: { value: "Star Health" } });
    fireEvent.click(screen.getByText("Save claim"));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0].claim).toMatchObject({ insurer: "Star Health", status: "Submitted", amountP: 800000 });
  });
  it("shows a settled claim as read only", () => {
    render(<ClaimModal invoice={{ ...inv, claim: { insurer: "Niva", claimNo: "9", amountP: 100, status: "Settled", settledP: 100 } }} onClose={() => {}} onSave={() => {}} />);
    expect(screen.getByText(/Settled by Niva/)).toBeTruthy();
    expect(screen.queryByText("Save claim")).toBeNull();
  });
});
