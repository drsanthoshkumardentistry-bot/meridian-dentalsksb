import React from "react";
import fs from "node:fs";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import SeoPage from "../src/components/SeoPage.jsx";
import { SEO_PAGES, seoPageForPath, sitemapXml } from "../src/seoPages.js";

afterEach(() => cleanup());

describe("public feature pages", () => {
  it("finds pages by path, with or without a trailing slash", () => {
    expect(seoPageForPath("/dental").h1).toMatch(/dental clinics/);
    expect(seoPageForPath("/odontogram/")).toBeTruthy();
    expect(seoPageForPath("/nope")).toBeNull();
    expect(seoPageForPath("/")).toBeNull();
  });

  it("gives every page its own title, description and FAQ", () => {
    const titles = new Set(SEO_PAGES.map((p) => p.title));
    expect(titles.size).toBe(SEO_PAGES.length);
    SEO_PAGES.forEach((p) => {
      expect(p.description.length).toBeGreaterThan(60);
      expect(p.description.length).toBeLessThan(200);
      expect(p.faqs.length).toBeGreaterThan(0);
      expect(p.path).toMatch(/^\/[a-z-]+$/);
    });
  });

  it("makes no unverifiable claims and stays honest about WhatsApp", () => {
    const text = JSON.stringify(SEO_PAGES);
    expect(text).not.toMatch(/trusted by|\d+\+ clinics|testimonial|DPDP compliant|HIPAA|best dental|#1|automatically sends/i);
    const wa = SEO_PAGES.find((p) => p.path === "/whatsapp-reminders");
    expect(JSON.stringify(wa)).toMatch(/you tap Send/);
  });

  it("renders a page with a start link and links to the other pages", () => {
    const page = seoPageForPath("/dental-billing-gst");
    render(<SeoPage page={page} />);
    expect(document.title).toBe(page.title);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(page.h1);
    expect(screen.getAllByText(/Start free/)[0].closest("a").getAttribute("href")).toBe("/login");
    expect(screen.getByText("Odontogram & charting").closest("a").getAttribute("href")).toBe("/odontogram");
    expect(document.head.querySelector('script[type="application/ld+json"]')).toBeTruthy();
  });

  it("keeps public/sitemap.xml in step with the pages", () => {
    expect(fs.readFileSync("public/sitemap.xml", "utf8")).toBe(sitemapXml());
  });
});
