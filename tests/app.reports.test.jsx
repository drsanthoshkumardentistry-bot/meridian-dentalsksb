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
import { currentMonthKey } from "../src/reports.js";
import { computeInvoiceTotals } from "../src/billing.js";

const KEY = (n) => `merident_u-test_${n}`;

beforeEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

const today = () => new Date().toLocaleDateString("en-IN");

const seed = () => {
  const t = today();
  localStorage.setItem(
    KEY("invoices"),
    JSON.stringify([
      { id: "INV/2026-27/0001", patient: "Ravi", treatment: "Scaling", date: t, ...computeInvoiceTotals({ amount: 1000, taxCategory: "therapeutic" }), payments: [{ date: t, mode: "Cash", amountP: 100000 }] },
      { id: "INV/2026-27/0002", patient: "=EVIL()", treatment: "Whitening", date: t, ...computeInvoiceTotals({ amount: 10000, taxCategory: "cosmetic" }), payments: [{ date: t, mode: "UPI", amountP: 500000 }] },
    ])
  );
};

async function openReports() {
  render(<App />);
  await screen.findAllByText("Patients & Odontogram");
  fireEvent.click(screen.getAllByText("Reports")[0]);
  return screen.findByTestId("reports-screen");
}

describe("Reports screen", () => {
  it("shows totals and GST for the current month", async () => {
    seed();
    const screenEl = await openReports();
    expect(within(screenEl).getAllByText("₹6,000.00").length).toBeGreaterThan(0); // received
    expect(within(screenEl).getAllByText("₹1,800.00").length).toBeGreaterThan(0); // GST payable
    expect(within(screenEl).getByText("₹6,800.00")).toBeTruthy(); // outstanding
  });

  it("downloads a spreadsheet with formula-safe cells", async () => {
    seed();
    let blobText = "";
    globalThis.URL.createObjectURL = (b) => { blobText = b; return "blob:x"; };
    globalThis.URL.revokeObjectURL = () => {};
    const screenEl = await openReports();
    fireEvent.click(within(screenEl).getByText(/GST register/));
    const text = await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.readAsText(blobText);
    });
    expect(text).toContain("'=EVIL()");
    expect(text).toContain("TOTAL");
    expect(text).toContain(currentMonthKey().slice(0, 4));
  });

  it("shows an empty state for a month without payments", async () => {
    const screenEl = await openReports();
    expect(within(screenEl).getByText(/No payments recorded this month/)).toBeTruthy();
  });
});
