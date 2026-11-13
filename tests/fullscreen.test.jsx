import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import FullscreenButton from "../src/components/FullscreenButton.jsx";

afterEach(() => { cleanup(); delete document.documentElement.requestFullscreen; });

describe("FullscreenButton", () => {
  it("renders nothing when the browser cannot go full screen", () => {
    delete document.documentElement.requestFullscreen;
    const { container } = render(<FullscreenButton />);
    expect(container.firstChild).toBeNull();
  });
  it("requests full screen on click", () => {
    const req = vi.fn(() => Promise.resolve());
    document.documentElement.requestFullscreen = req;
    render(<FullscreenButton />);
    fireEvent.click(screen.getByRole("button", { name: "Full screen" }));
    expect(req).toHaveBeenCalled();
  });
});
