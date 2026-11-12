import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import BulkMessage from "../src/components/BulkMessage.jsx";

afterEach(cleanup);
const patients = [{ id: "1", name: "Asha", phone: "9876543210" }, { id: "2", name: "Bad", phone: "1" }];

describe("BulkMessage", () => {
  it("lists messageable patients and opens WhatsApp once per tap", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<BulkMessage patients={patients} shown={patients} appointments={[]} invoices={[]} clinicName="Smile" onClose={() => {}} />);
    expect(screen.getByRole("status").textContent).toMatch(/1 patient to message, 1 skipped/);
    fireEvent.click(screen.getByRole("button", { name: "WhatsApp" }));
    expect(open).toHaveBeenCalledTimes(1);
    expect(open.mock.calls[0][0]).toContain("wa.me/919876543210");
    expect(screen.getByText("Opened")).toBeTruthy();
    open.mockRestore();
  });
});
