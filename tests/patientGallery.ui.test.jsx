import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import PatientGallery from "../src/components/PatientGallery.jsx";

afterEach(cleanup);
const jpeg = "data:image/jpeg;base64,AAAA";
const imgs = [
  { id: "b", patientId: "P1", kind: "Before", caption: "pre-op", tooth: "26", takenOn: "2026-11-01", data: jpeg, createdAt: "1" },
  { id: "a", patientId: "P1", kind: "After", caption: "post-op", tooth: "26", takenOn: "2026-11-10", data: jpeg, createdAt: "1" },
];
const setup = (over = {}) => {
  const api = { list: vi.fn(async () => imgs), add: vi.fn(async () => {}), remove: vi.fn(async () => {}) };
  const props = { patient: { id: "P1" }, api, compress: vi.fn(async () => jpeg), showToast: vi.fn(), newId: () => "IMG-1", ...over };
  render(<PatientGallery {...props} />);
  return { api, props };
};

describe("PatientGallery", () => {
  it("shows pictures and a side by side before and after", async () => {
    setup();
    await waitFor(() => expect(screen.getAllByAltText(/Before · tooth 26 · pre-op/).length).toBeGreaterThan(0));
    expect(screen.getByAltText(/^Before: /)).toBeTruthy();
    expect(screen.getByAltText(/^After: /)).toBeTruthy();
  });
  it("shrinks, validates and saves a chosen photo", async () => {
    const { api, props } = setup();
    await waitFor(() => screen.getByLabelText("Choose a photo"));
    fireEvent.change(screen.getByLabelText("Shows"), { target: { value: "X-ray" } });
    const file = new File(["x"], "x.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Choose a photo"), { target: { files: [file] } });
    await waitFor(() => expect(api.add).toHaveBeenCalled());
    expect(props.compress).toHaveBeenCalledWith(file);
    expect(api.add.mock.calls[0][0]).toMatchObject({ id: "IMG-1", patientId: "P1", kind: "X-ray", data: jpeg });
  });
  it("hides the upload form from people who cannot write, and deletes from the viewer", async () => {
    const { api } = setup({ canWrite: false });
    await waitFor(() => screen.getAllByAltText(/After · tooth 26 · post-op/));
    expect(screen.queryByLabelText("Choose a photo")).toBeNull();
    cleanup();
    const second = setup();
    await waitFor(() => screen.getAllByAltText(/After · tooth 26 · post-op/));
    fireEvent.click(screen.getAllByAltText(/After · tooth 26 · post-op/)[0]);
    fireEvent.click(screen.getByText("Delete"));
    await waitFor(() => expect(second.api.remove).toHaveBeenCalledWith("a"));
    expect(api.remove).not.toHaveBeenCalled();
  });
  it("stops at the per-patient limit", async () => {
    const many = Array.from({ length: 30 }, (_, n) => ({ ...imgs[0], id: `i${n}` }));
    const { api, props } = setup({ api: { list: async () => many, add: vi.fn(), remove: vi.fn() } });
    await waitFor(() => screen.getByLabelText("Choose a photo"));
    fireEvent.change(screen.getByLabelText("Choose a photo"), { target: { files: [new File(["x"], "x.png", { type: "image/png" })] } });
    await waitFor(() => expect(props.showToast).toHaveBeenCalledWith(expect.stringMatching(/Up to 30/)));
    expect(api.add).not.toHaveBeenCalled();
  });
});
