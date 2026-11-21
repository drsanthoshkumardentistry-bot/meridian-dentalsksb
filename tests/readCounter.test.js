import { describe, it, expect } from "vitest";
import { recordReads, readsToday, averageDailyReads, monthlyRupees, serverReadsOf } from "../src/readCounter.js";

const mem = () => { const m = {}; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); } }; };
const D1 = Date.UTC(2026, 10, 22, 6);
const D2 = Date.UTC(2026, 10, 23, 6);

describe("readCounter", () => {
  it("adds reads per day and ignores bad numbers", () => {
    const s = mem();
    recordReads(120, D1, s); recordReads(30, D1, s); recordReads(-5, D1, s); recordReads("x", D1, s); recordReads(0, D1, s);
    expect(readsToday(D1, s)).toBe(150);
    expect(readsToday(D2, s)).toBe(0);
  });
  it("averages over counted days", () => {
    const s = mem(); recordReads(100, D1, s); recordReads(300, D2, s);
    expect(averageDailyReads(s)).toBe(200);
  });
  it("never throws when storage is blocked or corrupt", () => {
    const bad = { getItem: () => { throw new Error("no"); }, setItem: () => { throw new Error("no"); } };
    expect(() => recordReads(5, D1, bad)).not.toThrow();
    expect(readsToday(D1, bad)).toBe(0);
    const junk = { getItem: () => "{not json", setItem: () => {} };
    expect(readsToday(D1, junk)).toBe(0);
    expect(readsToday(D1, null)).toBe(0);
  });
  it("estimates rupees a month", () => {
    expect(monthlyRupees(15000)).toBe(24);
    expect(monthlyRupees(0)).toBe(0);
  });
  it("counts only reads that came from the server", () => {
    expect(serverReadsOf({ metadata: { fromCache: true }, docChanges: () => [1, 2] })).toBe(0);
    expect(serverReadsOf({ metadata: { fromCache: false }, docChanges: () => [1, 2, 3] })).toBe(3);
    expect(serverReadsOf({})).toBe(0);
    expect(serverReadsOf(null)).toBe(0);
  });
});
