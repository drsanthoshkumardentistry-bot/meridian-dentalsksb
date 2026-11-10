import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import OpgViewer from "../src/components/OpgViewer.jsx";

const patient = { id: "p1", name: "Asha", opgImage: "data:image/jpeg;base64,AAAA" };
const setup = (p = patient, extra = {}) => {
  const props = { patient: p, onUpload: vi.fn(), onRemove: vi.fn(), onCalibrate: vi.fn(), onAddToNotes: vi.fn(), showToast: vi.fn(), ...extra };
  render(<OpgViewer {...props} />);
  return props;
};
const rect = { left: 0, top: 0, width: 100, height: 50 };

afterEach(cleanup);
describe("OpgViewer", () => {
  it("shows an empty state without a film", () => {
    setup({ id: "p1", name: "Asha" });
    expect(screen.getByText(/No OPG film/i)).toBeTruthy();
    expect(screen.queryByRole("toolbar")).toBeNull();
  });

  it("zooms within 100%-400%", () => {
    setup();
    for (let i = 0; i < 10; i++) fireEvent.click(screen.getByLabelText("Zoom in"));
    expect(screen.getByText("400%")).toBeTruthy();
    for (let i = 0; i < 10; i++) fireEvent.click(screen.getByLabelText("Zoom out"));
    expect(screen.getByText("100%")).toBeTruthy();
  });

  it("measures in pixels and warns when not calibrated", () => {
    setup();
    const img = screen.getByAltText("Panoramic radiograph");
    Object.defineProperty(img, "naturalWidth", { value: 1000 });
    Object.defineProperty(img, "naturalHeight", { value: 500 });
    fireEvent.load(img);
    fireEvent.click(screen.getByRole("button", { name: /Measure/ }));
    expect(screen.getByText(/Not calibrated yet/i)).toBeTruthy();
    const frame = img.parentElement;
    frame.getBoundingClientRect = () => rect;
    fireEvent.click(frame, { clientX: 0, clientY: 0 });
    fireEvent.click(frame, { clientX: 50, clientY: 0 });
    expect(screen.getByTestId("opg-measure").textContent).toMatch(/500 px \(not calibrated\)/);
  });

  it("calibrates and then reports millimetres", () => {
    const props = setup({ ...patient, opgCalibration: null });
    const img = screen.getByAltText("Panoramic radiograph");
    Object.defineProperty(img, "naturalWidth", { value: 1000 });
    Object.defineProperty(img, "naturalHeight", { value: 500 });
    fireEvent.load(img);
    fireEvent.click(screen.getByRole("button", { name: /Calibrate/ }));
    const frame = img.parentElement;
    frame.getBoundingClientRect = () => rect;
    fireEvent.click(frame, { clientX: 0, clientY: 0 });
    fireEvent.click(frame, { clientX: 50, clientY: 0 });
    fireEvent.change(screen.getByLabelText(/Real length/i), { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: /Save calibration/i }));
    expect(props.onCalibrate).toHaveBeenCalledWith(expect.objectContaining({ mmPerPx: 0.02, knownMm: 10 }));
  });

  it("rejects a calibration with no length", () => {
    const props = setup();
    const img = screen.getByAltText("Panoramic radiograph");
    Object.defineProperty(img, "naturalWidth", { value: 1000 });
    Object.defineProperty(img, "naturalHeight", { value: 500 });
    fireEvent.load(img);
    fireEvent.click(screen.getByRole("button", { name: /Calibrate/ }));
    const frame = img.parentElement;
    frame.getBoundingClientRect = () => rect;
    fireEvent.click(frame, { clientX: 0, clientY: 0 });
    fireEvent.click(frame, { clientX: 50, clientY: 0 });
    fireEvent.click(screen.getByRole("button", { name: /Save calibration/i }));
    expect(props.onCalibrate).not.toHaveBeenCalled();
    expect(props.showToast).toHaveBeenCalled();
  });
});
