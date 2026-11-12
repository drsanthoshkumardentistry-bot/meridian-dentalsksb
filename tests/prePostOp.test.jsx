import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import PrePostOp from "../src/components/PrePostOp.jsx";
import { prePostPair, prePostTeeth, IMAGE_KINDS } from "../src/gallery.js";

const img = (id, kind, tooth, takenOn) => ({ id, kind, tooth, takenOn, caption: "", data: "data:image/jpeg;base64,xx", createdAt: takenOn });

describe("pre-op / post-op helpers", () => {
  it("has the kinds", () => { expect(IMAGE_KINDS).toContain("Pre-op"); expect(IMAGE_KINDS).toContain("Post-op"); });
  it("pairs newest of each kind, optionally by tooth", () => {
    const list = [img("1", "Pre-op", "36", "2026-01-01"), img("2", "Post-op", "36", "2026-02-01"), img("3", "Pre-op", "11", "2026-03-01")];
    expect(prePostPair(list, "36")).toEqual({ pre: list[0], post: list[1] });
    expect(prePostPair(list).pre.id).toBe("3");
    expect(prePostTeeth(list)).toEqual(["11", "36"]);
  });
});

describe("PrePostOp", () => {
  afterEach(cleanup);
  const setup = (over = {}) => {
    const api = { list: vi.fn().mockResolvedValue([]), add: vi.fn().mockResolvedValue() };
    const props = { patient: { id: "P1" }, api, compress: vi.fn().mockResolvedValue("data:image/jpeg;base64,abc"), showToast: vi.fn(), newId: () => "IMG1", authorName: "Dr A", ...over };
    render(<PrePostOp {...props} />);
    return { api, props };
  };
  it("saves a pre-op picture", async () => {
    const { api, props } = setup();
    await screen.findByText(/No pre-op or post-op pictures yet/);
    fireEvent.click(screen.getByRole("button", { name: /Add pre-op/ }));
    const file = new File(["x"], "a.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText("Choose a picture"), { target: { files: [file] } });
    await waitFor(() => expect(api.add).toHaveBeenCalled());
    expect(api.add.mock.calls[0][0].kind).toBe("Pre-op");
    expect(props.showToast).toHaveBeenCalledWith("Pre-op picture saved");
  });
  it("hides add buttons without write access", async () => {
    setup({ canWrite: false });
    await screen.findByText(/No pre-op or post-op pictures yet/);
    expect(screen.queryByRole("button", { name: /Add post-op/ })).toBeNull();
  });
});
