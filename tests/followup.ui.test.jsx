import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import FollowUpPanels, { ReviewInvites } from "../src/components/FollowUpPanels.jsx";

afterEach(cleanup);
const appt = (o = {}) => ({ id: "A1", patientName: "Asha", date: "2026-11-10", procedure: "Scaling", phone: "9876543210", ...o });
const base = { feedbackDue: [], awaiting: [], low: [], plansDue: [], summary: { count: 0, average: 0 }, reviewLink: "", onAsk: vi.fn(), onRate: vi.fn(), onResolve: vi.fn(), onPlan: vi.fn(), onSnoozePlan: vi.fn() };

describe("follow-up panels", () => {
  it("renders nothing when there is nothing to do", () => {
    const { container } = render(<FollowUpPanels {...base} />);
    expect(container.firstChild).toBeNull();
  });
  it("asks for feedback on a recent visit", () => {
    const onAsk = vi.fn();
    render(<FollowUpPanels {...base} feedbackDue={[appt()]} onAsk={onAsk} />);
    fireEvent.click(screen.getByRole("button", { name: /Ask for feedback/ }));
    expect(onAsk).toHaveBeenCalledWith(expect.objectContaining({ id: "A1" }));
  });
  it("records a number with the patient's words", () => {
    const onRate = vi.fn();
    render(<FollowUpPanels {...base} awaiting={[appt({ feedbackAskedAt: "x" })]} onRate={onRate} />);
    fireEvent.change(screen.getByLabelText("Comment from Asha"), { target: { value: "Waited long" } });
    fireEvent.click(screen.getByLabelText("Record 2 out of 5 for Asha"));
    expect(onRate).toHaveBeenCalledWith(expect.objectContaining({ id: "A1" }), 2, "Waited long");
  });
  it("shows low ratings with the comment and lets the clinic mark them handled", () => {
    const onResolve = vi.fn();
    render(<FollowUpPanels {...base} low={[appt({ feedback: { rating: 2, comment: "Waited long" } })]} onResolve={onResolve} />);
    const g = within(screen.getByRole("group", { name: "Low ratings" }));
    expect(g.getByText(/Asha · 2 out of 5/)).toBeTruthy();
    expect(g.getByText(/Waited long/)).toBeTruthy();
    fireEvent.click(g.getByRole("button", { name: "Mark as handled" }));
    expect(onResolve).toHaveBeenCalled();
  });
  it("shows the average rating", () => {
    render(<FollowUpPanels {...base} feedbackDue={[appt()]} summary={{ count: 3, average: 4.3 }} />);
    expect(screen.getByTestId("feedback-summary").textContent).toContain("4.3 average from 3 ratings");
  });
  it("offers plan follow-ups and snoozing", () => {
    const onPlan = vi.fn(); const onSnoozePlan = vi.fn();
    const d = { patient: { id: "P1", name: "Asha" }, plan: { id: "PL1", title: "Root canal 46", status: "Proposed" }, days: 5 };
    render(<FollowUpPanels {...base} plansDue={[d]} onPlan={onPlan} onSnoozePlan={onSnoozePlan} />);
    expect(screen.getByText(/Estimate sent 5 days ago/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Follow up/ }));
    fireEvent.click(screen.getByRole("button", { name: "Not now" }));
    expect(onPlan).toHaveBeenCalledWith(d);
    expect(onSnoozePlan).toHaveBeenCalledWith(d);
  });
  it("hides action buttons from roles that cannot write", () => {
    render(<FollowUpPanels {...base} canWrite={false} feedbackDue={[appt()]} />);
    expect(screen.queryByRole("button", { name: /Ask for feedback/ })).toBeNull();
  });
});

describe("review invitations", () => {
  const link = "https://g.page/r/abc";
  it("lists happy patients only when a review link is set", () => {
    const happy = appt({ feedback: { rating: 5 } });
    const onReview = vi.fn();
    const { rerender, container } = render(<ReviewInvites appointments={[happy]} reviewLink="" onReview={onReview} />);
    expect(container.firstChild).toBeNull();
    rerender(<ReviewInvites appointments={[happy, appt({ id: "A2", feedback: { rating: 3 } })]} reviewLink={link} onReview={onReview} />);
    expect(screen.getAllByRole("button", { name: /Send review link/ })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /Send review link/ }));
    expect(onReview).toHaveBeenCalledWith(happy);
  });
});
