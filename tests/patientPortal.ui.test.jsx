import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import PatientPortal from "../src/components/PatientPortal.jsx";

const page = (o = {}) => ({
  clinicName: "Smile Dental", clinicPhone: "9000000000", upiId: "smile@upi", patientFirstName: "Asha",
  upcoming: [{ date: "2026-11-14", time: "10:30", procedure: "RCT", doctor: "Dr S" }],
  bills: [{ number: "INV-1", date: "10/11/2026", totalP: 100000, paidP: 40000, balanceP: 60000 }],
  plans: [{ title: "Root canal", status: "Approved", totalP: 500000 }], advice: "Avoid hard food", nextVisitOn: "2026-11-17",
  outstandingP: 60000, updatedAt: "2026-11-12T00:00:00Z", expiresAt: new Date(Date.now() + 86400000), ...o,
});

describe("PatientPortal", () => {
  it("shows visits, balance with a UPI pay button, plans and advice", async () => {
    render(<PatientPortal token="t" loadPage={async () => page()} />);
    await waitFor(() => expect(screen.getByText("Hello Asha")).toBeTruthy());
    expect(screen.getByText(/Balance to pay/)).toBeTruthy();
    expect(screen.getByText(/Pay ₹600.00 with UPI/).getAttribute("href")).toContain("upi://pay");
    expect(screen.getByText("Root canal")).toBeTruthy();
    expect(screen.getByText("Avoid hard food")).toBeTruthy();
  });
  it("explains a missing or expired link", async () => {
    const { unmount } = render(<PatientPortal token="t" loadPage={async () => null} />);
    await waitFor(() => expect(screen.getByText("This link is not valid")).toBeTruthy());
    unmount();
    render(<PatientPortal token="t" loadPage={async () => page({ expiresAt: new Date(Date.now() - 1000) })} />);
    await waitFor(() => expect(screen.getByText("This link has expired")).toBeTruthy());
  });
});
