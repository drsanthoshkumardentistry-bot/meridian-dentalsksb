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

describe("invoice amount limit", () => {
  it("refuses an amount above Rs 1 crore with a clear message instead of silently saving a smaller bill", async () => {
    await openApp();
    nav("Billing & Invoices");
    fireEvent.click(await screen.findByText("New Invoice"));
    const form = (await screen.findAllByText("Patient Name *"))[0].closest("form");
    type(form.querySelector('input[list="patient-options"]'), "Big Bill");
    type(form.querySelector('input[placeholder^="e.g. Root Canal"]'), "Scaling");
    type(form.querySelector('input[type="number"]'), "1000000000000");
    fireEvent.submit(form);
    expect(await screen.findByText(/above the limit of Rs 1,00,00,000/i)).toBeTruthy();
    expect(stored("invoices").length).toBe(0);
    type(form.querySelector('input[type="number"]'), "5000");
    fireEvent.submit(form);
    await waitFor(() => expect(stored("invoices").length).toBe(1));
    expect(stored("invoices")[0].totalP).toBe(500000);
  });
});
