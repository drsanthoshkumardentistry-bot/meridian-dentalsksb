import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within, waitFor, cleanup } from "@testing-library/react";

const h = vi.hoisted(() => ({
  user: { uid: "u-owner", email: "owner@example.com", displayName: "Owner", emailVerified: true, providerData: [{ providerId: "google.com" }], metadata: { creationTime: "2026-01-01T00:00:00Z" } },
  plan: { plan: "", paidUntil: 0 },
  member: null,
  writes: [],
  audit: [],
  silent: false,
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
    if (ref.path.startsWith("clinicStaff/")) { if (!h.silent) cb({ exists: () => Boolean(h.member), data: () => h.member }); }
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

vi.mock("../src/plan.js", async () => ({ ...(await vi.importActual("../src/plan.js")), PRICING_LIVE: true }));
vi.mock("../src/planApi.js", async () => ({ ...(await vi.importActual("../src/planApi.js")), loadMyPlan: async () => h.plan, loadMyRequest: async () => ({ status: "" }) }));
import App from "../src/App.jsx";

const DAY = 86400000;
beforeEach(() => { cleanup(); localStorage.clear(); sessionStorage.setItem("merident_nav", "Patients & Odontogram"); h.writes.length = 0; h.audit = []; h.silent = false; h.member = null; });

describe("plan ended in the real app", () => {
  it("keeps everything working, with a banner, during the grace days", async () => {
    h.plan = { plan: "pro", paidUntil: Date.now() - 2 * DAY };
    render(<App />);
    expect((await screen.findByTestId("plan-banner")).textContent).toMatch(/plan ended on/);
    expect(screen.queryByTestId("plan-ended-screen")).toBeNull();
  });
  it("goes view-only after the grace days: banner says so", async () => {
    h.plan = { plan: "pro", paidUntil: Date.now() - 15 * DAY };
    render(<App />);
    expect((await screen.findByRole("alert", {}, { timeout: 3000 })).textContent).toMatch(/View-only mode/);
    expect(screen.queryByTestId("plan-ended-screen")).toBeNull();
  });
  it("opens to downloads only after 30 days, and shows nothing deleted", async () => {
    h.plan = { plan: "pro", paidUntil: Date.now() - 45 * DAY };
    render(<App />);
    expect(await screen.findByTestId("plan-ended-screen")).toBeTruthy();
    expect(screen.getByText(/nothing has been deleted/)).toBeTruthy();
    expect(h.writes.filter((w) => w[1].startsWith("clinics/"))).toEqual([]);
  });
  it("never locks a clinic out when the plan cannot be read", async () => {
    h.plan = { plan: "", paidUntil: 0, failed: true };
    render(<App />);
    await waitFor(() => expect(screen.queryByTestId("plan-ended-screen")).toBeNull());
    expect(screen.queryByTestId("plan-banner")).toBeNull();
  });
  it("lets a paid-up clinic work normally", async () => {
    h.plan = { plan: "pro", paidUntil: Date.now() + 20 * DAY };
    render(<App />);
    await waitFor(() => expect(screen.queryByTestId("plan-ended-screen")).toBeNull());
    expect(screen.queryByTestId("plan-banner")).toBeNull();
  });
});
