import React from "react";
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const main = readFileSync("src/main.jsx", "utf8");
const css = readFileSync("src/index.css", "utf8");

describe("loading placeholder", () => {
  it("is a shimmer placeholder marked data-loading, with slow-connection and offline notes", () => {
    expect(main).toMatch(/data-loading="1"/);
    expect(main).toMatch(/Slow connection, still loading your clinic/);
    expect(main).toMatch(/navigator\.onLine === false/);
  });
  it("styles reveal the slow note after 4 s and respect reduced motion", () => {
    expect(css).toMatch(/\.md-skel-slow[^}]*4s/);
    expect(css).toMatch(/prefers-reduced-motion[^}]*md-skel/);
  });
});
