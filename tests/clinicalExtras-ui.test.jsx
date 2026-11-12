import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import PerioChart from "../src/components/PerioChart.jsx";
import InstalmentPlan from "../src/components/InstalmentPlan.jsx";
import CertificatePanel from "../src/components/CertificatePanel.jsx";

afterEach(cleanup);

describe("PerioChart", () => {
  it("enters depths, shows the summary and saves", () => {
    const onSave = vi.fn(); const showToast = vi.fn();
    render(<PerioChart exams={[]} onSave={onSave} newId={() => "PE1"} today="2026-11-12" showToast={showToast} />);
    fireEvent.click(screen.getByRole("button", { name: "Save exam" }) );
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Tooth 16 MB"), { target: { value: "6" } });
    fireEvent.change(screen.getByLabelText("Tooth 16 B"), { target: { value: "3" } });
    fireEvent.click(screen.getByLabelText("Tooth 16 bleeding"));
    expect(screen.getByTestId("perio-summary").textContent).toContain("6 mm");
    fireEvent.click(screen.getByRole("button", { name: "Save exam" }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0][0].teeth["16"].pd[2]).toBe(6);
  });
  it("is read only without write access", () => {
    render(<PerioChart exams={[]} canWrite={false} onSave={() => {}} newId={() => "PE1"} today="2026-11-12" showToast={() => {}} />);
    expect(screen.getByLabelText("Tooth 16 MB").disabled).toBe(true);
    expect(screen.queryByRole("button", { name: "Save exam" })).toBeNull();
  });
});

describe("InstalmentPlan", () => {
  it("creates a plan for the balance", () => {
    const onCreate = vi.fn();
    render(<InstalmentPlan inv={{ id: "I1", totalP: 100000, payments: [{ amountP: 10000 }] }} canEdit onCreate={onCreate} onRemove={() => {}} showToast={() => {}} today="2026-11-12" />);
    fireEvent.change(screen.getByLabelText("Number of instalments"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Create plan" }));
    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onCreate.mock.calls[0][0].map((r) => r.amountP)).toEqual([30000, 30000, 30000]);
    expect(onCreate.mock.calls[0][1]).toBe(10000);
  });
  it("shows an existing plan with status", () => {
    const inv = { id: "I1", totalP: 90000, payments: [{ amountP: 30000 }], instalments: { downP: 0, schedule: [{ no: 1, dueOn: "2026-11-01", amountP: 30000 }, { no: 2, dueOn: "2026-11-02", amountP: 30000 }, { no: 3, dueOn: "2026-12-01", amountP: 30000 }] } };
    render(<InstalmentPlan inv={inv} canEdit onCreate={() => {}} onRemove={() => {}} showToast={() => {}} today="2026-11-12" />);
    const t = screen.getByTestId("instalment-plan").textContent;
    expect(t).toContain("Paid"); expect(t).toContain("Overdue"); expect(t).toContain("Due");
  });
});

describe("CertificatePanel", () => {
  it("blocks printing until the form is valid", () => {
    const showToast = vi.fn();
    render(<CertificatePanel patient={{ id: "P1", name: "Asha" }} profile={{}} today="2026-11-12" showToast={showToast} />);
    fireEvent.click(screen.getByRole("button", { name: "Print certificate" }));
    expect(showToast).toHaveBeenCalledWith(expect.stringMatching(/treatment/i));
  });
});
