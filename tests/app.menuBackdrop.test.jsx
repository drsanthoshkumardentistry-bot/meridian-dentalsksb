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

beforeEach(() => { cleanup(); localStorage.clear(); });

describe("phone menu", () => {
  it("closes when the area outside the menu is tapped", async () => {
    render(<App />);
    await screen.findAllByText("Patients & Odontogram");
    expect(screen.queryByTestId("menu-backdrop")).toBeNull();
    fireEvent.click(screen.getByLabelText("Open menu"));
    const backdrop = screen.getByTestId("menu-backdrop");
    expect(backdrop.className).toMatch(/md:hidden/);
    fireEvent.click(backdrop);
    expect(screen.queryByTestId("menu-backdrop")).toBeNull();
  });
});
