import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import MedicineLibrary from "../src/components/MedicineLibrary.jsx";
import MedicineForm from "../src/components/MedicineForm.jsx";

afterEach(cleanup);
const type = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe("medicine library", () => {
  it("adds the clinic's own medicine", () => {
    const onProfile = vi.fn();
    render(<MedicineLibrary profile={{}} onProfile={onProfile} newId={() => "MED-1"} showToast={() => {}} />);
    type("Medicine name", "Dolo 650"); type("How often", "SOS"); type("For how long", "2 Days");
    fireEvent.click(screen.getByText("Add medicine"));
    const saved = onProfile.mock.calls[0][0].medicines;
    expect(saved.some((m) => m.name === "Dolo 650" && m.id === "MED-1")).toBe(true);
  });
  it("edits and removes a medicine", () => {
    const onProfile = vi.fn();
    render(<MedicineLibrary profile={{}} onProfile={onProfile} newId={() => "x"} showToast={() => {}} />);
    fireEvent.click(screen.getByLabelText("Edit Metrogyl 400"));
    type("For how long", "5 Days");
    fireEvent.click(screen.getByText("Save changes"));
    expect(onProfile.mock.calls[0][0].medicines.find((m) => m.id === "m-metrogyl").duration).toBe("5 Days");
    fireEvent.click(screen.getByLabelText("Remove Zerodol-SP"));
    expect(onProfile.mock.calls[1][0].medicines.some((m) => m.id === "m-zerodol")).toBe(false);
  });
});

describe("medicine form", () => {
  it("asks for the missing part and can save to the list", () => {
    const onSubmit = vi.fn();
    render(<MedicineForm onSubmit={onSubmit} saveToListOption />);
    type("Medicine name", "Dolo 650");
    fireEvent.click(screen.getByText("Save"));
    expect(screen.getByRole("alert").textContent).toMatch(/how often/);
    type("How often", "SOS"); type("For how long", "2 Days");
    fireEvent.click(screen.getByLabelText(/Also save to my medicine list/));
    fireEvent.click(screen.getByText("Save"));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: "Dolo 650" }), true);
  });
});
