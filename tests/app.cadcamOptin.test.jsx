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
const stored = (n) => JSON.parse(localStorage.getItem(KEY(n)) || "[]");

async function openApp() {
  render(<App />);
  await screen.findAllByText("Patients & Odontogram");
}
const nav = (label) => fireEvent.click(screen.getAllByText(label)[0]);
const input = (container, label) => {
  const lab = within(container).getAllByText(new RegExp("^" + label))[0];
  return lab.parentElement.querySelector("input,select");
};
const type = (el, value) => fireEvent.change(el, { target: { value } });

beforeEach(() => { cleanup(); localStorage.clear(); sessionStorage.setItem("merident_nav", "Patients & Odontogram"); });

async function fillPatient(form, o = {}) {
  type(input(form, "Full Name"), o.name ?? "Asha Devi");
  type(input(form, "Age"), o.age ?? "34");
  type(input(form, "Gender"), o.gender ?? "Female");
  type(input(form, "WhatsApp Phone"), o.phone ?? "+91 98765 43210");
}

describe("CAD/CAM tab is opt-in", () => {
  const seed = (cases) => localStorage.setItem(KEY("patients"), JSON.stringify([{ id: "P1", name: "Cad Patient", phone: "9876543210", age: "30", gender: "Female", registeredDate: "01/11/2026", visits: [], ...(cases ? { cadCases: cases } : {}) }]));
  const openChart = async () => { await openApp(); nav("Patients & Odontogram"); fireEvent.click(await screen.findByText("Cad Patient")); await screen.findByRole("button", { name: "Visit Notes" }); };

  it("is hidden until the clinic turns it on", async () => {
    seed();
    await openChart();
    expect(screen.queryByRole("button", { name: "CAD/CAM" })).toBeNull();
  });
  it("shows when the clinic setting is on", async () => {
    seed();
    localStorage.setItem(KEY("profile"), JSON.stringify({ name: "Clinic", cadcam: true }));
    await openChart();
    expect(screen.getByRole("button", { name: "CAD/CAM" })).toBeTruthy();
  });
  it("stays reachable for a patient who already has a saved case", async () => {
    seed([{ id: "C1", restoration: "Crown", material: "Zirconia", teeth: "36", stage: "scanned", dates: {} }]);
    await openChart();
    expect(screen.getByRole("button", { name: "CAD/CAM" })).toBeTruthy();
  });
  it("the Settings switch saves the choice", async () => {
    seed();
    await openApp();
    nav("Settings");
    fireEvent.click(await screen.findByLabelText(/Use CAD\/CAM/));
    await waitFor(() => expect(JSON.parse(localStorage.getItem(KEY("profile"))).cadcam).toBe(true));
  });
});
