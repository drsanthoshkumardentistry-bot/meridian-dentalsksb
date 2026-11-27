import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import PlanBanner from "../src/components/PlanBanner.jsx";
import PlanEndedScreen from "../src/components/PlanEndedScreen.jsx";

vi.mock("../src/planApi.js", () => ({ loadMyPlan: async () => ({ plan: "", paidUntil: 0 }), requestPlan: vi.fn(), loadMyRequest: async () => ({ status: "" }) }));
afterEach(cleanup);
const ended = Date.UTC(2026, 10, 20);

describe("plan banner", () => {
  it("shows nothing for a full plan", () => {
    const { container } = render(<PlanBanner access={{ mode: "full" }} />);
    expect(container.textContent).toBe("");
  });
  it("tells a grace-period clinic the date and days left, and opens the renew card", async () => {
    render(<PlanBanner access={{ mode: "grace", endedAt: ended, graceLeft: 3, reason: "paid" }} clinic="Smile" />);
    expect(screen.getByTestId("plan-banner").textContent).toMatch(/plan ended on 20 Nov 2026/);
    expect(screen.getByTestId("plan-banner").textContent).toMatch(/3 more days/);
    fireEvent.click(screen.getByRole("button", { name: "Renew" }));
    expect(await screen.findByTestId("plan-card")).toBeTruthy();
  });
  it("explains view-only mode and what comes next", () => {
    render(<PlanBanner access={{ mode: "viewonly", endedAt: ended, viewOnlyLeft: 1, reason: "trial" }} />);
    const t = screen.getByRole("alert").textContent;
    expect(t).toMatch(/View-only mode/);
    expect(t).toMatch(/can't add or edit/);
    expect(t).toMatch(/In 1 day the app opens to downloads only/);
  });
  it("says a paused plan is paused", () => {
    render(<PlanBanner access={{ mode: "grace", endedAt: ended, graceLeft: 5, reason: "paused" }} />);
    expect(screen.getByTestId("plan-banner").textContent).toMatch(/plan is paused on/);
  });
});

describe("downloads-only screen", () => {
  it("offers every download and the renew card, and says nothing was deleted", async () => {
    const onDownloadFile = vi.fn();
    render(<PlanEndedScreen access={{ mode: "download" }} clinic="Smile" data={{ patients: [], appointments: [], invoices: [], inventory: [], employees: [], profile: {} }} onDownloadFile={onDownloadFile} />);
    expect(screen.getByText(/nothing has been deleted/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Full backup/ }));
    fireEvent.click(screen.getByRole("button", { name: /Patients/ }));
    expect(onDownloadFile).toHaveBeenCalledTimes(2);
    expect(onDownloadFile.mock.calls[0][2]).toBe("application/json");
    expect(onDownloadFile.mock.calls[1][1]).toMatch(/^patients-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(await screen.findByTestId("plan-card")).toBeTruthy();
  });
});
