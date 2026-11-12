import { describe, it, expect, beforeEach } from "vitest";
import { signInChoice, setSignInChoice, isConnectOnly, setConnectOnly, resolveConnectOnly, tabTitle } from "./connectOnly.js";

describe("specialist mode", () => {
  beforeEach(() => window.localStorage.clear());
  it("is off by default, and a ticked sign-in box turns it on for that account", () => {
    expect(resolveConnectOnly("u1")).toBe(false);
    setSignInChoice(true);
    expect(resolveConnectOnly("u1")).toBe(true);
    expect(isConnectOnly("u1")).toBe(true);
  });
  it("unticking the box on the next sign-in turns it back off (the reported bug)", () => {
    setSignInChoice(true);
    resolveConnectOnly("u1");
    setSignInChoice(false);
    expect(resolveConnectOnly("u1")).toBe(false);
    expect(isConnectOnly("u1")).toBe(false);
  });
  it("remembers the box for a returning specialist", () => {
    expect(signInChoice()).toBeNull();
    setSignInChoice(true);
    expect(signInChoice()).toBe(true);
  });
  it("keeps the saved setting for an account when the box was never touched here", () => {
    setConnectOnly("u1", true);
    expect(resolveConnectOnly("u1")).toBe(true);
    expect(resolveConnectOnly("u2")).toBe(false);
  });
  it("ignores the old stored flag format", () => {
    window.localStorage.setItem("merident.connectOnly.u1", "1");
    expect(resolveConnectOnly("u1")).toBe(false);
  });
  it("puts the count in the tab title", () => {
    expect(tabTitle(0)).toBe("MeriDent");
    expect(tabTitle(3)).toBe("(3) MeriDent");
  });
});
