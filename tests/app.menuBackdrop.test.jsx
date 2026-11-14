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
    expect(document.querySelector("aside.rail").className).toMatch(/rail-open/);
    fireEvent.click(backdrop);
    expect(screen.queryByTestId("menu-backdrop")).toBeNull();
    expect(document.querySelector("aside.rail").className).not.toMatch(/rail-open/);
  });

  it("does not open on hover or focus, only from the menu button, and Escape closes it", async () => {
    render(<App />);
    await screen.findAllByText("Patients & Odontogram");
    const rail = document.querySelector("aside.rail");
    expect(rail.className).not.toMatch(/hover:w-64|focus-within:w-64/);
    fireEvent.mouseEnter(rail);
    fireEvent.focus(screen.getAllByText("Dashboard")[0]);
    expect(screen.queryByTestId("menu-backdrop")).toBeNull();
    fireEvent.click(screen.getByLabelText("Open menu"));
    expect(screen.getByTestId("menu-backdrop")).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("menu-backdrop")).toBeNull();
  });
});
