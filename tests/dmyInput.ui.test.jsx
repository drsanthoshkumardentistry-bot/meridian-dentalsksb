import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import DmyDateInput from "../src/components/DmyDateInput.jsx";

afterEach(cleanup);

describe("DmyDateInput", () => {
  it("types as dd/mm/yyyy and returns an ISO date", () => {
    const onChange = vi.fn();
    render(<DmyDateInput value="" onChange={onChange} max="2026-11-11" ariaLabel="DOB" />);
    const input = screen.getByLabelText("DOB");
    fireEvent.change(input, { target: { value: "29012006" } });
    expect(input.value).toBe("29/01/2006");
    expect(onChange).toHaveBeenLastCalledWith("2006-01-29");
  });
  it("warns about impossible and future dates without saving them", () => {
    const onChange = vi.fn();
    render(<DmyDateInput value="" onChange={onChange} max="2026-11-11" ariaLabel="DOB" />);
    const input = screen.getByLabelText("DOB");
    fireEvent.change(input, { target: { value: "31022000" } });
    expect(screen.getByRole("alert").textContent).toMatch(/not a real date/);
    fireEvent.change(input, { target: { value: "01012030" } });
    expect(screen.getByRole("alert").textContent).toMatch(/future/);
    expect(onChange).not.toHaveBeenCalled();
  });
  it("shows a stored ISO date in dd/mm/yyyy", () => {
    render(<DmyDateInput value="1999-12-05" onChange={() => {}} ariaLabel="DOB" />);
    expect(screen.getByLabelText("DOB").value).toBe("05/12/1999");
  });
});

describe("date field blocks the form while the date is not valid", () => {
  it("marks the input invalid for half-typed and impossible dates and valid again for a real one", async () => {
    const { default: DmyDateInput } = await import("../src/components/DmyDateInput.jsx");
    const { render, fireEvent } = await import("@testing-library/react");
    const { container } = render(<DmyDateInput value="2026-11-15" onChange={() => {}} />);
    const input = container.querySelector("input");
    expect(input.validity.valid).toBe(true);
    fireEvent.change(input, { target: { value: "3102" } });       // 31/02 half typed
    expect(input.validity.valid).toBe(false);
    fireEvent.change(input, { target: { value: "31022027" } });   // impossible date
    expect(input.validity.valid).toBe(false);
    expect(input.validationMessage).toMatch(/not a real date/i);
    fireEvent.change(input, { target: { value: "28022027" } });
    expect(input.validity.valid).toBe(true);
  });
});
