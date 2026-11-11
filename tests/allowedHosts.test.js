import { describe, it, expect } from "vitest";
import { isAllowedHost } from "../src/allowedHosts.js";

describe("authorised hosts", () => {
  it("allows the official site, the project address and local development", () => {
    ["www.meridiandentalos.com", "meridiandentalos.com", "MERIDIANDENTALOS.COM", "localhost", "127.0.0.1", "meridian-dentalsksb.vercel.app"].forEach((h) => expect(isAllowedHost(h)).toBe(true));
  });
  it("refuses look-alike and unknown addresses", () => {
    ["meridiandentalos.com.evil.io", "evil-meridiandentalos.com", "other.vercel.app", "", undefined].forEach((h) => expect(isAllowedHost(h)).toBe(false));
  });
  it("accepts extra hosts from the environment setting", () => {
    expect(isAllowedHost("preview.example.com", "preview.example.com, b.com")).toBe(true);
    expect(isAllowedHost("c.com", "preview.example.com")).toBe(false);
  });
});
