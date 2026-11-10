import { describe, it, expect } from "vitest";
import { pixelDistance, calibrationFactor, toMm, formatMeasurement, clampZoom, pointFromClick } from "../src/opg.js";

describe("OPG measurement maths", () => {
  const nat = { w: 1600, h: 800 };
  it("measures in image pixels, not screen pixels", () => {
    expect(pixelDistance({ x: 0, y: 0 }, { x: 0.5, y: 0 }, nat)).toBe(800);
    expect(pixelDistance({ x: 0, y: 0 }, { x: 0, y: 0.5 }, nat)).toBe(400);
    expect(pixelDistance({ x: 0.1, y: 0.1 }, { x: 0.4, y: 0.7 }, nat)).toBeCloseTo(Math.hypot(480, 480), 6);
    expect(pixelDistance(null, { x: 1, y: 1 }, nat)).toBe(0);
    expect(pixelDistance({ x: 0, y: 0 }, { x: 1, y: 1 }, { w: 0, h: 0 })).toBe(0);
  });

  it("calibrates from a known length and refuses nonsense", () => {
    expect(calibrationFactor(200, 10)).toBe(0.05);
    expect(calibrationFactor(200, "10")).toBe(0.05);
    expect(calibrationFactor(0, 10)).toBeNull();
    expect(calibrationFactor(200, 0)).toBeNull();
    expect(calibrationFactor(200, -3)).toBeNull();
    expect(calibrationFactor(200, "abc")).toBeNull();
    expect(calibrationFactor(200, 900)).toBeNull();
  });

  it("only reports millimetres when calibrated", () => {
    expect(toMm(100, undefined)).toBeNull();
    expect(toMm(100, 0)).toBeNull();
    expect(formatMeasurement(100, 0.05)).toBe("5.0 mm");
    expect(formatMeasurement(100.4, null)).toBe("100 px (not calibrated)");
  });

  it("clamps zoom to 1x to 4x in quarter steps", () => {
    expect(clampZoom(0.2)).toBe(1);
    expect(clampZoom(9)).toBe(4);
    expect(clampZoom(1.3)).toBe(1.25);
  });

  it("turns a click into clamped fractions of the image", () => {
    const rect = { left: 100, top: 50, width: 400, height: 200 };
    expect(pointFromClick(300, 150, rect)).toEqual({ x: 0.5, y: 0.5 });
    expect(pointFromClick(0, 0, rect)).toEqual({ x: 0, y: 0 });
    expect(pointFromClick(9999, 9999, rect)).toEqual({ x: 1, y: 1 });
    expect(pointFromClick(1, 1, { left: 0, top: 0, width: 0, height: 0 })).toBeNull();
  });
});
