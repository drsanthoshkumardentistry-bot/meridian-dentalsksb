import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within, waitFor, cleanup } from "@testing-library/react";

const h = vi.hoisted(() => ({
  user: { uid: "u-staff", email: "staff@example.com", displayName: "Staff", emailVerified: true, providerData: [{ providerId: "google.com" }] },
  member: null,
  writes: [],
  audit: [],
}));

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: (_a, cb) => { setTimeout(() => cb(h.user), 0); return () => {}; },
}));
vi.mock("../src/firebase", () => ({
  auth: {}, db: {}, storage: null, firebaseConfigured: true,
  loginWithGoogle: async () => {}, logoutUser: async () => {}, completeRedirectLogin: async () => null,
  signInWithEmail: async () => {}, signUpWithEmail: async () => {}, sendPasswordReset: async () => {}, resendVerificationEmail: async () => {}, refreshVerifiedStatus: async () => false,
}));
vi.mock("firebase/firestore", () => ({
  doc: (_db, ...p) => ({ path: p.join("/") }),
  collection: (_db, ...p) => ({ path: p.join("/"), isCol: true }),
  query: (c) => c, where: () => ({}), orderBy: () => ({}), limit: () => ({}),
  onSnapshot: (ref, cb) => {
    if (ref.path.startsWith("clinicStaff/")) cb({ exists: () => Boolean(h.member), data: () => h.member });
    else if (ref.isCol && ref.path.endsWith("/audit")) cb({ docs: h.audit.map((d) => ({ data: () => d })) });
    else if (ref.isCol) cb({ docs: [] });
    else cb({ exists: () => false, data: () => undefined });
    return () => {};
  },
  setDoc: async (ref, data) => { h.writes.push(["set", ref.path, data]); },
  updateDoc: async (ref, data) => { h.writes.push(["update", ref.path, data]); },
  deleteDoc: async (ref) => { h.writes.push(["delete", ref.path]); },
  getDoc: async () => ({ exists: () => false }),
}));

import App from "../src/App.jsx";

const member = (o = {}) => ({ email: "staff@example.com", clinicId: "clinicA", clinicName: "Smile Dental", role: "dentist", branchIds: [], status: "active", active: true, ...o });
const type = (el, value) => fireEvent.change(el, { target: { value } });
const navLabels = () => within(screen.getAllByRole("navigation")[0]).getAllByRole("button").map((b) => b.textContent.trim());

beforeEach(() => { cleanup(); localStorage.clear(); h.writes.length = 0; h.audit = []; h.member = null; h.user = { ...h.user, uid: "u-staff", email: "staff@example.com" }; });

describe("role-based logins in the app", () => {
  it("limits a dentist's menu, works inside the owner's clinic, and never writes billing or staff data", async () => {
    h.member = member({ role: "dentist" });
    render(<App />);
    expect(await screen.findByTestId("member-role")).toBeTruthy();
    expect(screen.getByTestId("member-role").textContent).toBe("Dentist at Smile Dental");
    const labels = navLabels();
    expect(labels).toContain("Appointments Diary");
    ["Billing & Invoices", "Reports", "Practice Profile", "MeriDent Connect", "Employee Roles & Roster", "Stock Maintenance"].forEach((l) => expect(labels).not.toContain(l));

    fireEvent.click(await screen.findByText("Add Patient"));
    const form = (await screen.findByText("Add New Patient")).closest("form");
    const field = (label) => within(form).getAllByText(new RegExp("^" + label))[0].parentElement.querySelector("input,select");
    type(field("Full Name"), "Role Patient"); type(field("Age"), "30"); type(field("Gender"), "Female"); type(field("WhatsApp Phone"), "9876543210");
    fireEvent.click(within(form).getByLabelText(/agrees to dental examination/i));
    fireEvent.submit(form);
    await waitFor(() => expect(h.writes.some((w) => w[1].startsWith("clinics/clinicA/patients/"))).toBe(true));
    // the member's own cache, never the owner's
    expect(localStorage.getItem("merident_clinicA_patients")).toBeNull();
    expect(JSON.parse(localStorage.getItem("merident_clinicA_su-staff_patients") || "[]").length).toBe(1);
    const forbidden = h.writes.filter((w) => /clinics\/clinicA\/(invoices|inventory|employees|store)/.test(w[1]));
    expect(forbidden).toEqual([]);
  });

  it("shows a receptionist billing but not reports, and hides other branches", async () => {
    h.member = member({ role: "receptionist", branchIds: ["b2"] });
    localStorage.setItem("merident_clinicA_su-staff_profile", JSON.stringify({ name: "Smile", branches: [{ id: "main", name: "Main branch" }, { id: "b2", name: "Peelamedu" }] }));
    localStorage.setItem("merident_clinicA_su-staff_patients", JSON.stringify([
      { id: "P1", name: "Main Mani", phone: "9876543210", age: "30", gender: "Male", registeredDate: "01/11/2026" },
      { id: "P2", name: "Peela Priya", phone: "9876543211", age: "28", gender: "Female", registeredDate: "01/11/2026", branchId: "b2" },
    ]));
    render(<App />);
    expect(await screen.findByText("Peela Priya")).toBeTruthy();
    expect(screen.queryByText("Main Mani")).toBeNull();
    expect(screen.queryByLabelText("Branch")).toBeNull();
    const labels = navLabels();
    expect(labels).toContain("Billing & Invoices");
    expect(labels).not.toContain("Reports");
  });

  it("asks before joining a clinic and accepts only on request", async () => {
    h.member = member({ role: "receptionist", status: "invited" });
    render(<App />);
    const dlg = await screen.findByRole("dialog", { name: "Team invitation" });
    expect(dlg.textContent).toMatch(/Smile Dental invited you as Receptionist/);
    expect(screen.queryByTestId("member-role")).toBeNull(); // still in own workspace
    expect(navLabels()).toContain("Practice Profile");
    fireEvent.click(within(dlg).getByText("Accept"));
    await waitFor(() => expect(h.writes).toContainEqual(["update", "clinicStaff/staff@example.com", { status: "active" }]));
  });

  it("lets only the owner invite staff, and rejects the owner's own email", async () => {
    render(<App />);
    fireEvent.click((await screen.findAllByText("Practice Profile"))[0]);
    const card = await screen.findByTestId("team-card");
    type(within(card).getByLabelText("Staff email"), "staff@example.com");
    fireEvent.click(within(card).getByText("Invite"));
    expect((await within(card).findByRole("alert")).textContent).toMatch(/own login/);
    type(within(card).getByLabelText("Staff email"), "Nila@Example.com");
    type(within(card).getByLabelText("Role"), "manager");
    fireEvent.click(within(card).getByText("Invite"));
    await waitFor(() => expect(h.writes.some((w) => w[1] === "clinicStaff/nila@example.com")).toBe(true));
    const doc = h.writes.find((w) => w[1] === "clinicStaff/nila@example.com")[2];
    expect(doc).toMatchObject({ clinicId: "u-staff", role: "manager", status: "invited", active: true, email: "nila@example.com" });
  });
});

describe("activity log", () => {
  const fillPatient = async (name) => {
    fireEvent.click(await screen.findByText("Add Patient"));
    const form = (await screen.findByText("Add New Patient")).closest("form");
    const field = (label) => within(form).getAllByText(new RegExp("^" + label))[0].parentElement.querySelector("input,select");
    type(field("Full Name"), name); type(field("Age"), "30"); type(field("Gender"), "Female"); type(field("WhatsApp Phone"), "9876543210");
    fireEvent.click(within(form).getByLabelText(/agrees to dental examination/i));
    fireEvent.submit(form);
  };

  it("records who registered a patient, with their role", async () => {
    h.member = member({ role: "receptionist" });
    render(<App />);
    await fillPatient("Logged Lata");
    await waitFor(() => expect(h.writes.some((w) => w[1].startsWith("clinics/clinicA/audit/"))).toBe(true));
    const entry = h.writes.find((w) => w[1].startsWith("clinics/clinicA/audit/"))[2];
    expect(entry).toMatchObject({ action: "patient.add", subject: "Logged Lata", actorEmail: "staff@example.com", actorRole: "receptionist", actorUid: "u-staff" });
    expect(Object.keys(entry).sort()).toEqual(["action", "actorEmail", "actorRole", "actorUid", "at", "detail", "id", "subject"]);
  });

  it("shows the log to the owner but not to a dentist", async () => {
    h.audit = [
      { id: "1", at: "2026-11-10T10:00:00.000Z", actorUid: "u", actorEmail: "nila@example.com", actorRole: "receptionist", action: "payment.add", subject: "INV/26-27/0001", detail: "₹500.00 by UPI" },
      { id: "2", at: "2026-11-11T09:00:00.000Z", actorUid: "u", actorEmail: "dr@example.com", actorRole: "dentist", action: "patient.delete", subject: "Old Patient", detail: "" },
    ];
    render(<App />);
    fireEvent.click((await screen.findAllByText("Practice Profile"))[0]);
    const log = await screen.findByTestId("activity-log");
    const items = within(log).getAllByRole("listitem").map((li) => li.textContent);
    expect(items[0]).toMatch(/Deleted patient: Old Patient/); // newest first
    expect(items[1]).toMatch(/Recorded payment: INV\/26-27\/0001 \(₹500.00 by UPI\)/);
    type(within(log).getByLabelText("Filter by person"), "nila@example.com");
    expect(within(log).getAllByRole("listitem")).toHaveLength(1);
    type(within(log).getByLabelText("Search activity"), "zzz");
    expect(within(log).getByText("Nothing matches your search.")).toBeTruthy();
    cleanup();
    h.member = member({ role: "dentist" });
    render(<App />);
    await screen.findByTestId("member-role");
    expect(screen.queryByTestId("activity-log")).toBeNull();
  });
});
