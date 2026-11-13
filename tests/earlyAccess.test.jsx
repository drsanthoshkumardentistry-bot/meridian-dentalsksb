import React from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import EarlyAccessPage from "../src/components/EarlyAccessPage.jsx";
import { cleanPhone, validateEarlyAccess, earlyAccessMessage, earlyAccessLink } from "../src/earlyAccess.js";

afterEach(() => cleanup());

describe("free early access", () => {
  it("accepts Indian mobile numbers in common forms", () => {
    expect(cleanPhone("+91 98765 43210")).toBe("9876543210");
    expect(cleanPhone("09876543210")).toBe("9876543210");
    expect(cleanPhone("9876543210")).toBe("9876543210");
    expect(cleanPhone("12345")).toBe("");
    expect(cleanPhone("5876543210")).toBe("");
    expect(cleanPhone(undefined)).toBe("");
  });

  it("asks for what is missing, one thing at a time", () => {
    expect(validateEarlyAccess({})).toMatch(/name/);
    expect(validateEarlyAccess({ name: "A" })).toMatch(/clinic/);
    expect(validateEarlyAccess({ name: "A", clinic: "B" })).toMatch(/city/);
    expect(validateEarlyAccess({ name: "A", clinic: "B", city: "C" })).toMatch(/mobile/);
    expect(validateEarlyAccess({ name: "A", clinic: "B", city: "C", phone: "9876543210" })).toBe("");
  });

  it("writes the WhatsApp message and link", () => {
    const f = { name: " Asha ", clinic: "Smile", city: "Coimbatore", phone: "98765 43210", size: "1 chair", callMe: true };
    const m = earlyAccessMessage(f);
    expect(m).toMatch(/Name: Asha/);
    expect(m).toMatch(/Mobile: \+91 9876543210/);
    expect(m).toMatch(/Please call me/);
    expect(earlyAccessLink(f)).toMatch(/^https:\/\/wa\.me\/919043205927\?text=/);
  });

  it("shows a message instead of opening WhatsApp when the form is incomplete, then opens it", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<EarlyAccessPage />);
    expect(document.title).toMatch(/^Free early access/);
    fireEvent.click(screen.getByText("Continue on WhatsApp"));
    expect(screen.getByRole("alert").textContent).toMatch(/name/);
    expect(open).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Asha" } });
    fireEvent.change(screen.getByLabelText("Clinic name"), { target: { value: "Smile" } });
    fireEvent.change(screen.getByLabelText("City"), { target: { value: "Coimbatore" } });
    fireEvent.change(screen.getByLabelText("Mobile number"), { target: { value: "9876543210" } });
    fireEvent.click(screen.getByText("Continue on WhatsApp"));
    expect(open).toHaveBeenCalledTimes(1);
    expect(open.mock.calls[0][0]).toMatch(/wa\.me\/919043205927/);
    open.mockRestore();
  });
});
