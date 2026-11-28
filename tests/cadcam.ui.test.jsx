import React from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import CadCam from "../src/components/CadCam.jsx";

vi.mock("../src/components/StlViewer.jsx", () => ({ default: ({ onLoaded }) => <button onClick={() => onLoaded?.({ name: "36.stl", bytes: 1048576, triangles: 5000 })}>fake-open</button> }));
afterEach(cleanup);

const setup = (patient = { cadCases: [] }, canWrite = true) => {
  const calls = [];
  const utils = render(<CadCam patient={patient} newId={() => "C" + (calls.length + 1)} onChange={(v) => calls.push(v)} canWrite={canWrite} />);
  return { calls, ...utils };
};

describe("CAD/CAM tab", () => {
  it("shows an error for a bad tooth and saves a good case", () => {
    const { calls } = setup();
    fireEvent.submit(screen.getByLabelText("New CAD/CAM case"));
    expect(screen.getByRole("alert").textContent).toMatch(/tooth/i);
    fireEvent.change(screen.getByLabelText("Teeth"), { target: { value: "36" } });
    fireEvent.submit(screen.getByLabelText("New CAD/CAM case"));
    expect(calls[0][0]).toMatchObject({ id: "C1", teeth: "36", stage: "scanned", restoration: "Crown" });
  });
  it("moves a case forward, and remembers a viewed scan", async () => {
    const c = { id: "C1", restoration: "Crown", material: "Zirconia", teeth: "36", stage: "scanned", dates: { scanned: "2026-11-28" } };
    const { calls } = setup({ cadCases: [c] });
    fireEvent.click(screen.getByText("Design done"));
    expect(calls[0][0].stage).toBe("designed");
    fireEvent.click(screen.getByText("View 3D scan"));
    fireEvent.click(await screen.findByText("fake-open"));
    expect(calls[1][0].scanFile).toEqual({ name: "36.stl", bytes: 1048576, triangles: 5000 });
  });
  it("is read-only without write access", () => {
    const c = { id: "C1", restoration: "Crown", material: "Zirconia", teeth: "36", stage: "scanned", dates: {} };
    setup({ cadCases: [c] }, false);
    expect(screen.queryByLabelText("New CAD/CAM case")).toBeNull();
    expect(screen.queryByText("Design done")).toBeNull();
    expect(within(screen.getByTestId("cadcam-case")).getByText("View 3D scan")).toBeTruthy();
  });
});
