import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import LabOrders from "../src/components/LabOrders.jsx";
import LabBoard from "../src/components/LabBoard.jsx";
import { createLabOrder, openLabOrders } from "../src/lab.js";

afterEach(cleanup);
const draft = { lab: "Sri Dental Lab", labPhone: "9876543210", workType: "Crown", teeth: "36", shade: "A2", sentOn: "2026-11-08", dueOn: "2026-11-15", note: "" };
const patient = (labOrders = []) => ({ id: "P1", name: "Asha", phone: "9123456780", labOrders });

describe("LabOrders (casesheet)", () => {
  const mount = (props = {}) => { const onChange = vi.fn(); render(<LabOrders patient={patient()} labs={[{ lab: "Sri Dental Lab", labPhone: "9876543210" }]} newId={() => "L1"} onChange={onChange} {...props} />); return onChange; };

  it("saves a valid order and clears the form", () => {
    const onChange = mount();
    fireEvent.change(screen.getByLabelText("Lab"), { target: { value: "Sri Dental Lab" } });
    fireEvent.change(screen.getByLabelText("Teeth"), { target: { value: "36" } });
    fireEvent.click(screen.getByRole("button", { name: "Save lab order" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0][0]).toMatchObject({ id: "L1", lab: "Sri Dental Lab", workType: "Crown", teeth: "36", status: "sent", labPhone: "9876543210" });
    expect((screen.getByLabelText("Lab")).value).toBe("");
  });
  it("fills the lab's number from a lab used before", () => {
    mount();
    fireEvent.change(screen.getByLabelText("Lab"), { target: { value: "sri dental lab" } });
    expect(screen.getByLabelText("Lab's WhatsApp (optional)").value).toBe("9876543210");
  });
  it("explains what is wrong instead of saving", () => {
    const onChange = mount();
    fireEvent.click(screen.getByRole("button", { name: "Save lab order" }));
    expect(screen.getByRole("alert").textContent).toMatch(/lab's name/);
    expect(onChange).not.toHaveBeenCalled();
  });
  it("moves an order through received and fitted", () => {
    const o = createLabOrder(draft, "L1");
    const onChange = vi.fn();
    const { rerender } = render(<LabOrders patient={patient([o])} newId={() => "x"} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Mark received" }));
    expect(onChange.mock.calls[0][0][0].status).toBe("received");
    rerender(<LabOrders patient={patient([{ ...o, status: "received" }])} newId={() => "x"} onChange={onChange} />);
    expect(screen.queryByRole("button", { name: "Mark received" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Mark fitted" }));
    expect(onChange.mock.calls[1][0][0].status).toBe("fitted");
  });
  it("is read-only without write access", () => {
    render(<LabOrders patient={patient([createLabOrder(draft, "L1")])} newId={() => "x"} onChange={() => {}} canWrite={false} />);
    expect(screen.queryByRole("button", { name: "Save lab order" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Mark received" })).toBeNull();
    expect(screen.getByText(/Crown · 36/)).toBeTruthy();
  });
});

describe("LabBoard (diary)", () => {
  const now = new Date(2026, 10, 11, 12);
  const sent = createLabOrder({ ...draft, dueOn: "2026-11-09" }, "S1");
  const back = { ...createLabOrder(draft, "R1"), status: "received" };
  const rows = openLabOrders([{ ...patient([sent]), id: "P1" }, { ...patient([back]), id: "P2", name: "Ravi" }], now);
  const handlers = () => ({ onReceive: vi.fn(), onFit: vi.fn(), onChase: vi.fn(), onTellPatient: vi.fn() });

  it("renders nothing without open orders", () => {
    const { container } = render(<LabBoard rows={[]} {...handlers()} />);
    expect(container.firstChild).toBeNull();
  });
  it("shows late work and work that is back, with the right actions", () => {
    const h = handlers();
    render(<LabBoard rows={rows} {...h} />);
    expect(screen.getByText(/2 days late/)).toBeTruthy();
    expect(screen.getByText(/ready to fit/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Message lab" }));
    fireEvent.click(screen.getByRole("button", { name: /Tell patient/ }));
    fireEvent.click(screen.getAllByRole("button", { name: "Mark received" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Mark fitted" }));
    expect(h.onChase).toHaveBeenCalledWith(expect.objectContaining({ order: expect.objectContaining({ id: "S1" }) }));
    expect(h.onTellPatient).toHaveBeenCalledWith(expect.objectContaining({ order: expect.objectContaining({ id: "R1" }) }));
    expect(h.onReceive).toHaveBeenCalled();
    expect(h.onFit).toHaveBeenCalled();
  });
  it("hides the patient message once the patient has been told, and all actions for read-only roles", () => {
    const told = openLabOrders([{ ...patient([{ ...back, patientNotifiedAt: "x" }]), name: "Ravi" }], now);
    const { rerender } = render(<LabBoard rows={told} {...handlers()} />);
    expect(screen.queryByRole("button", { name: /Tell patient/ })).toBeNull();
    rerender(<LabBoard rows={rows} canWrite={false} {...handlers()} />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(within(screen.getByTestId("lab-board")).getByText(/Ravi/)).toBeTruthy();
  });
});
