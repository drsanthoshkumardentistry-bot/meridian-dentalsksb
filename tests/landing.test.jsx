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
    expect(within(next).queryByText("Multi-item invoices")).toBeNull();
    expect(within(next).queryByText("Shareable treatment plans")).toBeNull();
    expect(within(next).queryByText("Lab order tracking")).toBeNull();
    expect(screen.getByText("Lab order tracking")).toBeTruthy();
    expect(within(next).queryByText("Staff logins with roles")).toBeNull();
    ["Walk-in queue & triage", "Online booking page", "Branches", "Team logins & activity log", "Draft visit notes from the chart", "Caries risk & gum screening"].forEach((t) => expect(screen.getByText(t)).toBeTruthy());
    expect(screen.getByText("Multi-item invoices")).toBeTruthy();
    expect(screen.getByText("Treatment plans & estimates")).toBeTruthy();
  });

  it("has a FAQ that is honest about WhatsApp sending and pricing", () => {
    render(<LandingPage firebaseConfigured onLoginClick={() => {}} />);
    const faq = document.getElementById("faq");
    expect(faq).toBeTruthy();
    expect(within(faq).getByText("Does MeriDent send WhatsApp messages by itself?")).toBeTruthy();
    expect(faq.textContent).toMatch(/you tap Send/);
    expect(faq.textContent).toMatch(/free during early access/i);
    expect(faq.querySelectorAll("details").length).toBe(9);
  });

  it("makes no unverifiable claims (testimonials, user counts, compliance badges)", () => {
    const { container } = render(<LandingPage firebaseConfigured onLoginClick={() => {}} />);
    const text = container.textContent;
    expect(text).not.toMatch(/trusted by|\d+\+ clinics|testimonial|DPDP compliant|HIPAA|best dental|#1/i);
  });

  it("shows the newer features and is clear that insurance claims are not supported", () => {
    render(<LandingPage firebaseConfigured onLoginClick={() => {}} />);
    ["MeriDent Connect", "Dues and overdue tracking", "Stock with reorder and expiry alerts", "Staff roster, leave and reviews", "Today at a glance"].forEach((t) =>
      expect(screen.getByText(t)).toBeTruthy()
    );
    const faq = document.getElementById("faq");
    expect(within(faq).getByText("Does MeriDent handle insurance claims?")).toBeTruthy();
    expect(faq.textContent).toMatch(/does not manage insurance/i);
    const features = document.getElementById("features").textContent;
    expect(features).not.toMatch(/insurance|TPA/i);
    expect(features).toMatch(/Expenses & profit/);
  });

  it("links to the demo video", () => {
    render(<LandingPage firebaseConfigured onLoginClick={() => {}} />);
    const a = screen.getByText("Watch the 9-minute demo").closest("a");
    expect(a.getAttribute("href")).toBe("https://youtu.be/V6_z6LEbqNU");
    expect(a.getAttribute("target")).toBe("_blank");
    expect(a.getAttribute("rel")).toMatch(/noopener/);
  });

  it("keeps the sign-in entry points", () => {
    render(<LandingPage firebaseConfigured onLoginClick={() => {}} />);
    expect(screen.getAllByText("Start free with Google").length).toBeGreaterThan(0);
    expect(screen.getByText("Use email and password instead")).toBeTruthy();
  });
});

describe("landing page app download", () => {
  it("links to the Android app file and says there is no iPhone app", () => {
    render(<LandingPage firebaseConfigured onLoginClick={() => {}} />);
    const link = screen.getByText("Download the Android app").closest("a");
    expect(link.getAttribute("href")).toMatch(/releases\/download\/android-latest\/MeriDent\.apk$/);
    expect(document.getElementById("faq").textContent).toMatch(/no iPhone app yet/);
  });
});
