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

const KEY = (n) => `merident_u-test_${n}`;
beforeEach(() => { cleanup(); localStorage.clear(); });

describe("damaged saved data", () => {
  it("opens every main screen when the saved lists hold blank or wrong entries", async () => {
    localStorage.setItem(KEY("patients"), JSON.stringify([null, 5, "x", { id: "p1", name: "Asha", phone: "9876543210", referrals: [null], visits: [null] }]));
    localStorage.setItem(KEY("appointments"), JSON.stringify([null, { id: "a1", patientId: "p1", date: "2026-11-12", status: "Scheduled" }]));
    localStorage.setItem(KEY("invoices"), JSON.stringify([null, { id: "i1", patientId: "p1", patient: "Asha", total: 500, paid: 0, items: [{ name: "x", qty: 1, price: 500 }] }]));
    localStorage.setItem(KEY("inventory"), JSON.stringify("not a list"));
    localStorage.setItem(KEY("queue"), JSON.stringify([null]));
    localStorage.setItem(KEY("profile"), JSON.stringify("oops"));
    render(<App />);
    await screen.findAllByText("Patients & Odontogram");
    for (const label of ["Patients & Odontogram", "Appointments Diary", "Billing & Invoices"]) {
      const el = screen.queryAllByText(label)[0];
      if (el) fireEvent.click(el);
    }
    expect(screen.queryByText(/something went wrong/i)).toBeNull();
    expect(screen.getAllByText("Asha").length).toBeGreaterThan(0);
  });
});
