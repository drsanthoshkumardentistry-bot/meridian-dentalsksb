import { describe, it, expect } from "vitest";
import { detectPlatform, manualSteps } from "../src/installApp.js";

describe("install helpers", () => {
  it("detects the platform from the user agent", () => {
    expect(detectPlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe("ios");
    expect(detectPlatform("Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/120")).toBe("android");
    expect(detectPlatform("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120")).toBe("desktop");
    expect(detectPlatform("")).toBe("desktop");
  });
  it("gives a different instruction for each platform", () => {
    const all = ["ios", "android", "desktop"].map(manualSteps);
    expect(new Set(all).size).toBe(3);
    expect(manualSteps("ios")).toMatch(/Share/);
  });
});

import { installPlan, APK_URL } from "../src/installApp.js";
describe("Install app button", () => {
  it("uses the prompt when there is one, downloads the APK on Android, else shows steps", () => {
    expect(installPlan(true, "android")).toBe("prompt");
    expect(installPlan(false, "android")).toBe("download");
    expect(installPlan(false, "ios")).toBe("steps");
    expect(installPlan(false, "desktop")).toBe("steps");
    expect(APK_URL).toMatch(/MeriDent\.apk$/);
  });
});
