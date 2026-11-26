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
});
