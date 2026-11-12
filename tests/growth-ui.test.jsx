import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import Growth from "../src/components/Growth.jsx";

afterEach(cleanup);
const base = () => ({ showToast: vi.fn(), newId: (p) => `${p}1`, onPlans: vi.fn(), onSell: vi.fn(), onLeads: vi.fn() });

describe("Growth", () => {
  it("adds a plan", () => {
    const p = base();
    render(<Growth {...p} plans={[]} canEditPlans patients={[]} />);
    fireEvent.change(screen.getByLabelText("Plan name"), { target: { value: "Gold" } });
    fireEvent.change(screen.getByLabelText("Price (₹)"), { target: { value: "1500" } });
    fireEvent.click(screen.getByRole("button", { name: "Add plan" }));
    expect(p.onPlans).toHaveBeenCalledWith([expect.objectContaining({ name: "Gold", priceP: 150000, months: 12 })]);
  });
  it("sells a membership", () => {
    const p = base();
    const plan = { id: "MP1", name: "Gold", priceP: 150000, months: 12, discountPct: 10, perks: "" };
    render(<Growth {...p} plans={[plan]} patients={[{ id: "P1", name: "Asha", phone: "9876543210" }]} />);
    fireEvent.change(screen.getByLabelText("Patient"), { target: { value: "P1" } });
    fireEvent.change(screen.getByLabelText("Plan"), { target: { value: "MP1" } });
    fireEvent.click(screen.getByRole("button", { name: "Record membership" }));
    expect(p.onSell).toHaveBeenCalledWith(expect.objectContaining({ patientId: "P1", planName: "Gold", paidP: 150000 }), { invoice: true });
  });
  it("adds a lead and changes its status", () => {
    const p = base();
    const { rerender } = render(<Growth {...p} patients={[]} leads={[]} />);
    fireEvent.click(screen.getByRole("tab", { name: "Leads" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Ravi" } });
    fireEvent.change(screen.getByLabelText("Mobile"), { target: { value: "9876543210" } });
    fireEvent.click(screen.getByRole("button", { name: "Add lead" }));
    const lead = p.onLeads.mock.calls[0][0][0];
    expect(lead).toMatchObject({ name: "Ravi", status: "New" });
    rerender(<Growth {...p} patients={[]} leads={[lead]} />);
    fireEvent.change(screen.getByLabelText("Status for Ravi"), { target: { value: "Booked" } });
    expect(p.onLeads.mock.calls[1][0][0].status).toBe("Booked");
  });
  it("offers to make a lead a patient", () => {
    const p = base();
    const onConvertLead = vi.fn();
    const lead = { id: "L1", name: "Ravi", phone: "9876543210", source: "Walk-in", status: "New", createdAt: "2026-11-12" };
    render(<Growth {...p} patients={[]} leads={[lead]} onConvertLead={onConvertLead} />);
    fireEvent.click(screen.getByRole("tab", { name: "Leads" }));
    fireEvent.click(screen.getByRole("button", { name: "Make Ravi a patient" }));
    expect(onConvertLead).toHaveBeenCalledWith(lead);
  });
  it("hides add forms for read-only users", () => {
    render(<Growth {...base()} plans={[]} canEdit={false} canEditPlans={false} patients={[]} />);
    expect(screen.queryByRole("button", { name: "Record membership" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Add plan" })).toBeNull();
  });
});
