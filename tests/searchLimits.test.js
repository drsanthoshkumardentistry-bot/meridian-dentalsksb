import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

// A pasted wall of text in a search box used to freeze the page for 15+ seconds and could crash the tab.
// Every search/filter box must cap its length.
const files = ["src/App.jsx", ...fs.readdirSync("src/components").filter((f) => f.endsWith(".jsx")).map((f) => path.join("src/components", f))];
describe("search and filter boxes", () => {
  it("all cap how much text they accept", () => {
    const missing = [];
    for (const f of files) {
      const s = fs.readFileSync(f, "utf8");
      for (const m of s.matchAll(/placeholder="[^"]*(?:Search|Filter)[^"]*"/g)) {
        const start = s.lastIndexOf("<input", m.index);
        const end = s.indexOf(">", m.index + m[0].length);
        if (start < 0 || !s.slice(start, end).includes("maxLength")) missing.push(`${f}: ${m[0]}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
