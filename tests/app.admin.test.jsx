import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";

const h = vi.hoisted(() => ({ user: null, overview: null, beats: 0 }));

vi.mock("firebase/auth", () => ({ onAuthStateChanged: (_a, cb) => { setTimeout(() => cb(h.user), 0); return () => {}; } }));
vi.mock("../src/firebase", () => ({
  auth: {}, db: null, storage: null, firebaseConfigured: true,
  loginWithGoogle: async () => {}, signInWithEmail: async () => {}, signUpWithEmail: async () => {}, sendPasswordReset: async () => {},
  resendVerificationEmail: async () => {}, refreshVerifiedStatus: async () => true, logoutUser: async () => {}, completeRedirectLogin: async () => null,
}));
vi.mock("firebase/firestore", () => ({ collection: () => ({}), doc: () => ({}), setDoc: async () => {}, onSnapshot: () => () => {}, deleteDoc: async () => {} }));
vi.mock("../src/adminApi.js", () => ({ loadOverview: async () => h.overview, decideRequest: async () => ({}) }));
vi.mock("../src/heartbeat.js", () => ({ startHeartbeat: () => { h.beats += 1; return () => {}; } }));

import App from "../src/App.jsx";

const overview = {
  users: { total: 2, newLast7: 0, quiet30: 0 },
  presence: { onlineNow: 1, activeToday: 1, hoursToday: 0.5, hoursWeek: 2, dayTotals: [] },
  billing: { paidActive: 0, expired: 0, pending: 0, monthlyValue: 0 }, requests: [], clinics: [],
};
beforeEach(() => { cleanup(); localStorage.clear(); sessionStorage.clear(); sessionStorage.setItem("merident_nav", "Patients & Odontogram"); h.user = { uid: "u-founder", email: "boss@example.com", displayName: "Boss", emailVerified: true, providerData: [{ providerId: "google.com" }] }; h.overview = null; h.beats = 0; });

describe("founder lands on the admin dashboard", () => {
  it("opens the admin panel for an admin-only account without waiting for the clinic database", async () => {
    h.overview = { ...overview, adminOnly: true };
    render(<App />);
    expect(await screen.findByTestId("admin-dashboard")).toBeTruthy();
    expect(screen.queryByTestId("app-loading")).toBeNull();
  });

  it("keeps an admin-only account in the admin panel, with no way into the clinic app", async () => {
    h.overview = { ...overview, adminOnly: true };
    render(<App />);
    expect(await screen.findByTestId("admin-dashboard")).toBeTruthy();
    expect(screen.queryByText("Open my clinic")).toBeNull();
  });

  it("opens the dashboard for a founder, lets them open their clinic, and lets them come back", async () => {
    h.overview = overview;
    render(<App />);
    expect(await screen.findByTestId("admin-dashboard")).toBeTruthy();
    fireEvent.click(screen.getByText("Open my clinic"));
    expect(await screen.findByTestId("back-to-admin")).toBeTruthy();
    expect(screen.queryByTestId("admin-dashboard")).toBeNull();
    fireEvent.click(screen.getByTestId("back-to-admin"));
    expect(await screen.findByTestId("admin-dashboard")).toBeTruthy();
  });
  it("a normal clinic goes straight to the app and never sees admin controls", async () => {
    h.overview = null;
    render(<App />);
    await waitFor(() => expect(h.beats).toBeGreaterThan(0));
    await screen.findAllByText(/Patients/);
    expect(screen.queryByTestId("admin-dashboard")).toBeNull();
    expect(screen.queryByTestId("back-to-admin")).toBeNull();
  });
  it("starts the online-time heartbeat once the user is signed in and verified", async () => {
    render(<App />);
    await waitFor(() => expect(h.beats).toBe(1));
  });
});
