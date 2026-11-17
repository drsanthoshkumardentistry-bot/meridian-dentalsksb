import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, cleanup } from "@testing-library/react";
import AdminDashboard, { mins } from "../src/components/AdminDashboard.jsx";
import PlanCard from "../src/components/PlanCard.jsx";
import { loadOverview, decideRequest } from "../src/adminApi.js";
import { requestPlan, loadMyRequest } from "../src/planApi.js";
import { startHeartbeat } from "../src/heartbeat.js";

afterEach(() => { cleanup(); vi.useRealTimers(); });

const NOW = Date.now();
const data = () => ({
  users: { total: 3, newLast7: 1, quiet30: 1 },
  presence: { onlineNow: 2, activeToday: 3, hoursToday: 4.5, hoursWeek: 20.25, dayTotals: Array.from({ length: 7 }, (_, i) => ({ day: `2026-11-${10 + i}`, hours: i })) },
  billing: { paidActive: 1, expired: 1, pending: 1, monthlyValue: 999 },
  requests: [
    { uid: "uidB1234", email: "b@x.com", clinic: "Smile Care", plan: "standard", yearly: false, status: "pending", createdAt: NOW - 600000 },
    { uid: "uidC1234", email: "c@x.com", plan: "pro", status: "approved", createdAt: NOW - 86400000 * 5 },
  ],
  clinics: [
    { uid: "uidA1234", email: "a@x.com", created: NOW - 86400000 * 40, lastLogin: NOW - 60000, online: true, todayMin: 90, weekMin: 600, plan: "pro", paidUntil: NOW + 86400000 * 10, state: "paid", request: "" },
    { uid: "uidB1234", email: "b@x.com", created: NOW - 86400000 * 2, lastLogin: NOW - 86400000, online: false, todayMin: 0, weekMin: 0, plan: "", paidUntil: 0, state: "unpaid", request: "pending" },
    { uid: "uidC1234", email: "c@x.com", created: NOW - 86400000 * 90, lastLogin: NOW - 86400000 * 80, online: false, todayMin: 0, weekMin: 0, plan: "standard", paidUntil: NOW - 86400000, state: "expired", request: "approved" },
  ],
});

describe("admin dashboard", () => {
  it("shows who is online, hours, billing and every clinic", async () => {
    render(<AdminDashboard loadFn={async () => data()} refreshMs={0} />);
    const act = await screen.findByLabelText("Activity");
    expect(within(act).getByText("Online now").previousSibling.textContent).toBe("2");
    expect(within(act).getByText("Hours online today").previousSibling.textContent).toBe("4.5");
    expect(within(screen.getByLabelText("Billing")).getByText("Monthly value").previousSibling.textContent).toBe("₹999");
    const t = within(screen.getByTestId("clinics"));
    expect(t.getByText("a@x.com")).toBeTruthy();
    expect(t.getByText("Online")).toBeTruthy();
    expect(t.getByText("1h 30m")).toBeTruthy();
    expect(t.getByText(/Pro until/)).toBeTruthy();
    expect(t.getByText(/ended/)).toBeTruthy();
    expect(mins(0)).toBe("-");
    expect(mins(45)).toBe("45m");
  });
  it("approves only after asking whether the payment arrived", async () => {
    const decide = vi.fn(async () => ({ status: "approved", paidUntil: NOW + 30 * 86400000 }));
    render(<AdminDashboard loadFn={async () => data()} decideFn={decide} refreshMs={0} />);
    const box = within(await screen.findByTestId("requests"));
    fireEvent.click(box.getByLabelText("Approve b@x.com"));
    expect(decide).not.toHaveBeenCalled();
    expect(box.getByText("Payment received?")).toBeTruthy();
    fireEvent.click(box.getByText("Yes, activate"));
    await waitFor(() => expect(decide).toHaveBeenCalledWith({ uid: "uidB1234", action: "approve" }));
    expect(await screen.findByRole("status")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("b@x.com has Standard until");
  });
  it("can reject, and can cancel an approval", async () => {
    const decide = vi.fn(async () => ({ status: "rejected" }));
    render(<AdminDashboard loadFn={async () => data()} decideFn={decide} refreshMs={0} />);
    const box = within(await screen.findByTestId("requests"));
    fireEvent.click(box.getByLabelText("Approve b@x.com"));
    fireEvent.click(box.getByText("Cancel"));
    expect(box.getByLabelText("Reject b@x.com")).toBeTruthy();
    fireEvent.click(box.getByLabelText("Reject b@x.com"));
    await waitFor(() => expect(decide).toHaveBeenCalledWith({ uid: "uidB1234", action: "reject" }));
  });
  it("shows server errors in words and keeps working", async () => {
    const decide = vi.fn(async () => { throw new Error("That request was already decided."); });
    render(<AdminDashboard loadFn={async () => data()} decideFn={decide} refreshMs={0} />);
    const box = within(await screen.findByTestId("requests"));
    fireEvent.click(box.getByLabelText("Reject b@x.com"));
    expect((await screen.findByRole("status")).textContent).toContain("already decided");
  });
  it("explains when the account is not an admin or loading fails", async () => {
    render(<AdminDashboard loadFn={async () => null} refreshMs={0} />);
    expect((await screen.findByRole("alert")).textContent).toMatch(/not an admin/);
    cleanup();
    render(<AdminDashboard loadFn={async () => { throw new Error("Could not read the numbers."); }} refreshMs={0} />);
    expect((await screen.findByRole("alert")).textContent).toContain("Could not read the numbers.");
  });
  it("opens the clinic app and signs out", async () => {
    const open = vi.fn(), out = vi.fn();
    render(<AdminDashboard initial={data()} loadFn={async () => data()} onOpenApp={open} onLogout={out} refreshMs={0} />);
    fireEvent.click(screen.getByText("Open my clinic"));
    fireEvent.click(screen.getByText("Sign out"));
    expect(open).toHaveBeenCalled();
    expect(out).toHaveBeenCalled();
  });
});

describe("admin and plan API clients", () => {
  const res = (status, body) => ({ status, ok: status < 300, json: async () => body });
  it("loadOverview returns null for non-admins and throws for server errors", async () => {
    expect(await loadOverview({ getToken: async () => "t", fetchFn: async () => res(403, {}) })).toBeNull();
    expect(await loadOverview({ getToken: async () => "t", fetchFn: async () => res(200, { a: 1 }) })).toEqual({ a: 1 });
    await expect(loadOverview({ getToken: async () => "t", fetchFn: async () => res(502, { error: "bad" }) })).rejects.toThrow("bad");
  });
  it("decideRequest posts the choice with the sign-in token", async () => {
    const f = vi.fn(async () => res(200, { status: "approved" }));
    await decideRequest({ uid: "u", action: "approve" }, { getToken: async () => "tok", fetchFn: f });
    expect(f.mock.calls[0][1].headers.Authorization).toBe("Bearer tok");
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ uid: "u", action: "approve" });
    await expect(decideRequest({ uid: "u", action: "approve" }, { getToken: async () => "t", fetchFn: async () => res(409, { error: "done" }) })).rejects.toThrow("done");
  });
  it("loadMyRequest never throws and ignores odd values", async () => {
    expect(await loadMyRequest({ getToken: async () => "t", fetchFn: async () => res(200, { status: "pending", plan: "pro" }) })).toEqual({ status: "pending", plan: "pro" });
    expect((await loadMyRequest({ getToken: async () => "t", fetchFn: async () => res(200, { status: "hacked" }) })).status).toBe("");
    expect((await loadMyRequest({ getToken: async () => { throw new Error("x"); } })).status).toBe("");
    expect(await requestPlan({ plan: "pro" }, { getToken: async () => "t", fetchFn: async () => res(200, { status: "pending" }) })).toEqual({ status: "pending" });
  });
});

describe("plan card requests", () => {
  it("sends a request for the chosen plan and then shows it is waiting", async () => {
    const requestFn = vi.fn(async () => ({ status: "pending" }));
    render(<PlanCard clinic="Smile" requestFn={requestFn} myRequestFn={async () => ({ status: "" })} loadFn={async () => ({ plan: "", paidUntil: 0 })} />);
    fireEvent.click(screen.getByLabelText("Pro plan"));
    fireEvent.click(screen.getByText("Request Pro"));
    await waitFor(() => expect(requestFn).toHaveBeenCalledWith({ plan: "pro", yearly: false, clinic: "Smile" }));
    expect((await screen.findByTestId("plan-request-status")).textContent).toContain("Pro is with us");
    expect(screen.getByText("Request Pro").disabled).toBe(true);
  });
  it("shows an earlier request and reports a failure with the WhatsApp fallback", async () => {
    render(<PlanCard myRequestFn={async () => ({ status: "rejected" })} loadFn={async () => ({ plan: "", paidUntil: 0 })} requestFn={async () => { throw new Error("Requests are not switched on yet. Use WhatsApp."); }} />);
    expect((await screen.findByTestId("plan-request-status")).textContent).toMatch(/not approved/);
    fireEvent.click(screen.getByText("Request Standard"));
    expect((await screen.findByRole("alert")).textContent).toContain("Use WhatsApp");
  });
});

describe("heartbeat", () => {
  const fakeDoc = (state = "visible") => { const h = {}; return { visibilityState: state, addEventListener: (e, f) => { h[e] = f; }, removeEventListener: (e) => { delete h[e]; }, fire: (e) => h[e] && h[e]() , h }; };
  it("sends right away, then every interval, only while the tab is visible, and stops", async () => {
    vi.useFakeTimers();
    const f = vi.fn(async () => ({ ok: true }));
    const doc = fakeDoc();
    const stop = startHeartbeat({ fetchFn: f, getToken: async () => "tok", doc, id: "sess1234", intervalMs: 1000 });
    await vi.advanceTimersByTimeAsync(0);
    expect(f).toHaveBeenCalledTimes(1);
    expect(f.mock.calls[0][0]).toBe("/api/heartbeat");
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ sessionId: "sess1234" });
    await vi.advanceTimersByTimeAsync(1000);
    expect(f).toHaveBeenCalledTimes(2);
    doc.visibilityState = "hidden";
    await vi.advanceTimersByTimeAsync(3000);
    expect(f).toHaveBeenCalledTimes(2);
    stop();
    doc.visibilityState = "visible";
    await vi.advanceTimersByTimeAsync(5000);
    expect(f).toHaveBeenCalledTimes(2);
    expect(doc.h.visibilitychange).toBeUndefined();
  });
  it("never throws when the network or sign-in fails", async () => {
    vi.useFakeTimers();
    const stop = startHeartbeat({ fetchFn: async () => { throw new Error("offline"); }, getToken: async () => { throw new Error("no user"); }, doc: fakeDoc(), id: "sess1234", intervalMs: 1000 });
    await vi.advanceTimersByTimeAsync(2500);
    stop();
  });
});
