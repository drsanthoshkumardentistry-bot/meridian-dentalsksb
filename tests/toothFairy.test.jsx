import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ToothFairy from "../src/components/ToothFairy.jsx";

afterEach(cleanup);

describe("Meridee the tooth fairy", () => {
  it("can be tapped and says a few friendly things in turn", () => {
    render(<ToothFairy />);
    const btn = screen.getByLabelText(/Say hi to Meridee/);
    expect(screen.queryByRole("status")).toBeNull();
    fireEvent.click(btn);
    expect(screen.getByRole("status").textContent).toMatch(/I'm Meridee/);
    expect(btn.closest("[data-mood]").getAttribute("data-mood")).toBe("happy"); // she smiles with happy eyes after a tap
    fireEvent.click(btn);
    expect(screen.getByRole("status").textContent).toMatch(/Chart the tooth/);
    for (let i = 0; i < 3; i++) fireEvent.click(btn);
    expect(screen.getByRole("status").textContent).toMatch(/I'm Meridee/); // wraps back to the first line after four lines
  });
});
