import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import StaffRota from "../src/components/StaffRota.jsx";

afterEach(cleanup);
const chairs = ["Chair 1 (Main)", "Chair 2"];
const emps = [{ id: 1, name: "Dr A" }, { id: 2, name: "Gone", active: false }];
const wed = new Date(2026, 10, 11, 10);

describe("staff rota card", () => {
  it("changes a day and warns about uncovered chairs", () => {
    const onChange = vi.fn();
    render(<StaffRota employees={emps} chairs={chairs} canEdit onChange={onChange} now={wed} />);
    expect(screen.getByTestId("rota-today").textContent).toMatch(/No one is planned for: Chair 1 \(Main\), Chair 2/);
    expect(screen.queryByText("Gone")).toBeNull();
    fireEvent.change(screen.getByLabelText("Dr A on Wed"), { target: { value: "Chair 2" } });
    expect(onChange.mock.calls[0][0][0].rota.wed).toBe("Chair 2");
  });
  it("is read-only without edit rights", () => {
    render(<StaffRota employees={emps} chairs={chairs} canEdit={false} onChange={vi.fn()} now={wed} />);
    expect(screen.getByLabelText("Dr A on Wed").disabled).toBe(true);
    expect(screen.queryByText(/Copy Mon/)).toBeNull();
  });
});
