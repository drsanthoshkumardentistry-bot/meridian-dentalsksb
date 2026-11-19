import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AccountProtection, { signInMethod } from "../src/components/AccountProtection.jsx";

describe("AccountProtection", () => {
  it("detects the sign-in method", () => {
    expect(signInMethod({ providerData: [{ providerId: "google.com" }] })).toBe("google");
    expect(signInMethod({ providerData: [{ providerId: "password" }] })).toBe("password");
    expect(signInMethod(null)).toBe("other");
  });
  it("tells Google users to turn on 2-Step Verification and password users to switch", () => {
    const { unmount } = render(<AccountProtection user={{ providerData: [{ providerId: "google.com" }] }} />);
    expect(screen.getByText(/2-Step Verification/)).toBeTruthy();
    expect(screen.queryByText(/email and password/)).toBeNull();
    unmount();
    render(<AccountProtection user={{ providerData: [{ providerId: "password" }] }} />);
    expect(screen.getByText(/email and password/)).toBeTruthy();
  });
});
