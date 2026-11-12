import { describe, it, expect, beforeEach } from "vitest";
import { setPendingConnectOnly, hasPendingConnectOnly, claimPendingConnectOnly, isConnectOnly, setConnectOnly, connectOnlyChoice, tabTitle } from "./connectOnly.js";

describe("specialist mode", () => {
  beforeEach(() => window.localStorage.clear());
  it("turns the sign-in choice into a per-account setting once", () => {
    setPendingConnectOnly(true);
    expect(hasPendingConnectOnly()).toBe(true);
    expect(claimPendingConnectOnly("u1")).toBe(true);
    expect(isConnectOnly("u1")).toBe(true);
    expect(hasPendingConnectOnly()).toBe(false);
    expect(claimPendingConnectOnly("u2")).toBe(false);
    expect(isConnectOnly("u2")).toBe(false);
  });
  it("remembers when the person switched it off", () => {
    expect(connectOnlyChoice("u1")).toBeNull();
    setConnectOnly("u1", true);
    expect(connectOnlyChoice("u1")).toBe(1);
    setConnectOnly("u1", false);
    expect(connectOnlyChoice("u1")).toBe(0);
  });
  it("puts the count in the tab title", () => {
    expect(tabTitle(0)).toBe("MeriDent");
    expect(tabTitle(3)).toBe("(3) MeriDent");
  });
});
