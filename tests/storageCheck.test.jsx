import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import StorageCheck from "../src/components/StorageCheck";
import { checkStatus, saveCheck, loadCheck } from "../src/storageCheck";

const DAY = 86400000;
describe("storage check", () => {
  beforeEach(() => { cleanup(); localStorage.clear(); });
  it("is due when never checked", () => expect(checkStatus(null).level).toBe("never"));
  it("ok within 30 days under 70%", () => expect(checkStatus({ mib: 2.3, at: 0 }, 10 * DAY).level).toBe("ok"));
  it("due after 30 days", () => expect(checkStatus({ mib: 2.3, at: 0 }, 31 * DAY).level).toBe("due"));
  it("warns at 70%", () => expect(checkStatus({ mib: 720, at: 0 }, DAY).level).toBe("warn"));
  it("rejects bad numbers", () => { expect(saveCheck("abc")).toBeNull(); expect(saveCheck(-1)).toBeNull(); expect(loadCheck()).toBeNull(); });
  it("saves a figure from the form", () => {
    render(<StorageCheck />);
    expect(screen.getByText(/not checked storage yet/i)).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/current size/i), { target: { value: "2.3" } });
    fireEvent.click(screen.getByText("Save check"));
    expect(screen.getByText(/2\.3 MB of 1 GB/)).toBeTruthy();
    expect(loadCheck().mib).toBe(2.3);
  });
  it("shows an error for junk", () => {
    render(<StorageCheck />);
    fireEvent.change(screen.getByLabelText(/current size/i), { target: { value: "x" } });
    fireEvent.click(screen.getByText("Save check"));
    expect(screen.getByRole("alert")).toBeTruthy();
  });
});
