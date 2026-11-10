import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import QueuePanel from "../src/components/QueuePanel.jsx";
import Assessments from "../src/components/Assessments.jsx";
import BookingPage from "../src/components/BookingPage.jsx";
import BookingRequests from "../src/components/BookingRequests.jsx";
import { dateKey } from "../src/reminders.js";

afterEach(cleanup);

describe("QueuePanel", () => {
  it("adds a walk-in, shows an error for a bad number, and moves through statuses", () => {
    const onAdd = vi.fn((f) => (f.phone === "12" ? { ok: false, error: "Enter a valid 10-digit mobile number or leave it blank" } : { ok: true }));
    const onStatus = vi.fn();
    const today = dateKey();
    const q = [{ id: "1", date: today, token: 1, name: "Asha", reason: "Pain", priority: "Urgent", status: "Waiting", arrivedAt: new Date().toISOString() }];
    render(<QueuePanel queue={q} today={today} onAdd={onAdd} onStatus={onStatus} onRemove={() => {}} />);
    expect(screen.getAllByText("Urgent").length).toBe(2); // badge + triage option
    fireEvent.change(screen.getByLabelText("Walk-in patient name"), { target: { value: "Ravi" } });
    fireEvent.change(screen.getByLabelText("Walk-in mobile number"), { target: { value: "12" } });
    fireEvent.click(screen.getByText("Add to queue"));
    expect(screen.getByRole("alert").textContent).toMatch(/valid 10-digit/);
    fireEvent.change(screen.getByLabelText("Walk-in mobile number"), { target: { value: "" } });
    fireEvent.click(screen.getByText("Add to queue"));
    expect(screen.queryByRole("alert")).toBeNull();
    fireEvent.click(screen.getByText("Call in"));
    expect(onStatus).toHaveBeenCalledWith(q[0], "In chair");
  });
  it("shows an empty state", () => {
    render(<QueuePanel queue={[]} today={dateKey()} onAdd={() => ({ ok: true })} onStatus={() => {}} onRemove={() => {}} />);
    expect(screen.getByText(/No walk-ins today/)).toBeTruthy();
  });
});

describe("Assessments", () => {
  it("updates the live caries level and saves", () => {
    const onSave = vi.fn();
    render(<Assessments patient={{}} newId={(p) => p + "1"} onSave={onSave} onRemove={() => {}} />);
    expect(screen.getByText(/Low risk/)).toBeTruthy();
    fireEvent.click(screen.getByLabelText(/New cavities or fillings/));
    fireEvent.click(screen.getByLabelText(/Sugary food/));
    expect(screen.getByText(/Moderate risk/)).toBeTruthy();
    fireEvent.click(screen.getByText("Save caries risk"));
    expect(onSave.mock.calls[0][0]).toMatchObject({ type: "caries", result: { level: "Moderate" } });
  });
  it("needs all sextants for BPE", () => {
    const onSave = vi.fn();
    render(<Assessments patient={{}} newId={(p) => p + "1"} onSave={onSave} onRemove={() => {}} />);
    fireEvent.click(screen.getByText("Save gum screening"));
    expect(screen.getByRole("alert").textContent).toBe("Score all six sextants");
    expect(onSave).not.toHaveBeenCalled();
    ["UR", "UA", "UL", "LL", "LA", "LR"].forEach((id, i) => fireEvent.change(document.getElementById(`bpe-${id}`), { target: { value: i === 3 ? "3" : "1" } }));
    fireEvent.click(screen.getByText("Save gum screening"));
    expect(onSave.mock.calls[0][0].result).toMatchObject({ highest: 3, needsFullChart: true });
  });
  it("lists saved history", () => {
    const a = { id: "x", type: "caries", date: "2026-11-01", result: { level: "High", recallMonths: 3, advice: ["Seal molars"] } };
    render(<Assessments patient={{ assessments: [a] }} newId={() => "z"} onSave={() => {}} onRemove={() => {}} />);
    expect(screen.getByText(/Caries risk: High/)).toBeTruthy();
  });
});

describe("BookingPage (public)", () => {
  const page = { enabled: true, name: "Smile Dental", doctor: "Dr A", address: "Coimbatore" };
  const future = () => { const d = new Date(Date.now() + 2 * 864e5); return dateKey(d); };

  it("shows a closed message when booking is off", async () => {
    render(<BookingPage clinicId="c" loadPage={() => Promise.resolve({ ...page, enabled: false })} submit={vi.fn()} />);
    expect(await screen.findByText("Online booking is not available")).toBeTruthy();
  });
  it("shows an error when the page cannot load", async () => {
    render(<BookingPage clinicId="c" loadPage={() => Promise.reject(new Error("x"))} submit={vi.fn()} />);
    expect(await screen.findByText("This page could not load")).toBeTruthy();
  });
  it("validates, submits and confirms", async () => {
    const submit = vi.fn(() => Promise.resolve());
    render(<BookingPage clinicId="clinic1" loadPage={() => Promise.resolve(page)} submit={submit} />);
    await screen.findByText("Smile Dental");
    fireEvent.click(screen.getByText("Send request"));
    expect(screen.getByRole("alert").textContent).toBe("Enter your name");
    fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Asha" } });
    fireEvent.change(screen.getByLabelText("Mobile number"), { target: { value: "9876543210" } });
    fireEvent.change(screen.getByLabelText("Preferred date"), { target: { value: future() } });
    fireEvent.change(screen.getByLabelText("Time of day"), { target: { value: "Morning" } });
    fireEvent.click(screen.getByText("Send request"));
    await screen.findByText("Request sent");
    expect(submit.mock.calls[0][0]).toMatchObject({ clinicId: "clinic1", name: "Asha", phone: "9876543210", status: "new" });
  });
  it("keeps the form and explains when sending fails", async () => {
    render(<BookingPage clinicId="c" loadPage={() => Promise.resolve(page)} submit={() => Promise.reject(new Error("net"))} />);
    await screen.findByText("Smile Dental");
    fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Asha" } });
    fireEvent.change(screen.getByLabelText("Mobile number"), { target: { value: "9876543210" } });
    fireEvent.change(screen.getByLabelText("Preferred date"), { target: { value: future() } });
    fireEvent.change(screen.getByLabelText("Time of day"), { target: { value: "Evening" } });
    fireEvent.click(screen.getByText("Send request"));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/Could not send/));
    expect(screen.getByLabelText("Your name").value).toBe("Asha");
  });
});

describe("BookingRequests", () => {
  it("lists only new requests and fires actions", () => {
    const onConfirm = vi.fn(); const onDecline = vi.fn();
    const rs = [{ id: "a", name: "Asha", phone: "9876543210", service: "Filling", date: "2026-11-12", slot: "Morning", note: "", status: "new", createdAt: "1" }, { id: "b", name: "Old", phone: "9", service: "x", date: "d", slot: "Morning", status: "confirmed", createdAt: "0" }];
    render(<BookingRequests requests={rs} onConfirm={onConfirm} onDecline={onDecline} onContact={() => {}} />);
    expect(screen.queryByText(/Old/)).toBeNull();
    fireEvent.click(screen.getByText("Confirm"));
    expect(onConfirm).toHaveBeenCalledWith(rs[0]);
    fireEvent.click(screen.getByText("Decline"));
    expect(onDecline).toHaveBeenCalledWith(rs[0]);
  });
  it("renders nothing when there are no new requests", () => {
    const { container } = render(<BookingRequests requests={[]} onConfirm={() => {}} onDecline={() => {}} onContact={() => {}} />);
    expect(container.innerHTML).toBe("");
  });
});
