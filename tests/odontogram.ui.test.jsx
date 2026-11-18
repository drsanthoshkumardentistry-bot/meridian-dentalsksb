import React, { useState } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, within, cleanup } from "@testing-library/react";
import Odontogram from "../src/components/Odontogram.jsx";

const PALETTE = [{ id: "HLT", label: "Healthy" }, { id: "CAR", label: "Caries" }, { id: "RCT", label: "RCT Done" }, { id: "MIS", label: "Missing / Extracted" }];
afterEach(() => { cleanup(); localStorage.clear(); document.body.style.overflow = ""; });

function Harness({ onTapSpy }) {
  const [cond, setCond] = useState({});
  const [active, setActive] = useState("CAR");
  const toggle = (t, code) => setCond((c) => { const cur = c[t] || []; const next = cur.includes(code) ? cur.filter((x) => x !== code) : [...cur, code]; const n = { ...c }; if (next.length) n[t] = next; else delete n[t]; return n; });
  return <Odontogram conditions={cond} palette={PALETTE} activeStatus={active} onSelectStatus={setActive} onTap={(t) => { onTapSpy && onTapSpy(t); toggle(t, active); }} onRemoveFinding={toggle} onClear={() => setCond({})} isDeciduous={false} onToggleDeciduous={() => {}} />;
}
const tooth = (n) => screen.getByLabelText(new RegExp(`^Tooth ${n},`));

describe("odontogram: easier picking", () => {
  it("opens a findings sheet for the tapped tooth, so nothing needs scrolling", () => {
    render(<Harness />);
    expect(screen.queryByRole("radiogroup", { name: "Finding to apply" })).toBeNull();
    fireEvent.click(tooth(36));
    const sheet = within(screen.getByTestId("tooth-sheet"));
    fireEvent.click(sheet.getByRole("button", { name: /Caries/ }));
    fireEvent.click(sheet.getByRole("button", { name: /RCT Done/ }));
    expect(tooth(36).getAttribute("aria-label")).toMatch(/Caries \+ RCT Done/);
    expect(sheet.getByRole("button", { name: /Caries/ }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(sheet.getByRole("button", { name: /Caries/ })); // tap again removes it
    expect(tooth(36).getAttribute("aria-label")).toMatch(/RCT Done/);
    fireEvent.click(sheet.getByText("Done"));
    expect(screen.queryByTestId("tooth-sheet")).toBeNull();
  });
  it("switches the sheet to another tooth, and closes with Escape", () => {
    render(<Harness />);
    fireEvent.click(tooth(36));
    fireEvent.click(tooth(16));
    expect(screen.getByRole("dialog", { name: "Findings for tooth 16" })).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("tooth-sheet")).toBeNull();
  });
  it("still lets you choose a finding first and paint teeth, and remembers the choice", () => {
    const spy = vi.fn();
    render(<Harness onTapSpy={spy} />);
    fireEvent.click(screen.getByRole("button", { name: "Choose a finding first" }));
    expect(screen.getByRole("radiogroup", { name: "Finding to apply" })).toBeTruthy();
    fireEvent.click(tooth(11)); fireEvent.click(tooth(12));
    expect(spy).toHaveBeenCalledTimes(2);
    expect(screen.queryByTestId("tooth-sheet")).toBeNull();
    cleanup();
    render(<Harness />);
    expect(screen.getByRole("button", { name: "Choose a finding first" }).getAttribute("aria-pressed")).toBe("true");
  });
  it("opens the chart in full screen, keeps picking there, and exits", () => {
    render(<Harness />);
    fireEvent.click(screen.getByText("Full screen"));
    const full = within(screen.getByTestId("odo-full"));
    expect(document.body.style.overflow).toBe("hidden");
    expect(screen.getAllByLabelText("Adult dentition chart").length).toBe(1); // not drawn twice
    fireEvent.click(tooth(26));
    fireEvent.click(within(screen.getByTestId("tooth-sheet")).getByRole("button", { name: /Missing/ }));
    expect(tooth(26).getAttribute("aria-label")).toMatch(/Missing/);
    fireEvent.click(full.getByText("Choose a finding first"));
    expect(within(screen.getByTestId("odo-dock")).getByRole("radiogroup", { name: "Finding to apply" })).toBeTruthy(); // finding dock stays on screen
    fireEvent.click(full.getByText("Exit full screen"));
    expect(screen.queryByTestId("odo-full")).toBeNull();
    expect(document.body.style.overflow).toBe("");
  });
  it("Escape closes the sheet first, then full screen", () => {
    render(<Harness />);
    fireEvent.click(screen.getByText("Full screen"));
    fireEvent.click(tooth(46));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("tooth-sheet")).toBeNull();
    expect(screen.getByTestId("odo-full")).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("odo-full")).toBeNull();
  });
});
