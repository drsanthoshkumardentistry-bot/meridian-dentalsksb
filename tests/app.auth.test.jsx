import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup, act } from "@testing-library/react";

const h = vi.hoisted(() => ({ user: null, listeners: [], calls: [], failSignIn: false, verifyResult: false }));

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: (_auth, cb) => {
    h.listeners.push(cb);
    setTimeout(() => cb(h.user), 0);
    return () => {};
  },
}));
vi.mock("../src/firebase", () => ({
  auth: {}, db: null, storage: null, firebaseConfigured: true,
  loginWithGoogle: async () => { h.calls.push(["google"]); },
  signInWithEmail: async (e, p) => {
    h.calls.push(["signin", e, p]);
    if (h.failSignIn) { const err = new Error("raw firebase text"); err.code = "auth/invalid-credential"; throw err; }
  },
  signUpWithEmail: async (n, e, p) => { h.calls.push(["signup", n, e, p]); },
  sendPasswordReset: async (e) => { h.calls.push(["reset", e]); },
  resendVerificationEmail: async () => { h.calls.push(["resend"]); },
  refreshVerifiedStatus: async () => h.verifyResult,
  logoutUser: async () => { h.calls.push(["logout"]); h.listeners.forEach((cb) => cb(null)); },
  completeRedirectLogin: async () => null,
}));
vi.mock("firebase/firestore", () => ({
  collection: () => ({}), doc: () => ({}), setDoc: async () => {}, onSnapshot: () => () => {}, deleteDoc: async () => {},
}));

import App from "../src/App.jsx";
import ErrorBoundary from "../src/components/ErrorBoundary.jsx";
import { friendlyAuthError, usesPasswordLogin, isValidEmailAddress } from "../src/authErrors.js";

const googleUser = { uid: "u-g", email: "g@example.com", displayName: "G", emailVerified: true, providerData: [{ providerId: "google.com" }] };
const passwordUser = (verified) => ({ uid: "u-pw", email: "pw@example.com", displayName: "PW", emailVerified: verified, providerData: [{ providerId: "password" }] });

beforeEach(() => { cleanup(); localStorage.clear(); h.user = null; h.listeners = []; h.calls = []; h.failSignIn = false; h.verifyResult = false; });
afterEach(() => { vi.useRealTimers(); });

const openEmailForm = async () => {
  fireEvent.click(await screen.findByText("Use email and password instead"));
  return screen.findByLabelText("Email");
};

describe("authentication gate", () => {
  it("signed-out visitors only see the landing page", async () => {
    render(<App />);
    expect(await screen.findByText(/Chart the tooth\. Bill the visit/i)).toBeTruthy();
    expect(screen.queryByText("Patients & Odontogram")).toBeNull();
  });

  it("email form validates input before calling Firebase", async () => {
    render(<App />);
    const email = await openEmailForm();
    const pw = screen.getByLabelText("Password");
    const submit = () => fireEvent.click(document.querySelector('button[type="submit"]'));
    fireEvent.change(email, { target: { value: "bad" } });
    fireEvent.change(pw, { target: { value: "12345678" } });
    submit();
    expect(await screen.findByText(/valid email address/i)).toBeTruthy();
    fireEvent.change(email, { target: { value: "dr@clinic.in" } });
    fireEvent.change(pw, { target: { value: "short" } });
    submit();
    expect(await screen.findByText(/at least 8 characters/i)).toBeTruthy();
    expect(h.calls.length).toBe(0);
    fireEvent.change(pw, { target: { value: "longenough1" } });
    submit();
    await waitFor(() => expect(h.calls).toContainEqual(["signin", "dr@clinic.in", "longenough1"]));
  });

  it("shows a friendly message when sign-in fails", async () => {
    h.failSignIn = true;
    render(<App />);
    const email = await openEmailForm();
    fireEvent.change(email, { target: { value: "dr@clinic.in" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "wrongpass1" } });
    fireEvent.click(document.querySelector('button[type="submit"]'));
    expect(await screen.findByText("Email or password is incorrect.")).toBeTruthy();
    expect(screen.queryByText(/raw firebase text/)).toBeNull();
  });

  it("create account needs a name, and password reset needs an email", async () => {
    render(<App />);
    const email = await openEmailForm();
    fireEvent.click(screen.getByText("Forgot password?"));
    expect(await screen.findByText(/Enter your email address above first/i)).toBeTruthy();
    fireEvent.change(email, { target: { value: "dr@clinic.in" } });
    fireEvent.click(screen.getByText("Forgot password?"));
    expect(await screen.findByText(/password reset link has been sent/i)).toBeTruthy();
    expect(h.calls).toContainEqual(["reset", "dr@clinic.in"]);
    fireEvent.click(screen.getAllByText("Create account")[0]);
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "longenough1" } });
    fireEvent.click(document.querySelector('button[type="submit"]'));
    expect(await screen.findByText(/Enter your name or clinic name/i)).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Your name or clinic name/), { target: { value: "Smile Dental" } });
    fireEvent.click(document.querySelector('button[type="submit"]'));
    await waitFor(() => expect(h.calls).toContainEqual(["signup", "Smile Dental", "dr@clinic.in", "longenough1"]));
  });

  it("unverified email accounts are held at the verification screen and no data is touched", async () => {
    h.user = passwordUser(false);
    render(<App />);
    expect(await screen.findByText("Verify your email")).toBeTruthy();
    expect(screen.queryByText("Patients & Odontogram")).toBeNull();
    expect(Object.keys(localStorage).filter((k) => k.includes("u-pw")).length).toBe(0);

    fireEvent.click(screen.getByText("Send the email again"));
    expect(await screen.findByText(/Verification email sent/i)).toBeTruthy();
    expect(h.calls).toContainEqual(["resend"]);

    fireEvent.click(screen.getByText("I have verified my email"));
    expect(await screen.findByText(/not verified yet/i)).toBeTruthy();

    h.verifyResult = true;
    fireEvent.click(screen.getByText("I have verified my email"));
    expect((await screen.findAllByText("Patients & Odontogram")).length).toBeGreaterThan(0);
  });

  it("verified email accounts and Google accounts go straight in", async () => {
    h.user = passwordUser(true);
    render(<App />);
    expect((await screen.findAllByText("Patients & Odontogram")).length).toBeGreaterThan(0);
    cleanup();
    h.user = googleUser;
    render(<App />);
    expect((await screen.findAllByText("Patients & Odontogram")).length).toBeGreaterThan(0);
  });

  it("signing out returns to the landing page and stops data access", async () => {
    h.user = googleUser;
    render(<App />);
    await screen.findAllByText("Patients & Odontogram");
    fireEvent.click(screen.getByText("Sign out"));
    await waitFor(() => expect(h.calls).toContainEqual(["logout"]));
    expect(await screen.findByText(/Chart the tooth\. Bill the visit/i)).toBeTruthy();
  });

  it("new clinics are asked to complete their profile", async () => {
    h.user = googleUser;
    render(<App />);
    expect(await screen.findByText(/Complete your clinic profile/i)).toBeTruthy();
    fireEvent.click(screen.getByText("Open Practice Profile"));
    expect(await screen.findByText(/Dental Council Registration No/i)).toBeTruthy();
    expect(screen.queryByText(/Complete your clinic profile/i)).toBeNull();
  });
});

describe("idle sign-out", () => {
  it("warns at 29 minutes, can be extended, and signs out at 30 minutes of inactivity", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "setTimeout", "clearTimeout", "Date"] });
    h.user = googleUser;
    render(<App />);
    await act(async () => { await vi.advanceTimersByTimeAsync(50); });
    expect(screen.getAllByText("Patients & Odontogram").length).toBeGreaterThan(0);

    await act(async () => { await vi.advanceTimersByTimeAsync(29 * 60 * 1000 + 2000); });
    expect(screen.getByText("Still there?")).toBeTruthy();

    fireEvent.click(screen.getByText("Stay signed in"));
    expect(screen.queryByText("Still there?")).toBeNull();

    await act(async () => { await vi.advanceTimersByTimeAsync(29 * 60 * 1000 + 2000); });
    expect(screen.getByText("Still there?")).toBeTruthy();
    await act(async () => { await vi.advanceTimersByTimeAsync(62 * 1000); });
    expect(h.calls).toContainEqual(["logout"]);
    expect(screen.getByText(/signed out after 30 minutes of inactivity/i)).toBeTruthy();
    expect(screen.getByText(/Chart the tooth\. Bill the visit/i)).toBeTruthy();
  });

  it("activity resets the idle timer", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "setTimeout", "clearTimeout", "Date"] });
    h.user = googleUser;
    render(<App />);
    await act(async () => { await vi.advanceTimersByTimeAsync(50); });
    for (let i = 0; i < 4; i += 1) {
      await act(async () => { await vi.advanceTimersByTimeAsync(20 * 60 * 1000); });
      fireEvent.mouseMove(window);
    }
    expect(screen.queryByText("Still there?")).toBeNull();
    expect(h.calls.find((c) => c[0] === "logout")).toBeUndefined();
  });
});

describe("helpers", () => {
  it("maps Firebase error codes to plain language", () => {
    expect(friendlyAuthError({ code: "auth/email-already-in-use" })).toMatch(/already exists/);
    expect(friendlyAuthError({ code: "auth/popup-closed-by-user" })).toMatch(/closed/);
    expect(friendlyAuthError({ code: "auth/unauthorized-domain" })).toMatch(/Authorized domains/);
    expect(friendlyAuthError({ code: "auth/something-new" })).toMatch(/Something went wrong/);
    expect(friendlyAuthError(new Error("Firebase is not configured."))).toBe("Firebase is not configured.");
    expect(isValidEmailAddress("a@b.in")).toBe(true);
    expect(isValidEmailAddress("a@b")).toBe(false);
    expect(usesPasswordLogin({ providerData: [{ providerId: "password" }] })).toBe(true);
    expect(usesPasswordLogin({ providerData: [{ providerId: "google.com" }] })).toBe(false);
  });

  it("error boundary shows a friendly screen instead of a blank page", () => {
    const Boom = () => { throw new Error("kaboom"); };
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ErrorBoundary><Boom /></ErrorBoundary>);
    expect(screen.getByText("Something went wrong")).toBeTruthy();
    expect(screen.getByText("Reload MeriDent")).toBeTruthy();
    spy.mockRestore();
  });
});
