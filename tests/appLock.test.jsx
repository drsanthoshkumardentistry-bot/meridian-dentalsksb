import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { checkPin, clearLock, hasLock, setLock, validPin } from "../src/appLock";
import LockScreen from "../src/components/LockScreen.jsx";
import SecurityCard from "../src/components/SecurityCard.jsx";

beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

describe("app lock", () => {
  it("validates PIN shape", () => {
    expect(validPin("1234")).toBe(true);
    expect(validPin("123")).toBe(false);
    expect(validPin("12ab")).toBe(false);
    expect(validPin("1234567")).toBe(false);
  });
  it("stores only a hash and checks the PIN", async () => {
    await setLock("u1", "4821");
    expect(hasLock("u1")).toBe(true);
    expect(window.localStorage.getItem("merident_lock_u1")).not.toContain("4821");
    expect(await checkPin("u1", "4821")).toBe(true);
    expect(await checkPin("u1", "0000")).toBe(false);
    clearLock("u1");
    expect(hasLock("u1")).toBe(false);
  });
  it("lock screen unlocks on the right PIN and signs out after 5 wrong tries", async () => {
    await setLock("u1", "4821");
    const unlock = vi.fn(); const out = vi.fn();
    render(<LockScreen uid="u1" onUnlock={unlock} onSignOut={out} />);
    const input = screen.getByLabelText("PIN");
    for (let i = 0; i < 5; i++) {
      fireEvent.change(input, { target: { value: "1111" } });
      fireEvent.click(screen.getByRole("button", { name: "Unlock" }));
      await waitFor(() => expect(screen.queryByRole("alert") || out.mock.calls.length).toBeTruthy());
    }
    await waitFor(() => expect(out).toHaveBeenCalled());
    expect(unlock).not.toHaveBeenCalled();
  });
  it("lock screen unlocks with the correct PIN", async () => {
    await setLock("u1", "4821");
    const unlock = vi.fn();
    render(<LockScreen uid="u1" onUnlock={unlock} onSignOut={() => {}} />);
    fireEvent.change(screen.getByLabelText("PIN"), { target: { value: "4821" } });
    fireEvent.click(screen.getByRole("button", { name: "Unlock" }));
    await waitFor(() => expect(unlock).toHaveBeenCalled());
  });
  it("security card sets a PIN only when both entries match", async () => {
    render(<SecurityCard uid="u1" onLockNow={() => {}} />);
    const [a, b] = screen.getAllByLabelText(/PIN|again/i);
    fireEvent.change(a, { target: { value: "1234" } });
    fireEvent.change(b, { target: { value: "9999" } });
    fireEvent.click(screen.getByRole("button", { name: "Turn on PIN lock" }));
    await screen.findByText("The two PINs do not match.");
    fireEvent.change(b, { target: { value: "1234" } });
    fireEvent.click(screen.getByRole("button", { name: "Turn on PIN lock" }));
    await screen.findByText("PIN lock is on for this device.");
    expect(hasLock("u1")).toBe(true);
  });
});
