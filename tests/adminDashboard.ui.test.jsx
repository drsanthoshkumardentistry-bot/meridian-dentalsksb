import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, cleanup } from "@testing-library/react";
import AdminDashboard, { mins } from "../src/components/AdminDashboard.jsx";
import PlanCard from "../src/components/PlanCard.jsx";
import { loadOverview, decideRequest } from "../src/adminApi.js";
import { requestPlan, loadMyRequest } from "../src/planApi.js";
import { startHeartbeat } from "../src/heartbeat.js";

afterEach(() => { cleanup(); vi.useRealTimers(); });

const go = async (name) => { fireEvent.click(await screen.findByRole("button", { name: new RegExp(`^${name}`) })); };

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
    await go("Billing & approvals");
    expect(within(screen.getByLabelText("Billing")).getByText("Monthly value").previousSibling.textContent).toBe("₹999");
    await go("Clinics");
    const t = within(screen.getByTestId("clinics"));
    expect(t.getByText("a@x.com")).toBeTruthy();
    expect(t.getAllByText("Online").length).toBeGreaterThan(1); // the filter button and the clinic's own status
    expect(t.getByText("1h 30m")).toBeTruthy();
    expect(t.getByText(/Growth until/)).toBeTruthy();
    expect(t.getByText(/ended/)).toBeTruthy();
    expect(mins(0)).toBe("-");
    expect(mins(45)).toBe("45m");
  });
  it("approves only after asking whether the payment arrived", async () => {
    const decide = vi.fn(async () => ({ status: "approved", paidUntil: NOW + 30 * 86400000 }));
    render(<AdminDashboard loadFn={async () => data()} decideFn={decide} refreshMs={0} />);
    await go("Billing & approvals");
    const box = within(await screen.findByTestId("requests"));
    fireEvent.click(box.getByLabelText("Approve b@x.com"));
    expect(decide).not.toHaveBeenCalled();
    expect(box.getByText("Payment received?")).toBeTruthy();
    fireEvent.click(box.getByText("Yes, activate"));
    await waitFor(() => expect(decide).toHaveBeenCalledWith({ uid: "uidB1234", action: "approve" }));
    expect(await screen.findByRole("status")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("b@x.com has Starter until");
  });
  it("can reject, and can cancel an approval", async () => {
    const decide = vi.fn(async () => ({ status: "rejected" }));
    render(<AdminDashboard loadFn={async () => data()} decideFn={decide} refreshMs={0} />);
    await go("Billing & approvals");
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
    await go("Billing & approvals");
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
    fireEvent.click(screen.getByLabelText("Growth plan"));
    fireEvent.click(screen.getByText("Request Growth"));
    await waitFor(() => expect(requestFn).toHaveBeenCalledWith({ plan: "pro", yearly: false, clinic: "Smile" }));
    expect((await screen.findByTestId("plan-request-status")).textContent).toContain("Growth is with us");
    expect(screen.getByText("Request Growth").disabled).toBe(true);
  });
  it("shows an earlier request and reports a failure with the WhatsApp fallback", async () => {
    render(<PlanCard myRequestFn={async () => ({ status: "rejected" })} loadFn={async () => ({ plan: "", paidUntil: 0 })} requestFn={async () => { throw new Error("Requests are not switched on yet. Use WhatsApp."); }} />);
    expect((await screen.findByTestId("plan-request-status")).textContent).toMatch(/not approved/);
    fireEvent.click(screen.getByText("Request Starter"));
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

describe("heartbeat session id", () => {
  it("is a 32-character random hex id that stays the same during a browser session", async () => {
    const seen = [];
    const mk = () => startHeartbeat({ fetchFn: async (_u, init) => { seen.push(JSON.parse(init.body).sessionId); return { ok: true }; }, getToken: async () => "t", doc: { visibilityState: "visible", addEventListener() {}, removeEventListener() {} }, intervalMs: 999999 });
    sessionStorage.clear();
    const s1 = mk(); await new Promise((r) => setTimeout(r, 5)); s1();
    const s2 = mk(); await new Promise((r) => setTimeout(r, 5)); s2();
    expect(seen[0]).toMatch(/^[0-9a-f]{32}$/);
    expect(seen[1]).toBe(seen[0]);
  });
});

describe("admin dashboard: finding clinics", () => {
  it("filters by status and searches by email", async () => {
    render(<AdminDashboard loadFn={async () => data()} refreshMs={0} />);
    await go("Clinics");
    const t = within(await screen.findByTestId("clinics"));
    expect(t.getByText("3 of 3")).toBeTruthy();
    fireEvent.click(t.getByRole("button", { name: /^Paying/ }));
    expect(t.getByText("a@x.com")).toBeTruthy();
    expect(t.queryByText("b@x.com")).toBeNull();
    fireEvent.click(t.getByRole("button", { name: /^Requested/ }));
    expect(t.getByText("b@x.com")).toBeTruthy();
    expect(t.queryByText("a@x.com")).toBeNull();
    fireEvent.click(t.getByRole("button", { name: /^Quiet/ }));
    expect(t.getByText("c@x.com")).toBeTruthy();
    fireEvent.click(t.getByRole("button", { name: /^All/ }));
    fireEvent.change(t.getByLabelText("Search clinics"), { target: { value: "C@X" } });
    expect(t.getByText("1 of 3")).toBeTruthy();
    fireEvent.change(t.getByLabelText("Search clinics"), { target: { value: "nobody" } });
    expect(t.getByText("No clinics match.")).toBeTruthy();
  });
  it("shows a friendly note instead of an empty chart, and collapses a long list", async () => {
    const d = data();
    d.presence.dayTotals = d.presence.dayTotals.map((x) => ({ ...x, hours: 0 }));
    d.clinics = Array.from({ length: 30 }, (_, i) => ({ ...d.clinics[1], uid: "u" + i, email: `clinic${i}@x.com` }));
    render(<AdminDashboard loadFn={async () => d} refreshMs={0} />);
    expect(await screen.findByText(/No online time recorded yet/)).toBeTruthy();
    await go("Clinics");
    const t = within(screen.getByTestId("clinics"));
    expect(t.getAllByRole("listitem")).toHaveLength(24);
    fireEvent.click(t.getByText("Show all 30"));
    expect(t.getAllByRole("listitem")).toHaveLength(30);
  });
});

describe("admin dashboard: sidebar", () => {
  it("switches sections from the side menu, shows the waiting count, and opens and closes on mobile", async () => {
    render(<AdminDashboard email="boss@x.com" initial={data()} loadFn={async () => data()} refreshMs={0} />);
    const nav = within(screen.getByLabelText("Admin sections"));
    expect(screen.getByLabelText("Admin menu").textContent).toContain("boss@x.com");
    expect(screen.getByLabelText("1 waiting")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Overview");
    expect(screen.queryByTestId("clinics")).toBeNull();
    fireEvent.click(nav.getByText("Clinics"));
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Clinics");
    expect(screen.getByTestId("clinics")).toBeTruthy();
    expect(screen.queryByLabelText("Activity")).toBeNull();
    fireEvent.click(nav.getByText("Billing & approvals"));
    expect(screen.getByTestId("requests")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Open menu"));
    expect(screen.getAllByLabelText("Close menu").length).toBeGreaterThan(0);
  });

  it("has an app-style bell that lists waiting requests and jumps to billing", () => {
    render(<AdminDashboard email="a@b.in" initial={data()} loadFn={vi.fn()} refreshMs={0} />);
    const bell = screen.getByRole("button", { name: /^Notifications, \d+/ });
    fireEvent.click(bell);
    const item = within(screen.getByRole("menu", { name: "Notifications" })).getAllByRole("menuitem")[0];
    fireEvent.click(item);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Billing & approvals");
  });
});

describe("admin profile page", () => {
  const profile = async () => {
    render(<AdminDashboard email="boss@x.com" initial={data()} loadFn={vi.fn()} refreshMs={0} now={NOW} />);
    await go("Admin profile");
  };
  it("shows the account and follow-up lists, and copies emails", async () => {
    const writeText = vi.fn().mockResolvedValue();
    Object.assign(navigator, { clipboard: { writeText } });
    localStorage.clear();
    await profile();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Admin profile");
    fireEvent.click(screen.getByRole("tab", { name: "Clinics" }));
    expect(within(screen.getByLabelText("Account")).getByText("boss@x.com")).toBeTruthy();
    expect(within(screen.getByTestId("follow-expired")).getByText("1")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Copy emails: Plan ended" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("c@x.com"));
    expect(await screen.findByText("Copied 1 email.")).toBeTruthy();
    fireEvent.click(within(screen.getByTestId("follow-expired")).getByText("Show list"));
    expect(within(screen.getByTestId("follow-expired")).getByText("c@x.com")).toBeTruthy();
  });
  it("says so when copying is blocked", async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("no")) } });
    await profile();
    fireEvent.click(screen.getByRole("button", { name: "Copy email" }));
    expect(await screen.findByText(/Could not copy/)).toBeTruthy();
  });
  it("exports csv files", async () => {
    URL.createObjectURL = vi.fn(() => "blob:x"); URL.revokeObjectURL = vi.fn();
    await profile();
    fireEvent.click(screen.getByText("Clinics (CSV)"));
    expect(await screen.findByText("Saved merident-clinics.csv.")).toBeTruthy();
    fireEvent.click(screen.getByText("Plan requests (CSV)"));
    expect(await screen.findByText("Saved merident-plan-requests.csv.")).toBeTruthy();
  });
  it("keeps a to-do list and private notes on this device", async () => {
    localStorage.clear();
    await profile();
    fireEvent.change(screen.getByLabelText("New to-do"), { target: { value: "Call Smile Care" } });
    fireEvent.click(screen.getByText("Add"));
    fireEvent.click(screen.getByLabelText("Done: Call Smile Care"));
    expect(JSON.parse(localStorage.getItem("merident.admin.todos"))[0].done).toBe(true);
    fireEvent.change(screen.getByLabelText("Private notes", { selector: "textarea" }), { target: { value: "raise price?" } });
    expect(JSON.parse(localStorage.getItem("merident.admin.notes"))).toBe("raise price?");
    fireEvent.click(screen.getByLabelText("Remove: Call Smile Care"));
    expect(screen.getByText(/Nothing here yet/)).toBeTruthy();
  });
  it("saves the refresh choice", async () => {
    localStorage.clear();
    await profile();
    fireEvent.change(screen.getByLabelText("Refresh the numbers"), { target: { value: "300000" } });
    expect(localStorage.getItem("merident.admin.refresh")).toBe("300000");
  });
  it("has tabs that remember the last one, and a look and start-page panel", async () => {
    localStorage.clear();
    await profile();
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["Control", "Business", "Clinics", "Me", "Workspace"]);
    expect(screen.getByRole("tab", { name: "Control" }).getAttribute("aria-selected")).toBe("true");
    fireEvent.click(screen.getByRole("tab", { name: "Me" }));
    expect(JSON.parse(localStorage.getItem("merident.admin.profileTab"))).toBe("me");
    fireEvent.click(screen.getByRole("switch", { name: "Compact layout: off" }));
    fireEvent.click(screen.getByRole("switch", { name: "Larger text: off" }));
    expect(JSON.parse(localStorage.getItem("merident.admin.look"))).toEqual({ dense: true, large: true });
    expect(screen.getByTestId("admin-profile").style.zoom).toBe("1.12");
    fireEvent.change(screen.getByLabelText("Open the dashboard on"), { target: { value: "clinics" } });
    expect(JSON.parse(localStorage.getItem("merident.admin.start"))).toBe("clinics");
  });
  it("opens on the saved start page", () => {
    localStorage.setItem("merident.admin.start", JSON.stringify("billing"));
    render(<AdminDashboard email="boss@x.com" initial={data()} loadFn={vi.fn()} refreshMs={0} now={NOW} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Billing & approvals");
    localStorage.clear();
  });
  it("can open straight on the profile", () => {
    render(<AdminDashboard email="boss@x.com" initial={data()} loadFn={vi.fn()} refreshMs={0} startView="profile" />);
    expect(screen.getByTestId("admin-profile")).toBeTruthy();
  });
});

describe("admin insights", () => {
  it("shows weekly signups, renewals and clinic sorting", async () => {
    render(<AdminDashboard email="a@x.com" initial={data()} loadFn={vi.fn()} refreshMs={0} now={NOW} />);
    expect(screen.getByTestId("signups-chart")).toBeTruthy();
    await go("Billing & approvals");
    const ren = within(screen.getByTestId("renewals"));
    expect(ren.getByText("a@x.com")).toBeTruthy();
    expect(ren.getByText("10 days left")).toBeTruthy();
    expect(ren.queryByText("c@x.com")).toBeNull();
    await go("Clinics");
    const names = () => within(screen.getByTestId("clinics")).getAllByText(/@x\.com$/).map((n) => n.textContent);
    expect(names()[0]).toBe("a@x.com");
    fireEvent.change(screen.getByLabelText("Sort clinics"), { target: { value: "new" } });
    expect(names()[0]).toBe("b@x.com");
    fireEvent.change(screen.getByLabelText("Sort clinics"), { target: { value: "email" } });
    expect(names()[0]).toBe("a@x.com");
  });
  it("shows an empty renewals note when nobody pays", async () => {
    const d = data(); d.clinics = d.clinics.map((c) => ({ ...c, state: "unpaid" }));
    render(<AdminDashboard email="a@x.com" initial={d} loadFn={vi.fn()} refreshMs={0} now={NOW} />);
    await go("Billing & approvals");
    expect(screen.getByText(/No paid plans yet/)).toBeTruthy();
  });
});

describe("admin profile extras", () => {
  const open = async (user) => {
    localStorage.clear();
    render(<AdminDashboard email="boss@x.com" user={user} initial={data()} loadFn={vi.fn()} refreshMs={0} now={NOW} startView="profile" />);
  };
  it("shows business numbers and tracks a goal", async () => {
    await open();
    const snap = within(screen.getByTestId("business-snapshot"));
    expect(snap.getByText("₹11,988")).toBeTruthy();
    expect(snap.getByText("33%")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("My goal: paying clinics"), { target: { value: "4" } });
    expect(screen.getByTestId("goal-progress").textContent).toMatch(/25%.*3 more paying clinics/);
    expect(localStorage.getItem("merident.admin.goal")).toBe('"4"');
    fireEvent.change(screen.getByLabelText("My goal: paying clinics"), { target: { value: "1" } });
    expect(screen.getByTestId("goal-progress").textContent).toMatch(/Goal reached/);
  });
  it("fills message templates with the doctor and founder names", async () => {
    await open();
    fireEvent.change(screen.getByLabelText("Doctor's name"), { target: { value: "Dr Ravi" } });
    fireEvent.change(screen.getByLabelText("Name used when you sign messages"), { target: { value: "Santhosh" } });
    expect(screen.getByTestId("template-preview").textContent).toMatch(/Hello Dr Ravi.*This is Santhosh from MeriDent/);
    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "renewal" } });
    expect(screen.getByTestId("template-preview").textContent).toMatch(/plan ends soon/);
    expect(screen.getByText("Send on WhatsApp").closest("a").getAttribute("href")).toMatch(/^https:\/\/wa\.me\/\?text=/);
    expect(JSON.parse(localStorage.getItem("merident.admin.details")).name).toBe("Santhosh");
  });
  it("only keeps digits in the phone box", async () => {
    await open();
    fireEvent.change(screen.getByLabelText("Your WhatsApp number"), { target: { value: "+91 98a<b>76" } });
    expect(screen.getByLabelText("Your WhatsApp number").value).toBe("+91 9876");
  });
  it("shows sign-in details and a launch checklist that remembers ticks", async () => {
    await open({ emailVerified: true, providerData: [{ providerId: "google.com" }], metadata: {} });
    expect(within(screen.getByLabelText("Security")).getByText("Google")).toBeTruthy();
    fireEvent.click(screen.getByLabelText(/Add the 4 Resend email records/));
    expect(JSON.parse(localStorage.getItem("merident.admin.launch")).resend).toBe(true);
    expect(screen.getByText(/1 of 8 done/)).toBeTruthy();
  });
});

describe("clinic details", () => {
  it("opens a panel with a message, copy and a private note kept per clinic", async () => {
    localStorage.clear();
    const writeText = vi.fn().mockResolvedValue();
    Object.assign(navigator, { clipboard: { writeText } });
    render(<AdminDashboard email="a@x.com" initial={data()} loadFn={vi.fn()} refreshMs={0} now={NOW} startView="clinics" />);
    expect(screen.queryByTestId("clinic-detail")).toBeNull();
    fireEvent.click(screen.getByLabelText("Show details for c@x.com"));
    const panel = within(screen.getByTestId("clinic-detail"));
    expect(panel.getByText(/plan ends soon/)).toBeTruthy(); // expired clinic starts on the renewal message
    fireEvent.click(panel.getByText("Copy email"));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("c@x.com"));
    fireEvent.change(panel.getByLabelText("Private note about this clinic"), { target: { value: "Call Monday" } });
    expect(JSON.parse(localStorage.getItem("merident.admin.clinicNotes")).uidC1234).toBe("Call Monday");
    fireEvent.click(screen.getByLabelText("Hide details for c@x.com"));
    expect(screen.queryByTestId("clinic-detail")).toBeNull();
    fireEvent.click(screen.getByLabelText("Show details for c@x.com"));
    expect(screen.getByLabelText("Private note about this clinic").value).toBe("Call Monday");
    fireEvent.change(screen.getByLabelText("Private note about this clinic"), { target: { value: "" } });
    expect(JSON.parse(localStorage.getItem("merident.admin.clinicNotes")).uidC1234).toBeUndefined();
  });
});
