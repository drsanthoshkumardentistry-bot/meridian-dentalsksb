import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
afterEach(cleanup);
import ExpensesCard from "../src/components/ExpensesCard.jsx";

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
