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

describe("a full or blocked device storage", () => {
  it("does not crash the app and tells the person the offline copy is off", async () => {
    localStorage.setItem(KEY("patients"), JSON.stringify([{ id: "p1", name: "Asha", phone: "9876543210" }]));
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("The quota has been exceeded.", "QuotaExceededError"); });
    render(<App />);
    await screen.findAllByText("Patients & Odontogram");
    fireEvent.click(screen.queryAllByText("Patients & Odontogram")[0]);
    expect(await screen.findByText(/out of space for an offline copy/i)).toBeTruthy();
    expect(screen.queryByText(/something went wrong/i)).toBeNull();
    expect(screen.getAllByText("Asha").length).toBeGreaterThan(0);
    spy.mockRestore();
  });
});
