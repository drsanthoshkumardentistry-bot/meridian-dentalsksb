import { describe, it, expect } from "vitest";
import { buildBookingPosterHtml } from "../src/bookingPoster.js";

const PNG = "data:image/png;base64,iVBORw0KGgo=";
describe("booking poster", () => {
  it("shows clinic name, QR and the link", () => {
    const h = buildBookingPosterHtml({ clinicName: "Smile Care", url: "https://x.test/?book=abc", qrPng: PNG });
    expect(h).toContain("Smile Care");
    expect(h).toContain(`src="${PNG}"`);
    expect(h).toContain("https://x.test/?book=abc");
    expect(h).toContain("Scan to book");
  });
  it("escapes the clinic name and link", () => {
    const h = buildBookingPosterHtml({ clinicName: '<img src=x onerror=alert(1)>"', url: "https://x.test/?a=1&b=<2>", qrPng: PNG });
    expect(h).not.toContain("<img src=x");
    expect(h).toContain("&lt;img src=x onerror=alert(1)&gt;&quot;");
    expect(h).toContain("a=1&amp;b=&lt;2&gt;");
  });
  it("drops a QR source that is not a PNG data URL", () => {
    const h = buildBookingPosterHtml({ clinicName: "C", url: "u", qrPng: 'javascript:alert(1)" onerror="x' });
    expect(h).not.toContain("javascript:");
    expect(h).not.toContain("<img");
  });
  it("falls back to a generic name", () => {
    expect(buildBookingPosterHtml({ clinicName: "", url: "u", qrPng: PNG })).toContain("Our clinic");
  });

  it("has no script of its own (the site policy would block it)", () => {
    expect(buildBookingPosterHtml({ clinicName: "C", url: "u", qrPng: PNG })).not.toContain("<script");
  });
});
