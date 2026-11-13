import React from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import ErrorBoundary from "../src/components/ErrorBoundary.jsx";
import { isChunkError, shouldAutoReload, crashCode } from "../src/recover.js";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const memory = () => { const m = {}; return { getItem: (k) => m[k] ?? null, setItem: (k, v) => { m[k] = v; } }; };

describe("stale page recovery", () => {
  it("recognises the messages browsers give for a missing file", () => {
    expect(isChunkError(new Error("Failed to fetch dynamically imported module: https://x/assets/App-abc.js"))).toBe(true);
    expect(isChunkError(new Error("Importing a module script failed."))).toBe(true);
    expect(isChunkError({ message: "Loading chunk 12 failed." })).toBe(true);
    expect(isChunkError(new Error("Cannot read properties of undefined"))).toBe(false);
    expect(isChunkError(null)).toBe(false);
  });
  it("reloads at most once a minute, so an outage cannot loop", () => {
    const s = memory();
    expect(shouldAutoReload(s, 1000)).toBe(true);
    expect(shouldAutoReload(s, 20000)).toBe(false);
    expect(shouldAutoReload(s, 62000)).toBe(true);
  });
  it("does not reload when storage is blocked", () => {
    const broken = { getItem() { throw new Error("no"); }, setItem() { throw new Error("no"); } };
    expect(shouldAutoReload(broken, 1)).toBe(false);
  });
  it("makes a short code with no patient data", () => {
    const c = crashCode(new TypeError("secret patient name"), new Date("2026-11-13T06:30:00Z"));
    expect(c).toBe("TypeError-202611130630");
    expect(c).not.toMatch(/secret/);
  });
});

describe("crash screen", () => {
  const Boom = () => { throw new TypeError("boom"); };
  it("explains how to recover and shows a code", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ErrorBoundary><Boom /></ErrorBoundary>);
    expect(screen.getByRole("alert").textContent).toMatch(/records are safe/);
    expect(screen.getByRole("button", { name: "Reload MeriDent" })).toBeTruthy();
    expect(screen.getByText(/TypeError-\d{12}/)).toBeTruthy();
    const link = screen.getByText("Message us on WhatsApp").closest("a");
    expect(link.getAttribute("href")).toMatch(/wa\.me\/919043205927\?text=.*TypeError/);
  });
  it("reloads itself once when a new release removed the file it needs", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    sessionStorage.clear();
    const reload = vi.fn();
    const original = window.location;
    Object.defineProperty(window, "location", { configurable: true, value: { ...original, reload } });
    const Stale = () => { throw new Error("Failed to fetch dynamically imported module: /assets/x.js"); };
    render(<ErrorBoundary><Stale /></ErrorBoundary>);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Updating MeriDent…")).toBeTruthy();
    Object.defineProperty(window, "location", { configurable: true, value: original });
  });
});
