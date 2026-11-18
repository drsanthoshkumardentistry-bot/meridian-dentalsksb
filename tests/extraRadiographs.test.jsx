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
  const open = async (over) => { const r = setup(over); await screen.findByText(/No extra radiographs yet/); fireEvent.click(screen.getByRole("button", { name: /Add/ })); return r; };
  const pics = (n, extra = {}) => Array.from({ length: n }, (_, i) => Object.assign(new File(["x"], `r${i}.jpg`, { type: "image/jpeg" }), extra));
  it("imports a whole folder at once, using each file's own date", async () => {
    let n = 0;
    const { api, props } = await open({ newId: () => `IMG${++n}` });
    const day = (y, m, d) => new Date(y, m, d, 12).getTime();
    const files = [new File(["x"], "a.jpg", { type: "image/jpeg", lastModified: day(2026, 0, 5) }), new File(["x"], "b.jpg", { type: "image/jpeg", lastModified: day(2026, 1, 9) })];
    fireEvent.change(screen.getByLabelText("Choose a radiograph"), { target: { files } });
    await waitFor(() => expect(api.add).toHaveBeenCalledTimes(2));
    expect(api.add.mock.calls.map((c) => c[0].takenOn)).toEqual(["2026-01-05", "2026-02-09"]);
    expect(props.showToast).toHaveBeenCalledWith("Saved 2 of 2 pictures.");
  });
  it("can ignore file dates, and reports one that fails", async () => {
    const compress = vi.fn().mockResolvedValueOnce("data:image/jpeg;base64,abc").mockRejectedValueOnce(new Error("Could not read that image"));
    const { api, props } = await open({ compress });
    fireEvent.click(screen.getByLabelText(/use the date each file was saved/));
    fireEvent.change(screen.getByLabelText("Choose a radiograph"), { target: { files: pics(2, {}) } });
    await waitFor(() => expect(props.showToast).toHaveBeenCalled());
    expect(api.add).toHaveBeenCalledTimes(1);
    expect(props.showToast.mock.calls.at(-1)[0]).toBe("Saved 1 of 2 pictures. 1 failed: Could not read that image.");
  });
  it("stops at the per-patient limit and says how many were left out", async () => {
    const existing = Array.from({ length: 29 }, (_, i) => ({ id: `e${i}`, kind: "IOPA", takenOn: "2026-01-01", data: "data:image/jpeg;base64,x" }));
    const api = { list: vi.fn().mockResolvedValue(existing), add: vi.fn().mockResolvedValue() };
    const showToast = vi.fn();
    render(<ExtraRadiographs patient={{ id: "P1" }} api={api} compress={vi.fn().mockResolvedValue("data:image/jpeg;base64,abc")} showToast={showToast} newId={() => "n"} />);
    await screen.findAllByRole("img");
    fireEvent.click(screen.getByRole("button", { name: /Add/ }));
    fireEvent.change(screen.getByLabelText("Choose a radiograph"), { target: { files: pics(3) } });
    await waitFor(() => expect(showToast).toHaveBeenCalled());
    expect(api.add).toHaveBeenCalledTimes(1);
    expect(showToast.mock.calls.at(-1)[0]).toBe("Saved 1 of 3 pictures. 2 not added because the limit is 30 per patient.");
  });
  const dirOf = (files) => ({ name: "RVG", entries: async function* () { for (const f of files) yield [f.name, { kind: "file", getFile: async () => f }]; yield ["sub", { kind: "directory" }]; } });
  it("hides the folder picker where the browser cannot do it", async () => {
    delete window.showDirectoryPicker;
    await open();
    expect(screen.queryByText("Pick my RVG folder")).toBeNull();
  });
  it("lists recent pictures from the RVG folder and adds only the ticked ones", async () => {
    const now = Date.now();
    const f = (name, ago) => new File(["x"], name, { type: "image/jpeg", lastModified: now - ago });
    window.showDirectoryPicker = vi.fn().mockResolvedValue(dirOf([f("new.jpg", 3600000), f("old.jpg", 9 * 86400000), f("notes.txt", 1000), f("newer.png", 600000)]));
    const { api } = await open();
    fireEvent.click(screen.getByText("Pick my RVG folder"));
    const list = await screen.findByLabelText("Recent pictures in the folder");
    expect(list.querySelectorAll("li").length).toBe(2);
    expect(list.textContent).toMatch(/newer\.png[\s\S]*new\.jpg/); // newest first
    expect(list.textContent).not.toMatch(/old\.jpg|notes\.txt/);
    fireEvent.click(screen.getByLabelText("newer.png"));
    fireEvent.click(screen.getByText(/Add ticked pictures as IOPA/));
    await waitFor(() => expect(api.add).toHaveBeenCalledTimes(1));
    delete window.showDirectoryPicker;
  });
  it("says so when the folder has nothing recent, and stays quiet if the dentist cancels", async () => {
    const old = new File(["x"], "old.jpg", { type: "image/jpeg", lastModified: Date.now() - 20 * 86400000 });
    window.showDirectoryPicker = vi.fn().mockResolvedValueOnce(dirOf([old])).mockRejectedValueOnce(Object.assign(new Error("x"), { name: "AbortError" }));
    const { props } = await open();
    fireEvent.click(screen.getByText("Pick my RVG folder"));
    expect((await screen.findByRole("status")).textContent).toMatch(/No pictures from the last 3 days in "RVG"/);
    fireEvent.click(screen.getByText("Pick my RVG folder"));
    await waitFor(() => expect(window.showDirectoryPicker).toHaveBeenCalledTimes(2));
    expect(props.showToast).not.toHaveBeenCalled();
    delete window.showDirectoryPicker;
  });
});
