import React from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import LoginPage, { isLoginPath } from "../src/components/LoginPage.jsx";

afterEach(() => cleanup());

describe("separate Log In page", () => {
  it("recognises the /login address", () => {
    expect(isLoginPath("/login")).toBe(true);
    expect(isLoginPath("/login/")).toBe(true);
    expect(isLoginPath("/")).toBe(false);
    expect(isLoginPath("/loginx")).toBe(false);
  });

  it("sets its own page title and offers Google sign-in", () => {
    const onLoginClick = vi.fn();
    render(<LoginPage firebaseConfigured onLoginClick={onLoginClick} />);
    expect(document.title).toMatch(/^Log in/);
    fireEvent.click(screen.getByText("Continue with Google"));
    expect(onLoginClick).toHaveBeenCalled();
  });

  it("checks the email and password before signing in", () => {
    const onEmailSignIn = vi.fn();
    render(<LoginPage firebaseConfigured onEmailSignIn={onEmailSignIn} />);
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(screen.getByRole("alert").textContent).toMatch(/valid email/);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "dr@clinic.in" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "short" } });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(screen.getByRole("alert").textContent).toMatch(/8 characters/);
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "longenough1" } });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(onEmailSignIn).toHaveBeenCalledWith("dr@clinic.in", "longenough1");
  });

  it("creates an account with a name and shows server errors", () => {
    const onEmailSignUp = vi.fn();
    render(<LoginPage firebaseConfigured onEmailSignUp={onEmailSignUp} authError="Wrong password." />);
    expect(screen.getByText("Wrong password.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    fireEvent.change(screen.getByLabelText("Your name or clinic name"), { target: { value: "Smile Clinic" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "dr@clinic.in" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "longenough1" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Create account" }).pop());
    expect(onEmailSignUp).toHaveBeenCalledWith("Smile Clinic", "dr@clinic.in", "longenough1");
  });
});
