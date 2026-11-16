import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");
const keyframes = (name) => (css.match(new RegExp(`@keyframes ${name}\\s*\\{[^@]*?\\}\\s*\\}`)) || [""])[0];

describe("animations that must not shake the page", () => {
  it("the floating hero cards move with translate, never with margin or top", () => {
    const k = keyframes("float-y");
    expect(k).toContain("translate");
    expect(k).not.toMatch(/margin|top|left|width|height/);
  });
  it("no looping animation changes layout properties", () => {
    for (const m of css.matchAll(/@keyframes\s+([\w-]+)\s*\{([\s\S]*?)\}\s*\}/g)) {
      expect(m[2], `keyframes ${m[1]}`).not.toMatch(/\b(margin|padding|top|left|right|bottom|width|height)\s*:/);
    }
  });
  it("the endless 3D sway is switched off on phones", () => {
    const phone = css.slice(css.indexOf("@media (max-width: 640px)"));
    expect(phone).toMatch(/\.scene3d-stage\s*\{\s*animation:\s*none/);
  });
});
