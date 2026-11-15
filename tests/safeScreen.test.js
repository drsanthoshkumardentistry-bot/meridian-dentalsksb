import { describe, it, expect } from "vitest";
import { SCREENS, safeScreen, NAV_BY_ROLE } from "../src/roles.js";

describe("safeScreen", () => {
  it("keeps every real screen", () => { for (const s of SCREENS) expect(safeScreen(s)).toBe(s); });
  it("falls back to the Dashboard for anything unknown", () => {
    for (const v of [null, undefined, "", "MeriDent DocLog", "Today", "old name", 5, {}, "dashboard", "<b>x</b>"]) expect(safeScreen(v)).toBe("Dashboard");
  });
  it("every screen a role may open is a known screen", () => {
    for (const list of Object.values(NAV_BY_ROLE)) for (const s of list || []) expect(SCREENS).toContain(s);
  });
});
