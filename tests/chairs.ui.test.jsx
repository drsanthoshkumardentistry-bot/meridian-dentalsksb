import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import PracticeChairs, { ProfileNote, ProfileNotesContext } from "../src/components/PracticeChairs.jsx";

afterEach(cleanup);

describe("chair editor", () => {
  it("adds, renames (reporting the old name) and removes", () => {
    const onChange = vi.fn(), onRenamed = vi.fn();
    render(<PracticeChairs profile={{}} newId={() => "n1"} onChange={onChange} onRenamed={onRenamed} showToast={vi.fn()} />);
    fireEvent.click(screen.getByText("Add a chair"));
    expect(onChange.mock.calls[0][0].length).toBe(4);
    const first = screen.getAllByLabelText("Chair name")[0];
    fireEvent.focus(first);
    fireEvent.change(first, { target: { value: "Implant room" } });
    fireEvent.blur(first, { target: { value: "Implant room" } });
    expect(onRenamed).toHaveBeenCalledWith("Chair 1 (Main Operatory)", "Implant room");
    fireEvent.click(screen.getByLabelText("Remove Chair 3 (Prosthodontics)"));
    expect(onChange.mock.calls.at(-1)[0].length).toBe(2);
  });
});

describe("profile note", () => {
  it("opens on tap and saves text", () => {
    const setNote = vi.fn();
    render(<ProfileNotesContext.Provider value={{ notes: {}, setNote }}><ProfileNote k="gstin" /></ProfileNotesContext.Provider>);
    fireEvent.click(screen.getByText("Add a note"));
    fireEvent.change(screen.getByLabelText("Note for gstin"), { target: { value: "pending" } });
    expect(setNote).toHaveBeenCalledWith("gstin", "pending");
  });
  it("shows an existing note open", () => {
    render(<ProfileNotesContext.Provider value={{ notes: { gstin: "hi" }, setNote: vi.fn() }}><ProfileNote k="gstin" /></ProfileNotesContext.Provider>);
    expect(screen.getByLabelText("Note for gstin").value).toBe("hi");
  });
});
