import { describe, it, expect } from "vitest";
import { newTally, addDoc, storageLevel, readsLevel, findDrops, topClinics, snapshot, GIB } from "../scripts/healthCore.js";

const doc = (path, n = 1) => ({ path, fields: { x: { stringValue: "a".repeat(n) } } });

describe("daily health check helpers", () => {
  it("tallies documents per clinic and collection", () => {
    const t = newTally();
    addDoc(t, doc("clinics/abc12345xyz/patients/p1"));
    addDoc(t, doc("clinics/abc12345xyz/patients/p2"));
    addDoc(t, doc("clinics/abc12345xyz/invoices/i1"));
    addDoc(t, doc("config/access"));
    expect(t.docs).toBe(4);
    expect(t.clinics.abc12345xyz.counts).toEqual({ patients: 2, invoices: 1 });
    expect(topClinics(t)[0].clinic).toBe("abc12345");
  });
  it("warns at 70% and 90% of 1 GB with the index factor", () => {
    expect(storageLevel(0.1 * GIB).level).toBe("ok");
    expect(storageLevel(0.4 * GIB).level).toBe("warn");
    expect(storageLevel(0.46 * GIB).level).toBe("urgent");
  });
  it("flags a clinic that lost more than a fifth of its patients, but not small clinics", () => {
    const prev = { clinics: { big: { counts: { patients: 100 } }, tiny: { counts: { patients: 5 } }, gone: { counts: { invoices: 50 } } } };
    const cur = { clinics: { big: { counts: { patients: 70 } }, tiny: { counts: { patients: 0 } } } };
    const drops = findDrops(prev, cur);
    expect(drops.map((d) => d.clinic + d.what)).toEqual(["bigpatients", "goneinvoices"]);
    expect(findDrops(prev, { clinics: { big: { counts: { patients: 85 } }, gone: { counts: { invoices: 50 } } } })).toEqual([]);
  });
  it("snapshots counts only", () => {
    const t = newTally(); addDoc(t, doc("clinics/c1/patients/p1", 500));
    expect(JSON.stringify(snapshot(t))).not.toContain("aaaa");
  });
});

import { checkBackup } from "../scripts/healthCore.js";
describe("backup check", () => {
  const now = Date.parse("2026-11-20T12:00:00Z");
  it("passes for a recent backup of normal size", () => {
    expect(checkBackup({ lastSuccessAt: "2026-11-20T01:49:00Z", bytes: 90000, prevBytes: 88000, now })).toEqual([]);
  });
  it("flags a missing, stale, expired or shrunken backup", () => {
    expect(checkBackup({ now }).length).toBe(1);
    expect(checkBackup({ lastSuccessAt: "2026-11-18T01:00:00Z", bytes: 1000, now })[0]).toMatch(/hours ago/);
    expect(checkBackup({ lastSuccessAt: "2026-11-20T01:00:00Z", bytes: 0, expired: true, now })[0]).toMatch(/missing or expired/);
    expect(checkBackup({ lastSuccessAt: "2026-11-20T01:00:00Z", bytes: 30000, prevBytes: 100000, now })[0]).toMatch(/shrank/);
  });
  it("ignores shrinkage for tiny early backups", () => {
    expect(checkBackup({ lastSuccessAt: "2026-11-20T01:00:00Z", bytes: 500, prevBytes: 5000, now })).toEqual([]);
  });
});

describe("readsLevel", () => {
  it("is ok for a few hundred documents", () => expect(readsLevel(210).level).toBe("ok"));
  it("warns at 70% of the free 50,000 reads", () => {
    expect(readsLevel(7000).level).toBe("warn");
    expect(readsLevel(9500).level).toBe("urgent");
  });
});
