import { describe, it, expect, vi, afterEach } from "vitest";
import { scrollToWhenReady } from "../src/scrollToWhenReady.js";

afterEach(() => { vi.useRealTimers(); document.body.innerHTML = ""; });

describe("scrollToWhenReady", () => {
  it("scrolls once the element appears (lazy section)", () => {
    vi.useFakeTimers();
    const spy = vi.fn();
    scrollToWhenReady("data-backup");
    vi.advanceTimersByTime(400);
    const el = document.createElement("section"); el.id = "data-backup"; el.scrollIntoView = spy; document.body.appendChild(el);
    vi.advanceTimersByTime(300);
    expect(spy).toHaveBeenCalledTimes(1);
  });
  it("gives up quietly if it never appears", () => {
    vi.useFakeTimers();
    expect(() => { scrollToWhenReady("nope", 500); vi.advanceTimersByTime(2000); }).not.toThrow();
  });
  it("can be cancelled", () => {
    vi.useFakeTimers();
    const spy = vi.fn();
    const el = document.createElement("div"); el.id = "x"; el.scrollIntoView = spy; document.body.appendChild(el);
    const cancel = scrollToWhenReady("x"); cancel();
    vi.advanceTimersByTime(500);
    expect(spy).not.toHaveBeenCalled();
  });
});
