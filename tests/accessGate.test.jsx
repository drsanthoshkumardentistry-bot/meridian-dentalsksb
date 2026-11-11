import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

const h = vi.hoisted(() => ({ cfg: null, allowed: new Set(), fail: false }));
vi.mock("firebase/firestore", () => ({
  doc: (_db, ...p) => ({ path: p.join("/") }),
  getDoc: async (ref) => {
    if (h.fail) throw new Error("offline");
    if (ref.path === "config/access") return { exists: () => Boolean(h.cfg), data: () => h.cfg };
    const email = ref.path.replace("allowedEmails/", "");
    return { exists: () => h.allowed.has(email), data: () => ({}) };
  },
}));

import { checkAccess } from "../src/accessGate.js";
import AccessLimited from "../src/components/AccessLimited.jsx";

afterEach(() => { cleanup(); h.cfg = null; h.allowed = new Set(); h.fail = false; });

describe("closed access mode", () => {
  it("is open when the switch is missing or off", async () => {
    expect(await checkAccess({}, "a@gmail.com")).toBe("ok");
    h.cfg = { restrict: false };
    expect(await checkAccess({}, "a@gmail.com")).toBe("ok");
  });
  it("lets approved addresses in (any letter case) and blocks the rest", async () => {
    h.cfg = { restrict: true };
    h.allowed = new Set(["dr@gmail.com"]);
    expect(await checkAccess({}, "Dr@Gmail.com ")).toBe("ok");
    expect(await checkAccess({}, "other@gmail.com")).toBe("blocked");
  });
  it("does not lock people out when the list cannot be read", async () => {
    h.cfg = { restrict: true };
    h.fail = true;
    expect(await checkAccess({}, "a@gmail.com")).toBe("ok");
  });
  it("shows a clear screen with a sign-out button", () => {
    const out = vi.fn();
    render(<AccessLimited email="x@gmail.com" onLogout={out} />);
    expect(screen.getByTestId("access-limited").textContent).toMatch(/x@gmail.com/);
    fireEvent.click(screen.getByText("Sign out"));
    expect(out).toHaveBeenCalled();
  });
});
