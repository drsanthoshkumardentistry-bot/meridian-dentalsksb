import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LandingShell from "../src/components/LandingShell.jsx";

describe("LandingShell", () => {
  it("shows the landing page and sends every sign-in control to /login", () => {
    const assign = vi.fn();
    const real = window.location;
    Object.defineProperty(window, "location", { configurable: true, value: { ...real, assign, pathname: "/", search: "" } });
    render(<LandingShell />);
    fireEvent.click(screen.getByText("Use email and password instead"));
    expect(assign).toHaveBeenCalledWith("/login");
    expect(screen.queryByLabelText(/password/i)).toBeNull();
    Object.defineProperty(window, "location", { configurable: true, value: real });
  });
});
