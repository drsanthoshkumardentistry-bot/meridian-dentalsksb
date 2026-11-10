import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import LegalPage from "../src/components/LegalPage.jsx";
import { legalPageFromSearch, PRIVACY, TERMS } from "../src/legal.js";

afterEach(cleanup);
describe("legal pages", () => {
  it("picks the page from the address and ignores anything else", () => {
    expect(legalPageFromSearch("?page=privacy")).toBe("privacy");
    expect(legalPageFromSearch("?page=terms")).toBe("terms");
    expect(legalPageFromSearch("?page=constructor")).toBe(null);
    expect(legalPageFromSearch("?page=x")).toBe(null);
    expect(legalPageFromSearch("")).toBe(null);
  });
  it("renders every section with a contact and a link to the other page", () => {
    render(<LegalPage page="privacy" />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Privacy Policy");
    PRIVACY.sections.forEach((s) => expect(screen.getByText(s.h)).toBeTruthy());
    expect(screen.getByText("Terms of Use").getAttribute("href")).toBe("/?page=terms");
    expect(screen.getByText("+91 90432 05927").getAttribute("href")).toContain("wa.me/919043205927");
  });
  it("covers what the app really does", () => {
    const text = JSON.stringify([PRIVACY, TERMS]);
    for (const w of ["Firebase", "Vercel", "WhatsApp", "consent", "download a full copy", "delete", "Connect", "Coimbatore"]) expect(text).toContain(w);
  });
});
