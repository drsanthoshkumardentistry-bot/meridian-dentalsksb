import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import ClinicDetail from "../src/components/ClinicDetail.jsx";

const clinic = { uid: "u1", email: "a@x.com", state: "paid", plan: "pro", online: false, suspended: false };

afterEach(cleanup);

describe("clinic account controls", () => {
  it("asks before suspending, then suspends", async () => {
    const actionFn = vi.fn().mockResolvedValue({ suspended: true });
    const onToast = vi.fn();
    render(<ClinicDetail clinic={clinic} onToast={onToast} actionFn={actionFn} planFn={vi.fn()} />);
    fireEvent.click(screen.getByText("Suspend this clinic"));
    expect(actionFn).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Yes, suspend"));
    await waitFor(() => expect(actionFn).toHaveBeenCalledWith({ email: "a@x.com", action: "suspend" }));
    await waitFor(() => expect(screen.getByText("This clinic is suspended.")).toBeTruthy());
  });
  it("offers to allow a suspended clinic back in", async () => {
    const actionFn = vi.fn().mockResolvedValue({ suspended: false });
    render(<ClinicDetail clinic={{ ...clinic, suspended: true }} onToast={() => {}} actionFn={actionFn} planFn={vi.fn()} />);
    fireEvent.click(screen.getByText("Allow this clinic to sign in again"));
    fireEvent.click(screen.getByText("Yes, allow"));
    await waitFor(() => expect(actionFn).toHaveBeenCalledWith({ email: "a@x.com", action: "resume" }));
  });
  it("applies a plan with days, and shows server errors", async () => {
    const planFn = vi.fn().mockRejectedValueOnce(new Error("Days must be 1 to 800.")).mockResolvedValue({});
    const onToast = vi.fn();
    render(<ClinicDetail clinic={clinic} onToast={onToast} actionFn={vi.fn()} planFn={planFn} />);
    fireEvent.change(screen.getByLabelText("Plan"), { target: { value: "scale" } });
    fireEvent.change(screen.getByLabelText("Add days"), { target: { value: "90" } });
    fireEvent.click(screen.getByText("Apply plan"));
    await waitFor(() => expect(planFn).toHaveBeenCalledWith({ email: "a@x.com", plan: "scale", days: 90 }));
    await waitFor(() => expect(onToast).toHaveBeenCalledWith("Days must be 1 to 800."));
  });
  it("asks before pausing a subscription, then pauses it", async () => {
    const actionFn = vi.fn().mockResolvedValue({ paused: true });
    render(<ClinicDetail clinic={clinic} onToast={() => {}} actionFn={actionFn} planFn={vi.fn()} />);
    fireEvent.click(screen.getByText("Pause subscription"));
    expect(actionFn).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Yes, pause"));
    await waitFor(() => expect(actionFn).toHaveBeenCalledWith({ email: "a@x.com", action: "pause_subscription" }));
    await waitFor(() => expect(screen.getByText("This subscription is paused.")).toBeTruthy());
  });
  it("offers to start a paused subscription and hides pause for unpaid clinics", async () => {
    const actionFn = vi.fn().mockResolvedValue({});
    const { unmount } = render(<ClinicDetail clinic={{ ...clinic, state: "paused" }} onToast={() => {}} actionFn={actionFn} planFn={vi.fn()} />);
    fireEvent.click(screen.getByText("Start subscription again"));
    fireEvent.click(screen.getByText("Yes, start"));
    await waitFor(() => expect(actionFn).toHaveBeenCalledWith({ email: "a@x.com", action: "resume_subscription" }));
    unmount();
    render(<ClinicDetail clinic={{ ...clinic, state: "unpaid" }} onToast={() => {}} actionFn={actionFn} planFn={vi.fn()} />);
    expect(screen.queryByText("Pause subscription")).toBeNull();
  });
});
