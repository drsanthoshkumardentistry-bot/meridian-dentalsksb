import React from "react";
import fs from "node:fs";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import SeoPage from "../src/components/SeoPage.jsx";
import { seoPageForPath, sitemapXml } from "../src/seoPages.js";

afterEach(cleanup);
describe("clinic guide", () => {
  it("is a public /help page with a PDF download that really exists", () => {
    const page = seoPageForPath("/help");
    expect(page.h1).toBe("The MeriDent clinic guide");
    render(<SeoPage page={page} />);
    const link = screen.getByText("Download the guide (PDF)").closest("a");
    expect(link.getAttribute("href")).toBe("/MeriDent_Clinic_Guide.pdf");
    const pdf = fs.readFileSync("public/MeriDent_Clinic_Guide.pdf");
    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
    expect(pdf.length).toBeGreaterThan(5000);
  });
  it("is in the sitemap and linked from the landing footer", () => {
    expect(sitemapXml()).toContain("/help");
    expect(fs.readFileSync("src/components/landingpage.jsx", "utf8")).toContain('href="/help"');
  });
  it("describes void and roles the way the app enforces them", () => {
    const text = JSON.stringify(seoPageForPath("/help"));
    expect(text).toMatch(/voided by the owner or a manager/);
    expect(text).toMatch(/Receptionist: patients, diary and billing, but no voiding/);
  });
});
