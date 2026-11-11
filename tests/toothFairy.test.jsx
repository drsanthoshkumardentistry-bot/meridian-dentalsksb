import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ToothFairy from "../src/components/ToothFairy.jsx";

afterEach(cleanup);

describe("Meri the tooth fairy", () => {
  it("can be tapped and says a few friendly things in turn", () => {
    render(<ToothFairy />);
    const btn = screen.getByLabelText(/Say hi to Meri/);
    expect(screen.queryByRole("status")).toBeNull();
    fireEvent.click(btn);
    expect(screen.getByRole("status").textContent).toMatch(/I'm Meri/);
    fireEvent.click(btn);
    expect(screen.getByRole("status").textContent).toMatch(/Chart the tooth/);
    for (let i = 0; i < 3; i++) fireEvent.click(btn);
    expect(screen.getByRole("status").textContent).toMatch(/I'm Meri/); // wraps back to the first line after four lines
  });
});
