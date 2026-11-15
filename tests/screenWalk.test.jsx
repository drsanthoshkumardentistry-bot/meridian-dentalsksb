// Opens every menu screen with hostile saved data (script tags, emoji, Tamil, giant text, odd money and dates) and
// checks nothing crashes and nothing from the data runs as code.
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: (_a, cb) => { setTimeout(() => cb({ uid: "u-test", email: "t@example.com", displayName: "Test", emailVerified: true, providerData: [{ providerId: "google.com" }] }), 0); return () => {}; },
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
import ErrorBoundary from "../src/components/ErrorBoundary.jsx";
import { SCREENS } from "../src/roles.js";
import { computeInvoiceTotals } from "../src/billing.js";

const KEY = (n) => `merident_u-test_${n}`;
const HOSTILE = [
  "<img src=x onerror=window.__xss=1>", "<script>window.__xss=1</script>", "\"'><svg onload=window.__xss=1>", "javascript:window.__xss=1",
  "சந்தோஷ் குமார்", "👩‍⚕️🦷😀", "A".repeat(10000), "", " ", "=EVIL()", "@SUM(1+1)", "Ravi\nKumar\ttab", "‮evil", "0", "null", "undefined",
];
const today = new Date().toISOString().slice(0, 10);
const patients = HOSTILE.map((name, i) => ({
  id: `p${i}`, name, age: i % 2 ? "-5" : "999", gender: "Other", phone: i % 3 ? "9876543210" : "abc", address: HOSTILE[(i + 1) % HOSTILE.length],
  notes: HOSTILE[(i + 2) % HOSTILE.length], medicalHistory: HOSTILE[(i + 3) % HOSTILE.length], allergies: HOSTILE[(i + 4) % HOSTILE.length], visits: i % 2 ? [null, { date: "garbage", notes: HOSTILE[i] }] : [], referrals: [],
}));
const amounts = [0, -500, 1e12, 0.1 + 0.2, NaN, 99999999999999, 1.005, 1e-7];
const invoices = amounts.map((amount, i) => ({
  id: `INV/2026-27/${String(i + 1).padStart(4, "0")}`, patient: HOSTILE[i], treatment: HOSTILE[i + 1], date: i % 3 ? today : ["garbage", "2026-02-30", "2028-02-29"][i % 3],
  ...(Number.isFinite(amount) ? computeInvoiceTotals({ amount, taxCategory: "therapeutic" }) : { subtotalP: NaN, totalP: NaN }),
  payments: [{ date: today, mode: "Cash", amountP: i % 2 ? -100 : 1e15 }, null],
}));
const appointments = ["garbage", "2026-02-30", "2028-02-29", today, "", null].map((date, i) => ({
  id: `A${i}`, patientName: HOSTILE[i], phone: "9876543210", date, time: ["25:99", "", "00:00", "23:59", "9", null][i], doctor: HOSTILE[i + 1], procedure: HOSTILE[i + 2], status: ["Confirmed", "weird", "", "Completed", "Cancelled", null][i],
}));

let errors;
beforeEach(() => {
  cleanup(); localStorage.clear(); sessionStorage.clear(); delete window.__xss;
  localStorage.setItem(KEY("patients"), JSON.stringify(patients));
  localStorage.setItem(KEY("invoices"), JSON.stringify(invoices));
  localStorage.setItem(KEY("appointments"), JSON.stringify(appointments));
  errors = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => { errors.mockRestore(); });

const why = () => errors.mock.calls.map((c) => c.map((x) => (x && x.stack) || String(x)).join(" ").slice(0, 600)).join(" || ");
const crashed = () => errors.mock.calls.some((c) => String(c[0]).includes("MeriDent crashed")) || !!document.querySelector("[role=alert] h1");

describe("every screen survives hostile saved data", () => {
  it.each(SCREENS)("%s", async (label) => {
    sessionStorage.setItem("merident_nav", label);
    render(<ErrorBoundary><App /></ErrorBoundary>);
    await screen.findAllByText("Patients & Odontogram");
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
    const other = SCREENS.filter((s) => s !== label)[0];
    fireEvent.click(screen.getAllByText(label)[0]);
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
    fireEvent.click(screen.getAllByText(other)[0]);
    fireEvent.click(screen.getAllByText(label)[0]);
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
    expect(crashed(), `crash on ${label}: ${errors.mock.calls.map((c) => String(c[0]).slice(0, 200)).join(" | ")}`).toBe(false);
    expect(window.__xss).toBeUndefined();
    expect(document.querySelector("script:not([type])")).toBeNull();
    expect(document.querySelector("img[onerror], svg[onload]")).toBeNull();
  }, 60000);
});

describe("hostile text is shown as plain text", () => {
  it("a script-tag patient name appears literally and runs nothing", async () => {
    sessionStorage.setItem("merident_nav", "Patients & Odontogram");
    render(<ErrorBoundary><App /></ErrorBoundary>);
    await screen.findAllByText("Patients & Odontogram");
    await act(async () => { await new Promise((r) => setTimeout(r, 100)); });
    expect(document.body.textContent).toContain("<script>window.__xss=1</script>");
    expect(window.__xss).toBeUndefined();
  });
});

describe("scale", () => {
  it("opens Patients and Dashboard with 5,000 patients in a reasonable time", async () => {
    localStorage.setItem(KEY("patients"), JSON.stringify(Array.from({ length: 5000 }, (_, i) => ({ id: `P${i}`, name: `Patient ${i}`, age: "30", gender: "Female", phone: "9876543210", visits: [], referrals: [] }))));
    const t0 = performance.now();
    sessionStorage.setItem("merident_nav", "Patients & Odontogram");
    render(<ErrorBoundary><App /></ErrorBoundary>);
    await screen.findAllByText("Patients & Odontogram");
    await act(async () => { await new Promise((r) => setTimeout(r, 100)); });
    const patientsMs = performance.now() - t0;
    expect(crashed(), why()).toBe(false);
    fireEvent.click(screen.getAllByText("Dashboard")[0]);
    await act(async () => { await new Promise((r) => setTimeout(r, 100)); });
    const total = performance.now() - t0;
    console.log(`5000 patients: Patients screen ${Math.round(patientsMs)} ms, plus Dashboard ${Math.round(total - patientsMs)} ms (jsdom)`);
    expect(crashed()).toBe(false);
    expect(total).toBeLessThan(15000);
  }, 60000);
});
