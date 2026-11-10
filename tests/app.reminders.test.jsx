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
const stored = (n) => JSON.parse(localStorage.getItem(KEY(n)) || "[]");

beforeEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

const seedAppointments = () => {
  const tomorrow = dateKey(addDays(new Date(), 1));
  localStorage.setItem(
    KEY("appointments"),
    JSON.stringify([
      { id: "A1", patientName: "Ravi Kumar", phone: "9876543210", date: tomorrow, time: "10:30", chair: "Chair 1", doctor: "Dr. T", procedure: "Scaling", status: "Confirmed" },
      { id: "A2", patientName: "No Phone", phone: "123", date: tomorrow, time: "11:00", chair: "Chair 1", doctor: "Dr. T", procedure: "Check", status: "Confirmed" },
    ])
  );
};

async function openDiary() {
  render(<App />);
  await screen.findAllByText("Patients & Odontogram");
  fireEvent.click(screen.getAllByText("Appointments Diary")[0]);
}

describe("WhatsApp reminders panel", () => {
  it("lists only patients with a valid number, opens WhatsApp and marks the reminder as sent", async () => {
    seedAppointments();
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    await openDiary();
    const panel = await screen.findByTestId("reminders-panel");
    expect(within(panel).getByText("Ravi Kumar")).toBeTruthy();
    expect(within(panel).queryByText("No Phone")).toBeNull();

    fireEvent.click(within(panel).getByText("Remind"));
    expect(open).toHaveBeenCalledTimes(1);
    const url = open.mock.calls[0][0];
    expect(url.startsWith("https://wa.me/919876543210?text=")).toBe(true);
    expect(decodeURIComponent(url)).toContain("Ravi Kumar");

    await waitFor(() => expect(stored("appointments").find((a) => a.id === "A1").reminders.dayBefore).toBeTruthy());
    await waitFor(() => expect(screen.queryByTestId("reminders-panel")).toBeNull());
    expect(screen.getAllByText("Reminder sent").length).toBe(1);
  });
});
