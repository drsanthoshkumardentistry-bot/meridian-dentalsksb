import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { PatientBilling, VoidInvoiceDialog } from "../src/components/PatientBilling.jsx";

afterEach(cleanup);
const invs = [
  { id: "INV-1", patientId: "P1", patient: "Asha", date: "24/11/2026", totalP: 50000, payments: [] },
  { id: "INV-2", patientId: "P2", patient: "Ravi", totalP: 100, payments: [] },
  { id: "INV-3", patientId: "P1", patient: "Asha", totalP: 0, payments: [], voided: { reason: "wrong" } },
];
describe("PatientBilling", () => {
  it("lists only this patient's invoices and shows void status", () => {
    render(<PatientBilling patient={{ id: "P1", name: "Asha" }} invoices={invs} canWrite onNew={() => {}} onPay={() => {}} />);
    expect(screen.getByText("INV-1")).toBeTruthy();
    expect(screen.queryByText("INV-2")).toBeNull();
    expect(screen.getByText("Void")).toBeTruthy();
  });
  it("fires the shortcuts, and hides them without billing access", () => {
    const onNew = vi.fn(); const onPay = vi.fn();
    const { unmount } = render(<PatientBilling patient={{ id: "P1", name: "Asha" }} invoices={invs} canWrite onNew={onNew} onPay={onPay} />);
    fireEvent.click(screen.getByText("+ New invoice"));
    fireEvent.click(screen.getByText("Record payment"));
    expect(onNew).toHaveBeenCalledTimes(1);
    expect(onPay).toHaveBeenCalledTimes(1);
    unmount();
    render(<PatientBilling patient={{ id: "P1", name: "Asha" }} invoices={invs} canWrite={false} onNew={onNew} onPay={onPay} />);
    expect(screen.queryByText("+ New invoice")).toBeNull();
  });
  it("shows an empty message", () => {
    render(<PatientBilling patient={{ id: "P9", name: "Nobody" }} invoices={invs} canWrite onNew={() => {}} onPay={() => {}} />);
    expect(screen.getByText(/No invoices/)).toBeTruthy();
  });
});
describe("VoidInvoiceDialog", () => {
  it("submits and cancels", () => {
    const onSubmit = vi.fn((e) => e.preventDefault()); const onCancel = vi.fn(); const onReason = vi.fn();
    render(<VoidInvoiceDialog invoice={{ id: "INV-1" }} reason="" onReason={onReason} onCancel={onCancel} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText("Reason"), { target: { value: "wrong amount" } });
    expect(onReason).toHaveBeenCalledWith("wrong amount");
    fireEvent.click(screen.getByText("Void invoice"));
    expect(onSubmit).toHaveBeenCalled();
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalled();
  });
});
