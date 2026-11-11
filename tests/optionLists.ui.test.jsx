import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import OptionLists from "../src/components/OptionLists.jsx";

afterEach(cleanup);

describe("option list editor", () => {
  it("adds an option to a list", () => {
    const onProfile = vi.fn();
    render(<OptionLists profile={{}} onProfile={onProfile} showToast={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Add to Staff shifts"), { target: { value: "Night" } });
    fireEvent.click(within(screen.getByTestId("list-shifts")).getByText("Add"));
    expect(onProfile.mock.calls[0][0].lists.shifts).toEqual(["Morning", "Evening", "Full day", "Night"]);
  });
  it("removes an option and offers reset once edited", () => {
    const onProfile = vi.fn();
    render(<OptionLists profile={{ lists: { shifts: ["Morning", "Evening"] } }} onProfile={onProfile} showToast={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Remove Evening"));
    expect(onProfile.mock.calls[0][0].lists.shifts).toEqual(["Morning"]);
    fireEvent.click(screen.getByText("Reset to standard"));
    expect(onProfile.mock.calls[1][0].lists.shifts).toBeUndefined();
  });
});
