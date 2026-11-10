import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within, waitFor, cleanup } from "@testing-library/react";

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: (_auth, cb) => {
    setTimeout(() => cb({ uid: "u-test", email: "t@example.com", displayName: "Test", emailVerified: true, providerData: [{ providerId: "google.com" }] }), 0);
    return () => {};
  },
}));
vi.mock("../src/firebase", () => ({
  auth: {}, db: null, storage: null, firebaseConfigured: true,
  loginWithGoogle: async () => {}, logoutUser: async () => {}, completeRedirectLogin: async () => null,
  signInWithEmail: async () => {}, signUpWithEmail: async () => {}, sendPasswordReset: async () => {}, resendVerificationEmail: async () => {}, refreshVerifiedStatus: async () => false,
}));
vi.mock("firebase/firestore", () => ({
  collection: () => ({}), doc: () => ({}), setDoc: async () => {}, onSnapshot: () => () => {}, deleteDoc: async () => {},
}));


import App from "../src/App.jsx";
import { dateKey, addDays } from "../src/reminders.js";

const KEY = (n) => `merident_u-test_${n}`;

beforeEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

async function openDashboard() {
  render(<App />);
  await screen.findAllByText("Patients & Odontogram");
  fireEvent.click(screen.getAllByText("Dashboard")[0]);
  return screen.findByTestId("today-actions");
}

describe("Dashboard today's actions", () => {
  it("says all caught up when nothing is due", async () => {
    const card = await openDashboard();
    expect(within(card).getByText("All caught up")).toBeTruthy();
    expect(within(card).getAllByText("Nothing to send").length).toBe(3);
  });

  it("counts due reminders and recalls and jumps to the diary", async () => {
    const tomorrow = dateKey(addDays(new Date(), 1));
    localStorage.setItem(KEY("appointments"), JSON.stringify([
      { id: "A1", patientName: "Ravi", phone: "9876543210", date: tomorrow, time: "10:30", doctor: "Dr", procedure: "Scaling", status: "Confirmed" },
    ]));
    localStorage.setItem(KEY("patients"), JSON.stringify([
      { id: "P1", name: "Meena", phone: "9876543211", registeredDate: "01/01/2025", consent: { treatment: true, whatsapp: true } },
    ]));
    const card = await openDashboard();
    expect(within(card).queryByText("All caught up")).toBeNull();
    const reminders = within(card).getByText("Appointment reminders").closest("button");
    expect(within(reminders).getByText("1")).toBeTruthy();
    const recalls = within(card).getByText("Patients due for recall").closest("button");
    expect(within(recalls).getByText("1")).toBeTruthy();
    fireEvent.click(reminders);
    expect(await screen.findByTestId("reminders-panel")).toBeTruthy();
  });
});
