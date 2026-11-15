import { describe, it, expect, vi, afterEach } from "vitest";
import { copyText } from "../src/copyText.js";

afterEach(() => { vi.restoreAllMocks(); });
const setClipboard = (c) => Object.defineProperty(navigator, "clipboard", { configurable: true, value: c });

describe("copyText", () => {
  it("uses the clipboard when allowed", async () => {
    const writeText = vi.fn().mockResolvedValue();
    setClipboard({ writeText });
    expect(await copyText("hello")).toBe(true);
    expect(writeText).toHaveBeenCalledWith("hello");
  });
  it("falls back to the old way when the clipboard refuses", async () => {
    setClipboard({ writeText: vi.fn().mockRejectedValue(new Error("NotAllowedError")) });
    document.execCommand = vi.fn(() => true);
    expect(await copyText("x")).toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith("copy");
    expect(document.querySelector("textarea")).toBeNull();
  });
  it("says false, and never throws, when nothing works", async () => {
    setClipboard({ writeText: vi.fn().mockRejectedValue(new Error("no")) });
    document.execCommand = vi.fn(() => false);
    expect(await copyText("x")).toBe(false);
    setClipboard(undefined);
    document.execCommand = undefined;
    expect(await copyText(undefined)).toBe(false);
  });
});
