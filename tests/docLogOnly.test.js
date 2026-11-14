import { describe, it, expect, beforeEach } from "vitest";
import { docSignInChoice, setDocSignInChoice, isDocLogOnly, setDocLogOnly, resolveDocLogOnly } from "../src/docLogOnly.js";

beforeEach(() => window.localStorage.clear());

describe("DocLog-only mode", () => {
  it("is off until the sign-in box is ticked, then follows it for that account", () => {
    expect(resolveDocLogOnly("u1")).toBe(false);
    setDocSignInChoice(true);
    expect(resolveDocLogOnly("u1")).toBe(true);
    expect(isDocLogOnly("u1")).toBe(true);
    expect(isDocLogOnly("u2")).toBe(false);
    setDocSignInChoice(false);
    expect(resolveDocLogOnly("u1")).toBe(false);
  });
  it("keeps the saved setting when the box was never touched on this device, and ignores a missing account", () => {
    setDocLogOnly("u1", true);
    expect(docSignInChoice()).toBe(null);
    expect(resolveDocLogOnly("u1")).toBe(true);
    expect(resolveDocLogOnly("")).toBe(false);
    expect(isDocLogOnly(undefined)).toBe(false);
  });
});
