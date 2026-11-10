import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../src/App.jsx";

describe("deployment without Firebase keys", () => {
  it("shows the landing page and a clear setup notice", async () => {
    render(<App />);
    expect(await screen.findByText(/Run your dental clinic/i)).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toMatch(/VITE_FIREBASE/);
    expect(document.body.textContent).not.toMatch(/span_\d/);
  });
});
