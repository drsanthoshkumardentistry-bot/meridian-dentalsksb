import { describe, it, expect, vi, beforeEach } from "vitest";
import { randomBytes } from "node:crypto";

const mem = new Map();
vi.mock("firebase/firestore", () => {
  const key = (segs) => segs.join("/");
  return {
    collection: (_db, ...segs) => ({ col: key(segs) }),
    doc: (a, ...segs) => (a && a.col ? { path: `${a.col}/${segs[0]}` } : { path: key(segs) }),
    setDoc: async (ref, data) => { mem.set(ref.path, data); },
    getDoc: async (ref) => ({ exists: () => mem.has(ref.path), data: () => mem.get(ref.path) }),
    getDocs: async (c) => ({ docs: [...mem.entries()].filter(([p]) => p.startsWith(`${c.col}/`) && !p.slice(c.col.length + 1).includes("/")).map(([p, d]) => ({ id: p.split("/").pop(), data: () => d })) }),
    deleteDoc: async (ref) => { mem.delete(ref.path); },
  };
});

import { saveRestorePoint, listRestorePoints, loadRestorePoint, pruneRestorePoints } from "../src/restoreStore.js";
import { CHUNK_CHARS } from "../src/restorePoints.js";

beforeEach(() => mem.clear());
// Random text does not compress, so these tests still exercise the multi-part path now that copies are gzipped.
const rnd = (chars) => randomBytes(Math.ceil((chars * 3) / 4)).toString("base64").slice(0, chars);
const bigBackup = (chars) => ({ format: "merident-backup", counts: { patients: 1, appointments: 0, invoices: 0 }, data: { blob: rnd(chars) } });
const backup = (n) => ({ format: "merident-backup", counts: { patients: n, appointments: 0, invoices: 0 }, data: { patients: Array.from({ length: n }, (_, i) => ({ id: `P${i}`, name: "x".repeat(50) })) } });

describe("restore point store", () => {
  it("saves in parts, lists, and loads back exactly what was saved", async () => {
    const b = bigBackup(CHUNK_CHARS * 2.5); // still several parts after compression
    expect(JSON.stringify(b).length).toBeGreaterThan(CHUNK_CHARS);
    const entry = await saveRestorePoint({}, "c1", b, new Date("2026-11-13T10:00:00Z"));
    expect(entry.parts).toBeGreaterThan(1);
    const list = await listRestorePoints({}, "c1");
    expect(list.map((p) => p.id)).toEqual([entry.id]);
    expect(await loadRestorePoint({}, "c1", list[0])).toEqual(b);
  });
  it("refuses a copy that is too large", async () => {
    await expect(saveRestorePoint({}, "c1", { counts: {}, blob: rnd(6300000) })).rejects.toThrow("too-large");
  });
  it("reports a missing part instead of returning damaged data", async () => {
    const entry = await saveRestorePoint({}, "c1", bigBackup(CHUNK_CHARS * 2.5), new Date("2026-11-13T10:00:00Z"));
    mem.delete(`clinics/c1/restorePointParts/${entry.id}_1`);
    await expect(loadRestorePoint({}, "c1", entry)).rejects.toThrow("missing-part");
  });
  it("prunes old copies and removes their parts", async () => {
    const times = Array.from({ length: 12 }, (_, i) => new Date(Date.UTC(2026, 10, 1 + i, 9)));
    for (const t of times) await saveRestorePoint({}, "c1", backup(5), t);
    const all = await listRestorePoints({}, "c1");
    expect(all.length).toBe(12);
    await pruneRestorePoints({}, "c1", all);
    const left = await listRestorePoints({}, "c1");
    expect(left.length).toBeLessThan(12);
    expect(left.length).toBeGreaterThanOrEqual(7); // the newest seven always stay
    expect([...mem.keys()].filter((k) => k.includes("restorePointParts")).length).toBe(left.length);
  });
});

describe("compressed restore points", () => {
  it("shrinks repetitive records a lot and still loads them back exactly", async () => {
    const b = backup(8000);
    const entry = await saveRestorePoint({}, "c2", b, new Date("2026-11-13T10:00:00Z"));
    expect(entry.enc).toBe("gz");
    expect(entry.chars).toBeLessThan(JSON.stringify(b).length / 3);
    const [point] = await listRestorePoints({}, "c2");
    expect(await loadRestorePoint({}, "c2", point)).toEqual(b);
  });
});
