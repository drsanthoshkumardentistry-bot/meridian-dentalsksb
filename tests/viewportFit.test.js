import { describe, it, expect } from "vitest";
import { measureAppHeight, installViewportFit } from "../src/viewportFit.js";

describe("viewport fit", () => {
  it("uses the larger of the window and visual viewport height", () => {
    expect(measureAppHeight({ innerHeight: 800, visualViewport: { height: 900, offsetTop: 0 } })).toBe(900);
    expect(measureAppHeight({ innerHeight: 900 })).toBe(900);
    expect(measureAppHeight({ innerHeight: 0 })).toBe(0);
  });
  it("sets --app-h and updates it on resize", () => {
    window.innerHeight = 700;
    const off = installViewportFit();
    expect(document.documentElement.style.getPropertyValue("--app-h")).toBe("700px");
    window.innerHeight = 850;
    window.dispatchEvent(new Event("resize"));
    expect(document.documentElement.style.getPropertyValue("--app-h")).toBe("850px");
    off();
  });
});
