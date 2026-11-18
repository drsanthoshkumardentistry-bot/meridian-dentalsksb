import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { screenFromShortcut, SCREENS } from "../src/roles.js";

const manifest = JSON.parse(fs.readFileSync("public/manifest.webmanifest", "utf8"));

describe("installed app presence", () => {
  it("has a full, valid manifest", () => {
    expect(manifest.id).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.categories).toContain("medical");
    const purposes = manifest.icons.map((i) => i.purpose);
    expect(purposes).toEqual(expect.arrayContaining(["any", "maskable", "monochrome"]));
    for (const i of manifest.icons) expect(fs.existsSync(`public${i.src}`)).toBe(true);
  });
  it("every shortcut opens a real screen", () => {
    expect(manifest.shortcuts.length).toBeGreaterThanOrEqual(3);
    for (const s of manifest.shortcuts) {
      expect(s.icons.every((i) => fs.existsSync(`public${i.src}`))).toBe(true);
      expect(SCREENS).toContain(screenFromShortcut(new URL(s.url, "https://x.test").search));
    }
    expect(screenFromShortcut("?go=nonsense")).toBeNull();
    expect(screenFromShortcut("")).toBeNull();
  });
});
