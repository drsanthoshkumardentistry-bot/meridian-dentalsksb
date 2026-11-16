import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ModeSwitch from "../src/components/ModeSwitch.jsx";

afterEach(cleanup);

describe("view switch in the side menu", () => {
  it("shows three choices and marks the current one", () => {
    render(<ModeSwitch mode="connect" onChange={() => {}} />);
    const radios = screen.getAllByRole("radio");
    expect(radios.map((r) => r.getAttribute("aria-label"))).toEqual(["Full app", "Connect only", "DocLog only"]);
    expect(screen.getByText("Only MeriDent Connect")).toBeTruthy(); // the line under the title explains the current choice
    expect(radios.map((r) => r.getAttribute("aria-checked"))).toEqual(["false", "true", "false"]);
  });
  it("reports the choice, and ignores a tap on the one already selected", () => {
    const pick = vi.fn();
    render(<ModeSwitch mode="full" onChange={pick} />);
    fireEvent.click(screen.getByRole("radio", { name: /Full app/ }));
    expect(pick).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("radio", { name: /DocLog only/ }));
    expect(pick).toHaveBeenCalledWith("doclog");
  });
});
