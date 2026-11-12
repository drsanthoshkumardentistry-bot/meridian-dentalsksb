import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import ExtraRadiographs from "../src/components/ExtraRadiographs.jsx";
import { IMAGE_KINDS } from "../src/gallery.js";

describe("ExtraRadiographs", () => {
  afterEach(cleanup);
  const setup = (over = {}) => {
    const api = { list: vi.fn().mockResolvedValue([]), add: vi.fn().mockResolvedValue() };
    const props = { patient: { id: "P1" }, api, compress: vi.fn().mockResolvedValue("data:image/jpeg;base64,abc"), showToast: vi.fn(), newId: () => "IMG1", authorName: "Dr A", ...over };
    render(<ExtraRadiographs {...props} />);
    return { api, props };
  };
  it("knows the radiograph kinds", () => { ["OPG", "IOPA", "CBCT", "X-ray"].forEach((k) => expect(IMAGE_KINDS).toContain(k)); });
  it("adds a CBCT", async () => {
    const { api, props } = setup();
    await screen.findByText(/No extra radiographs yet/);
    fireEvent.click(screen.getByRole("button", { name: /Add/ }));
    fireEvent.click(screen.getByRole("button", { name: "CBCT" }));
    fireEvent.change(screen.getByLabelText("Choose a radiograph"), { target: { files: [new File(["x"], "a.jpg", { type: "image/jpeg" })] } });
    await waitFor(() => expect(api.add).toHaveBeenCalled());
    expect(api.add.mock.calls[0][0].kind).toBe("CBCT");
    expect(props.showToast).toHaveBeenCalledWith("CBCT saved");
  });
  it("lists only radiograph kinds and hides Add without write access", async () => {
    const api = { list: vi.fn().mockResolvedValue([{ id: "1", kind: "IOPA", takenOn: "2026-01-01", data: "data:image/jpeg;base64,x" }, { id: "2", kind: "Face", takenOn: "2026-01-01", data: "data:image/jpeg;base64,x" }]), add: vi.fn() };
    render(<ExtraRadiographs patient={{ id: "P1" }} api={api} compress={vi.fn()} showToast={vi.fn()} newId={() => "x"} canWrite={false} />);
    expect(await screen.findAllByRole("img")).toHaveLength(1);
    expect(screen.queryByRole("button", { name: /^Add/ })).toBeNull();
  });
});
