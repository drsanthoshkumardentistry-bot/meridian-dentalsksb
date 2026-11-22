import { describe, it, expect } from "vitest";
import { dataUrlBytes, opgUsage, galleryUpperBytes, usageLevel, formatBytes, CLINIC_WARN_BYTES } from "../src/storageUsage.js";
describe("storage usage", () => {
  it("measures OPGs and ignores damaged entries", () => {
    const u = opgUsage([{ opgImage: "x".repeat(400) }, null, { opgImage: "" }, { opgImage: 5 }]);
    expect(u).toEqual({ count: 1, bytes: 300 });
    expect(opgUsage(undefined)).toEqual({ count: 0, bytes: 0 });
    expect(dataUrlBytes(null)).toBe(0);
  });
  it("estimates gallery space and sets warning levels", () => {
    expect(galleryUpperBytes(10)).toBe(10 * 142500);
    expect(galleryUpperBytes(-4)).toBe(0);
    expect(usageLevel(0)).toBe("ok");
    expect(usageLevel(CLINIC_WARN_BYTES * 0.75)).toBe("watch");
    expect(usageLevel(CLINIC_WARN_BYTES)).toBe("full");
    expect(formatBytes(1536)).toBe("2 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});

describe("OPGs kept in their own documents", () => {
  it("counts them from the size noted on the patient record, and still counts older in-record pictures", () => {
    const u = opgUsage([{ hasOpg: true, opgBytes: 500000 }, { opgImage: "x".repeat(400) }, { hasOpg: false, opgBytes: 999 }, { hasOpg: true }]);
    expect(u).toEqual({ count: 2, bytes: 500300 });
  });
});

import { uploadGate, CLINIC_STOP_BYTES } from "../src/storageUsage.js";
describe("uploadGate", () => {
  it("allows pictures below the stop line and blocks at it", () => {
    expect(uploadGate(0).allowed).toBe(true);
    expect(uploadGate(CLINIC_STOP_BYTES - 1).allowed).toBe(true);
    const g = uploadGate(CLINIC_STOP_BYTES);
    expect(g.allowed).toBe(false);
    expect(g.message).toMatch(/existing records are safe/i);
    expect(uploadGate(undefined).allowed).toBe(true);
  });
});
