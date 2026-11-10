import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, within, cleanup } from "@testing-library/react";
import LandingPage from "../src/components/landingpage.jsx";

afterEach(() => cleanup());

describe("landing page content", () => {
  it("describes the shipped features and no longer lists them as coming next", () => {
    render(<LandingPage firebaseConfigured onLoginClick={() => {}} />);
    expect(screen.getByText("GST billing & UPI QR")).toBeTruthy();
    expect(screen.getByText("WhatsApp reminders & recall")).toBeTruthy();
    expect(screen.getByText("Reports for your accountant")).toBeTruthy();
    const next = screen.getByText("Coming next").closest("section");
    expect(within(next).queryByText("GST-ready invoices")).toBeNull();
    expect(within(next).queryByText("Automated recall reminders")).toBeNull();
    expect(within(next).getByText("Multi-item invoices")).toBeTruthy();
  });

  it("has a FAQ that is honest about WhatsApp sending and pricing", () => {
    render(<LandingPage firebaseConfigured onLoginClick={() => {}} />);
    const faq = document.getElementById("faq");
    expect(faq).toBeTruthy();
    expect(within(faq).getByText("Does MeriDent send WhatsApp messages by itself?")).toBeTruthy();
    expect(faq.textContent).toMatch(/you tap Send/);
    expect(faq.textContent).toMatch(/free during early access/i);
    expect(faq.querySelectorAll("details").length).toBe(6);
  });

  it("makes no unverifiable claims (testimonials, user counts, compliance badges)", () => {
    const { container } = render(<LandingPage firebaseConfigured onLoginClick={() => {}} />);
    const text = container.textContent;
    expect(text).not.toMatch(/trusted by|\d+\+ clinics|testimonial|DPDP compliant|HIPAA|best dental|#1/i);
  });

  it("keeps the sign-in entry points", () => {
    render(<LandingPage firebaseConfigured onLoginClick={() => {}} />);
    expect(screen.getAllByText("Start free with Google").length).toBeGreaterThan(0);
    expect(screen.getByText("Use email and password instead")).toBeTruthy();
  });
});
