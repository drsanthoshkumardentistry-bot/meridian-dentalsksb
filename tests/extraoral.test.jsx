import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ExtraOralExam from "../src/components/ExtraOralExam.jsx";
import { newExam, setField, setMouthOpening, findings, hasEntries, saveExam, changes } from "../src/extraoral.js";

afterEach(cleanup);

describe("extraoral logic", () => {
  it("flags only what differs from usual", () => {
    let e = newExam("E1", "2026-11-12");
    expect(hasEntries(e)).toBe(false);
    e = setField(e, "symmetry", "Symmetrical");
    e = setField(e, "tmjClick", "Right");
    e = setMouthOpening(e, "30");
    expect(findings(e).map((f) => f.label)).toEqual(["Clicking", "Mouth opening"]);
    expect(setField(e, "symmetry", "bogus")).toBe(e);
    expect(setMouthOpening(e, "500").mouthOpening).toBe(30);
    expect(setField(e, "tmjClick", "").fields.tmjClick).toBeUndefined();
  });
  it("saves newest first and finds changes", () => {
    const a = setField(newExam("A", "2026-10-01"), "submandibular", "Palpable, tender");
    const b = setField(newExam("B", "2026-11-01"), "submandibular", "Not palpable");
    expect(saveExam([a], b)[0].id).toBe("B");
    expect(changes(a, b)[0].label).toBe("Submandibular");
  });
});

describe("ExtraOralExam", () => {
  it("records findings, shows them and saves", () => {
    const onSave = vi.fn(); const showToast = vi.fn();
    render(<ExtraOralExam exams={[]} onSave={onSave} newId={() => "EO1"} today="2026-11-12" showToast={showToast} />);
    expect(screen.getByTestId("eo-summary").textContent).toContain("Nothing abnormal");
    fireEvent.change(screen.getByLabelText("Swelling"), { target: { value: "Left side" } });
    fireEvent.change(screen.getByLabelText("Mouth opening (mm)"), { target: { value: "28" } });
    expect(screen.getByTestId("eo-summary").textContent).toContain("Left side");
    expect(screen.getByTestId("eo-summary").textContent).toContain("limited");
    fireEvent.click(screen.getByRole("button", { name: "Save exam" }));
    expect(onSave.mock.calls[0][0][0].fields.swelling).toBe("Left side");
  });
  it("is read only without write access", () => {
    render(<ExtraOralExam exams={[]} canWrite={false} onSave={() => {}} newId={() => "EO1"} today="2026-11-12" showToast={() => {}} />);
    expect(screen.queryByRole("button", { name: "Save exam" })).toBeNull();
    expect(screen.getByLabelText("Swelling").disabled).toBe(true);
  });
});
