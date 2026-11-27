import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import FounderLog from "../src/components/FounderLog.jsx";
import Insights from "../src/components/Insights.jsx";
import ClinicDetail from "../src/components/ClinicDetail.jsx";

afterEach(cleanup);

describe("founder activity log", () => {
  it("lists what was changed and says so when empty or unreachable", async () => {
    const loadFn = vi.fn().mockResolvedValue([{ id: "1", at: 1000, actor: "boss@x.com", action: "suspend", target: "a@x.com", detail: "" }]);
    render(<FounderLog loadFn={loadFn} now={1000 + 120000} />);
    expect(await screen.findByText("Suspended")).toBeTruthy();
    expect(screen.getByText("2 min ago")).toBeTruthy();
    cleanup();
    render(<FounderLog loadFn={vi.fn().mockResolvedValue([])} />);
    expect(await screen.findByText(/Nothing yet/)).toBeTruthy();
    cleanup();
    render(<FounderLog loadFn={vi.fn().mockRejectedValue(new Error("Sign in again."))} />);
    expect(await screen.findByRole("alert")).toBeTruthy();
  });
});

describe("revenue and risk panel", () => {
  it("shows the numbers and a quiet paying clinic", () => {
    const now = 1e12;
    render(<Insights now={now} clinics={[{ uid: "u", email: "q@x.com", state: "paid", plan: "pro", paidUntil: now + 20 * 86400000, weekMin: 0, created: now - 90 * 86400000 }]} />);
    expect(screen.getAllByText("₹999").length).toBe(2);
    expect(screen.getByText("₹11,988")).toBeTruthy();
    expect(screen.getByText(/q@x.com/)).toBeTruthy();
    expect(screen.getByTestId("plan-mix").textContent).toContain("Growth 1");
  });
});

describe("clinic note kept on the account", () => {
  const clinic = { uid: "u1", email: "a@x.com", state: "unpaid" };
  it("loads the saved note and keeps edits on the account when you leave the box", async () => {
    localStorage.clear();
    const noteFn = vi.fn().mockImplementation(({ note }) => Promise.resolve({ note: typeof note === "string" ? note : "Called on Monday" }));
    render(<ClinicDetail clinic={clinic} onToast={() => {}} actionFn={vi.fn()} planFn={vi.fn()} noteFn={noteFn} />);
    const box = await screen.findByDisplayValue("Called on Monday");
    fireEvent.change(box, { target: { value: "Called on Tuesday" } });
    fireEvent.blur(box);
    await waitFor(() => expect(noteFn).toHaveBeenCalledWith({ email: "a@x.com", note: "Called on Tuesday" }));
    expect(await screen.findByTestId("note-sync")).toBeTruthy();
  });
  it("says it only saved on this device when the account cannot be reached", async () => {
    localStorage.clear();
    const noteFn = vi.fn().mockImplementation(({ note }) => (typeof note === "string" ? Promise.reject(new Error("x")) : Promise.resolve({ note: "" })));
    render(<ClinicDetail clinic={clinic} onToast={() => {}} actionFn={vi.fn()} planFn={vi.fn()} noteFn={noteFn} />);
    const box = screen.getByPlaceholderText(/Who you spoke to/);
    fireEvent.change(box, { target: { value: "hello" } });
    fireEvent.blur(box);
    expect(await screen.findByText(/this device only/)).toBeTruthy();
  });
});
