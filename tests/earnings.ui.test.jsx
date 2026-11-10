import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import DentistEarnings from "../src/components/DentistEarnings.jsx";
import BookingShare from "../src/components/BookingShare.jsx";
import { dentistEarnings } from "../src/dentistReport.js";

afterEach(cleanup);
const report = dentistEarnings([{ id: "I1", doctor: "Dr Asha", date: "05/11/2026", totalP: 100000, payments: [{ date: "05/11/2026", mode: "Cash", amountP: 100000 }] }, { id: "I2", date: "05/11/2026", totalP: 1000, payments: [{ date: "05/11/2026", mode: "Cash", amountP: 1000 }] }], [], "2026-11", {});

describe("DentistEarnings", () => {
  it("lets the owner set a rate and warns about invoices without a dentist", () => {
    const onRate = vi.fn();
    render(<DentistEarnings report={report} ym="2026-11" canEditRates onRate={onRate} onDownload={() => {}} />);
    fireEvent.change(screen.getByLabelText("Commission percent for Dr Asha"), { target: { value: "25" } });
    expect(onRate).toHaveBeenCalledWith("Dr Asha", "25");
    expect(screen.getByText(/no dentist/)).toBeTruthy();
    expect(screen.queryByLabelText(/for Not assigned/)).toBeNull();
  });
  it("hides rate boxes from other roles and renders nothing when empty", () => {
    render(<DentistEarnings report={report} ym="2026-11" canEditRates={false} onRate={() => {}} onDownload={() => {}} />);
    expect(screen.queryByLabelText(/Commission percent/)).toBeNull();
    cleanup();
    const { container } = render(<DentistEarnings report={{ rows: [], total: {} }} ym="2026-11" />);
    expect(container.innerHTML).toBe("");
  });
});

describe("BookingShare", () => {
  it("shows a QR for the link with copy, WhatsApp share and download", async () => {
    const onCopy = vi.fn();
    render(<BookingShare url="https://x.test/?book=abc" clinicName="Smile Care" onCopy={onCopy} />);
    expect((await screen.findByAltText(/QR code to book at Smile Care/)).getAttribute("src")).toMatch(/^data:image\/png/);
    fireEvent.click(screen.getByText("Copy link"));
    expect(onCopy).toHaveBeenCalled();
    expect(screen.getByText("Share on WhatsApp").getAttribute("href")).toContain(encodeURIComponent("https://x.test/?book=abc"));
    await waitFor(() => expect(screen.getByText("Download QR").getAttribute("download")).toBe("booking-qr.png"));
  });
});
