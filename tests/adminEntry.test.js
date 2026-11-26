import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { isAdminPath, prepareAdminPage } from "../src/adminEntry.js";

describe("admin entrance", () => {
  it("matches only /admin", () => {
    for (const p of ["/admin", "/admin/", "/admin//"]) expect(isAdminPath(p)).toBe(true);
    for (const p of ["/", "/administrator", "/admin/x", "/dental", ""]) expect(isAdminPath(p)).toBe(false);
  });
  it("gives the page its own name, manifest and a no-index tag", () => {
    document.head.innerHTML = '<link rel="manifest" href="/manifest.webmanifest" />';
    prepareAdminPage(document);
    expect(document.title).toBe("MeriDent Admin");
    expect(document.querySelector('link[rel="manifest"]').getAttribute("href")).toBe("/admin.webmanifest");
    expect(document.querySelector('meta[name="robots"]').getAttribute("content")).toContain("noindex");
  });
  it("has its own installable manifest limited to /admin", () => {
    const m = JSON.parse(readFileSync("public/admin.webmanifest", "utf8"));
    expect(m).toMatchObject({ name: "MeriDent Admin", start_url: "/admin", scope: "/admin", display: "standalone" });
    expect(m.icons.length).toBeGreaterThan(1);
  });
  it("keeps /admin out of search and the sitemap", () => {
    expect(readFileSync("public/robots.txt", "utf8")).toMatch(/Disallow:\s*\/admin/);
    expect(readFileSync("public/sitemap.xml", "utf8")).not.toMatch(/\/admin/);
  });
});
