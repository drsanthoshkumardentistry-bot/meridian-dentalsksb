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

describe("Dr feedback flows in the real app", () => {
  const seed = (extra = {}, invs = []) => {
    localStorage.setItem(KEY("patients"), JSON.stringify([{ id: "P1", name: "Note Patient", phone: "9876543210", age: "30", gender: "Female", registeredDate: "01/11/2026", chiefComplaint: "Pain lower left", visits: [{ id: "V1", date: "2026-11-20", complaint: "Pain lower left", findings: "Deep caries 36", fromIntake: true }], ...extra }]));
    localStorage.setItem(KEY("invoices"), JSON.stringify(invs));
  };
  const open = async () => { await openApp(); nav("Patients & Odontogram"); fireEvent.click(await screen.findByText("Note Patient")); fireEvent.click(await screen.findByRole("button", { name: "Visit Notes" })); };

  it("opens the note with the registration complaint filled in", async () => {
    seed();
    await open();
    expect(screen.getByLabelText("Chief complaint").value).toBe("Pain lower left");
  });

  it("edits a saved note and shows the Edited on stamp", async () => {
    seed();
    await open();
    fireEvent.click(await screen.findByLabelText(/Edit visit note from 2026-11-20/));
    type(screen.getByLabelText("Findings"), "Deep caries 36. IOPA: periapical lesion");
    fireEvent.submit(screen.getByText("Update visit note").closest("form"));
    await waitFor(() => expect(stored("patients")[0].visits[0].findings).toMatch(/periapical/));
    expect(stored("patients")[0].visits).toHaveLength(1);
    expect((await screen.findByTestId("visit-edited")).textContent).toMatch(/^Edited on /);
  });

  it("registers with the NRH tick and with NKDA typed", async () => {
    await openApp();
    nav("Patients & Odontogram");
    fireEvent.click(await screen.findByText("Add Patient"));
    const form = (await screen.findByText("Add New Patient")).closest("form");
    await fillPatient(form, { name: "Nrh Person", phone: "9123456780" });
    fireEvent.click(within(form).getByLabelText(/No relevant history/));
    expect(within(form).getByPlaceholderText(/Ask the patient. Type None/).value).toBe("None / NRH");
    fireEvent.submit(form);
    await waitFor(() => expect(stored("patients")[0]).toMatchObject({ name: "Nrh Person", nrh: true, allergies: "None / NRH", conditions: "None / NRH" }));
  });

  it("registers with NKDA typed in drug allergies and the chart shows it", async () => {
    await openApp();
    nav("Patients & Odontogram");
    fireEvent.click(await screen.findByText("Add Patient"));
    const form = (await screen.findByText("Add New Patient")).closest("form");
    await fillPatient(form, { name: "Nk Person", phone: "9123456781" });
    type(within(form).getByPlaceholderText(/Type NKDA if none/), "NKDA");
    fireEvent.submit(form);
    await waitFor(() => expect(stored("patients")[0].allergies).toBe("NKDA"));
    expect((await screen.findByTestId("patient-history")).textContent).not.toMatch(/Not asked yet/);
  });

  const inv = (payments) => ({ id: "INV/9", patientId: "P1", patient: "Note Patient", paymentMode: "Cash", treatment: "RCT", subtotalP: 100000, discountP: 0, taxableP: 100000, gstRate: 0, cgstP: 0, sgstP: 0, taxP: 0, totalP: 100000, payments, date: "01/11/2026" });
  it("reverses a duplicate payment from the Payments window", async () => {
    seed({}, [inv([{ date: "01/11/2026", mode: "Cash", amountP: 100000 }, { date: "01/11/2026", mode: "UPI", amountP: 100000 }])]);
    await openApp();
    nav("Billing & Invoices");
    fireEvent.click((await screen.findAllByText("Payments"))[0]);
    fireEvent.click((await screen.findAllByRole("button", { name: /Reverse payment of/ }))[1]);
    type(screen.getByLabelText("Reason for reversing"), "entered twice");
    fireEvent.submit(screen.getByLabelText("Reverse payment"));
    await waitFor(() => expect(stored("invoices")[0].payments).toHaveLength(1));
    expect(stored("invoices")[0].reversedPayments[0]).toMatchObject({ reason: "entered twice" });
  });

  it("offers Void on a paid invoice", async () => {
    seed({}, [inv([{ date: "01/11/2026", mode: "Cash", amountP: 100000 }])]);
    await openApp();
    nav("Billing & Invoices");
    fireEvent.click(await screen.findByLabelText("Void invoice INV/9"));
    type(screen.getByLabelText("Reason"), "wrong patient");
    fireEvent.submit(screen.getByRole("dialog", { name: "Void invoice" }));
    await waitFor(() => expect(stored("invoices")[0].voided).toMatchObject({ reason: "wrong patient", reversedPaidP: 100000 }));
  });
});
