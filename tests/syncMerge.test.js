import { describe, it, expect, vi } from "vitest";
import { mergeDoc, sameJson } from "../src/syncMerge.js";
import { writeDocMerged, isOfflineError } from "../src/cloudWrite.js";

const base = { id: "P1", name: "Asha", toothConditions: { 11: ["CAR"], 12: ["HLT"] }, visits: [{ id: "V1", note: "a" }], opgImage: "data:image/jpeg;base64,AAA" };

describe("merging two devices' edits to one patient", () => {
  it("keeps edits to different teeth from both devices", () => {
    const local = { ...base, toothConditions: { ...base.toothConditions, 13: ["RCT"] } };
    const remote = { ...base, toothConditions: { ...base.toothConditions, 14: ["EXT"] } };
    expect(mergeDoc(base, local, remote).toothConditions).toEqual({ 11: ["CAR"], 12: ["HLT"], 13: ["RCT"], 14: ["EXT"] });
  });
  it("on a conflict on the same tooth, keeps this device's edit", () => {
    const local = { ...base, toothConditions: { ...base.toothConditions, 11: ["RCT"] } };
    const remote = { ...base, toothConditions: { ...base.toothConditions, 11: ["EXT"] } };
    expect(mergeDoc(base, local, remote).toothConditions[11]).toEqual(["RCT"]);
  });
  it("takes the cloud's change when this device did not touch that field, and the reverse", () => {
    const m = mergeDoc(base, { ...base, name: "Asha K" }, { ...base, visits: [...base.visits, { id: "V2", note: "b" }] });
    expect(m.name).toBe("Asha K");
    expect(m.visits.map((v) => v.id)).toEqual(["V1", "V2"]);
  });
  it("combines visit notes added on both devices", () => {
    const m = mergeDoc(base, { ...base, visits: [...base.visits, { id: "V3", note: "here" }] }, { ...base, visits: [...base.visits, { id: "V2", note: "there" }] });
    expect(m.visits.map((v) => v.id).sort()).toEqual(["V1", "V2", "V3"]);
  });
  it("honours a delete made here when the other device left it alone, but not when it edited it", () => {
    const deleted = { ...base, toothConditions: { 12: ["HLT"] } };
    expect(mergeDoc(base, deleted, base).toothConditions).toEqual({ 12: ["HLT"] });
    const remote = { ...base, toothConditions: { ...base.toothConditions, 11: ["RCT"] } };
    expect(mergeDoc(base, deleted, remote).toothConditions[11]).toEqual(["RCT"]);
  });
  it("never deletes what the cloud holds when it does not know the last-synced copy (a cached copy without the OPG image)", () => {
    const stripped = { id: "P1", name: "Asha Z", toothConditions: base.toothConditions, visits: base.visits };
    const m = mergeDoc(undefined, stripped, base);
    expect(m.opgImage).toBe(base.opgImage);
    expect(m.name).toBe("Asha Z");
  });
  it("is stable for identical copies, odd input and keeps the id", () => {
    expect(mergeDoc(base, base, base)).toEqual(base);
    expect(mergeDoc(null, { id: 1, a: 1 }, null)).toEqual({ id: 1, a: 1 });
    expect(mergeDoc(undefined, { id: "X", a: [1, 2] }, { id: "X", a: [3] }).a).toEqual([1, 2]);
    expect(sameJson({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
  });
});

describe("saving without overwriting a newer cloud copy", () => {
  const ref = { path: "clinics/c/patients/P1" };
  const fake = (remote) => {
    const tx = { get: vi.fn(async () => ({ exists: () => remote !== undefined, data: () => remote })), set: vi.fn() };
    return { tx, runTransaction: vi.fn(async (_db, fn) => fn(tx)) };
  };
  it("writes the merge, not this device's copy", async () => {
    const { tx, runTransaction } = fake({ ...base, toothConditions: { ...base.toothConditions, 14: ["EXT"] } });
    const local = { ...base, toothConditions: { ...base.toothConditions, 13: ["RCT"] } };
    const merged = await writeDocMerged({ db: {}, ref, clean: local, base, runTransaction, setDoc: vi.fn() });
    expect(merged.toothConditions).toMatchObject({ 13: ["RCT"], 14: ["EXT"] });
    expect(tx.set).toHaveBeenCalledWith(ref, merged);
  });
  it("creates the record when the cloud has none, and skips the write when nothing differs", async () => {
    const a = fake(undefined);
    await writeDocMerged({ db: {}, ref, clean: base, base: undefined, runTransaction: a.runTransaction, setDoc: vi.fn() });
    expect(a.tx.set).toHaveBeenCalledWith(ref, base);
    const b = fake(base);
    await writeDocMerged({ db: {}, ref, clean: base, base, runTransaction: b.runTransaction, setDoc: vi.fn() });
    expect(b.tx.set).not.toHaveBeenCalled();
  });
  it("falls back to the queued plain save when offline, and passes other errors on", async () => {
    const setDoc = vi.fn(async () => {});
    const off = { runTransaction: vi.fn(async () => { throw Object.assign(new Error("Failed to get document because the client is offline."), { code: "unavailable" }); }) };
    expect(await writeDocMerged({ db: {}, ref, clean: base, base, runTransaction: off.runTransaction, setDoc })).toBe(base);
    expect(setDoc).toHaveBeenCalledWith(ref, base);
    const denied = { runTransaction: vi.fn(async () => { throw Object.assign(new Error("denied"), { code: "permission-denied" }); }) };
    await expect(writeDocMerged({ db: {}, ref, clean: base, base, runTransaction: denied.runTransaction, setDoc })).rejects.toThrow("denied");
    expect(isOfflineError({ code: "unavailable" })).toBe(true);
    expect(isOfflineError({ code: "permission-denied" })).toBe(false);
  });
  it("uses the plain save when transactions are not available", async () => {
    const setDoc = vi.fn(async () => {});
    await writeDocMerged({ db: {}, ref, clean: base, base, runTransaction: undefined, setDoc });
    expect(setDoc).toHaveBeenCalledTimes(1);
  });
});

describe("when the last cloud copy is unknown", () => {
  it("an empty list on this device does not wipe a list the cloud already has", () => {
    const local = { id: "P1", name: "A", visits: [] };
    const remote = { id: "P1", name: "A", visits: [{ id: "V1", date: "2026-11-01" }] };
    expect(mergeDoc(undefined, local, remote).visits).toEqual(remote.visits);
  });
  it("still lets this device delete the last item when it knew the cloud copy", () => {
    const base = { id: "P1", visits: [{ id: "V1" }] };
    expect(mergeDoc(base, { id: "P1", visits: [] }, base).visits).toEqual([]);
  });
});
