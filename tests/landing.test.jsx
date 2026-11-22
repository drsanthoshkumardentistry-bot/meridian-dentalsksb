import React from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, within, cleanup, fireEvent, act, waitFor } from "@testing-library/react";
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
    expect(faq.textContent).toMatch(/free during our trial run/i);
    expect(faq.querySelectorAll("details").length).toBe(13);
  });

  it("shows planned pricing with a clear trial-run notice", () => {
    render(<LandingPage firebaseConfigured onLoginClick={() => {}} />);
    const sec = document.getElementById("pricing");
    expect(sec).toBeTruthy();
    expect(within(sec).getByRole("note").textContent).toMatch(/trial run/i);
    expect(within(sec).getByRole("note").textContent).toMatch(/nobody is being charged/i);
    ["₹0", "₹499", "₹999"].forEach((p) => expect(sec.textContent).toContain(p));
    expect(sec.textContent).toMatch(/₹4,999 per year/);
    expect(document.querySelector('a[href="#pricing"]')).toBeTruthy();
  });

  it("shows our own test numbers and says they are not an outside audit", () => {
    render(<LandingPage firebaseConfigured onLoginClick={() => {}} />);
    const sec = document.getElementById("quality");
    expect(sec).toBeTruthy();
    ["1,450+", "9 crore+"].forEach((n) => expect(sec.textContent).toContain(n));
    expect(sec.textContent).toMatch(/not an outside audit/i);
    expect(sec.textContent).toMatch(/calculation logic.*not every screen/i);
    expect(sec.textContent).toMatch(/data-access rules tested/);
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
    const a = screen.getByText("Watch quick demo").closest("a");
    expect(a.getAttribute("href")).toBe("https://youtu.be/BVowp-T5nJQ");
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
  it("has an install section with the Android file and says there is no iPhone app", () => {
    render(<LandingPage firebaseConfigured onLoginClick={() => {}} />);
    const section = document.getElementById("app");
    expect(section).toBeTruthy();
    expect(within(section).getByText("Install app")).toBeTruthy();
    const apk = within(section).getByText("Download for Android (APK)").closest("a");
    expect(apk.getAttribute("href")).toMatch(/releases\/download\/android-latest\/MeriDent\.apk$/);
    expect(section.textContent).toMatch(/no iPhone app yet/);
    expect(screen.getByText("Get the app").closest("a").getAttribute("href")).toBe("#app");
  });

  it("shows how to add the app when the browser gives no install prompt", () => {
    render(<LandingPage firebaseConfigured onLoginClick={() => {}} />);
    fireEvent.click(within(document.getElementById("app")).getByText("Install app"));
    expect(screen.getByRole("status").textContent).toMatch(/install icon|Add to Home|Install app/i);
  });

  it("on Android with no install prompt, Install app starts the APK download", () => {
    const ua = vi.spyOn(window.navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/120");
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<LandingPage firebaseConfigured onLoginClick={() => {}} />);
    fireEvent.click(within(document.getElementById("app")).getByText("Install app"));
    expect(click).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status").textContent).toMatch(/download has started/i);
    ua.mockRestore(); click.mockRestore();
  });

  it("uses the browser install prompt when one is offered, and hides once installed", async () => {
    render(<LandingPage firebaseConfigured onLoginClick={() => {}} />);
    const prompt = vi.fn(async () => {});
    const evt = new Event("beforeinstallprompt", { cancelable: true });
    evt.prompt = prompt;
    evt.userChoice = Promise.resolve({ outcome: "accepted" });
    act(() => { window.dispatchEvent(evt); });
    fireEvent.click(within(document.getElementById("app")).getByText("Install app"));
    await waitFor(() => expect(prompt).toHaveBeenCalledTimes(1));
    act(() => { window.dispatchEvent(new Event("appinstalled")); });
    await waitFor(() => expect(document.getElementById("app")).toBeNull());
  });
});

describe("landing page contact email", () => {
  it("lists only meridentapp@gmail.com", () => {
    const { container } = render(<LandingPage firebaseConfigured onLoginClick={() => {}} />);
    const emails = [];
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) emails.push(...(walker.currentNode.textContent.match(/[\w.+-]+@[\w-]+\.[\w.]*\w/g) || []));
    expect([...new Set(emails)]).toEqual(["meridentapp@gmail.com"]);
    const hrefs = [...container.querySelectorAll('a[href^="mailto:"]')].map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(["mailto:meridentapp@gmail.com"]);
  });
});

describe("legal contact email", () => {
  it("uses meridentapp@gmail.com", async () => {
    const { CONTACT } = await import("../src/legal.js");
    expect(CONTACT.email).toBe("meridentapp@gmail.com");
  });
});

describe("award line", () => {
  it("states only that we applied, not that we won", () => {
    const { container } = render(<LandingPage firebaseConfigured onLoginClick={() => {}} />);
    const t = container.textContent;
    expect(t).toMatch(/Applicant, National Startup Awards 6\.0/);
    expect(t).toMatch(/Result awaited/);
    expect(t).not.toMatch(/winner|award[- ]winning|won the/i);
  });
});

describe("press feature", () => {
  it("shows the Kovai Herald clipping with a dated caption and a link to the full page", () => {
    render(<LandingPage firebaseConfigured onLoginClick={() => {}} />);
    const press = document.getElementById("press");
    expect(press).toBeTruthy();
    expect(within(press).getByText("In the news")).toBeTruthy();
    expect(within(press).getByText("The Kovai Herald, 25 October 2026")).toBeTruthy();
    expect(press.querySelector("img").getAttribute("src")).toBe("/press/kovai-herald-2026-10-25.jpg");
    expect(press.querySelector("img").getAttribute("alt")).toContain("Kovai Herald");
    const online = within(press).getByText(/Read it on The Kovai Herald website/).closest("a");
    expect(online.getAttribute("href")).toMatch(/^https:\/\/thekovaiherald\.co\.in\//);
    expect(online.getAttribute("rel")).toContain("noopener");
  });
});

describe("security checks list", () => {
  it("shows the dated security checks and keeps the not-an-outside-audit note", () => {
    render(<LandingPage firebaseConfigured onLoginClick={() => {}} />);
    const sec = document.getElementById("quality");
    expect(sec.textContent).toContain("Security checks, last run 23 November 2026");
    expect(sec.textContent).toContain("limited to pictures and PDFs under 10 MB");
    expect(sec.textContent).toContain("not an outside audit");
  });
});

describe("floating WhatsApp button", () => {
  it("offers a free demo and opens WhatsApp with a ready message", () => {
    render(<LandingPage firebaseConfigured onLoginClick={() => {}} />);
    const a = screen.getByTestId("floating-whatsapp");
    expect(a.getAttribute("aria-label")).toBe("Book a free demo on WhatsApp");
    expect(a.getAttribute("href")).toMatch(/^https:\/\/wa\.me\/\d+\?text=/);
    expect(a.getAttribute("rel")).toContain("noopener");
    expect(a.textContent).toContain("Book a free demo");
  });
});

describe("imaging features", () => {
  it("lists DICOM import and camera capture, with the compressed-file limit stated", () => {
    render(<LandingPage firebaseConfigured onLoginClick={() => {}} />);
    expect(screen.getByText("X-rays from your RVG sensor or scanner")).toBeTruthy();
    expect(screen.getByText(/DICOM \(\.dcm\) files from digital sensors/)).toBeTruthy();
    expect(screen.getByText(/If a DICOM file is compressed, export it as JPEG or PNG/)).toBeTruthy();
    expect(screen.getByText("Take pictures with a USB or intraoral camera")).toBeTruthy();
  });
});
