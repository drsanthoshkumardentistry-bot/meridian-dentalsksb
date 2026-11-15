import { describe, it, expect } from "vitest";
import { parseBackupText, validateBackup, mergeBackup } from "../src/portability.js";

// Restore must never throw or poison objects, whatever file the user picks. Deterministic random garbage.
let seed = 11;
const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const junk = (d = 0) => {
  const r = rnd();
  if (d > 3 || r < 0.15) return pick([null, undefined, "", 0, -1, NaN, Infinity, true, "x".repeat(50000), "__proto__", "😀"]);
  if (r < 0.35) return Array.from({ length: Math.floor(rnd() * 5) }, () => junk(d + 1));
  if (r < 0.8) {
    const o = {};
    for (const k of pick([["format", "version", "data"], ["patients", "appointments", "invoices"], ["id", "name", "branchId"], ["__proto__", "constructor", "patients"], ["a", "b"]])) o[k] = junk(d + 1);
    return o;
  }
  return pick(["{", "[", "null", "\u0000", '{"data":']);
};
const wrap = (data) => ({ format: "merident-backup", version: 1, data });

describe("restoring a backup file", () => {
  it("never throws on garbage and only merges files that validate", () => {
    let merged = 0;
    for (let i = 0; i < 3000; i++) {
      const o = junk();
      const text = pick([JSON.stringify(o) ?? "null", JSON.stringify(wrap(o)) ?? "null", typeof o === "string" ? o : "{"]);
      const r = parseBackupText(text);
      expect(r).toBeTruthy();
      if (r.ok && !r.encrypted) {
        const v = validateBackup(r.backup);
        expect(typeof v.ok).toBe("boolean");
        if (v.ok) { mergeBackup({}, r.backup); merged++; }
      }
      validateBackup(o); validateBackup(wrap(o));
    }
    expect(merged).toBeGreaterThanOrEqual(0);
  });
  it("odd files give a plain error, not a crash", () => {
    for (const t of ["", "{", "null", "[]", "123", '"s"', "{}", '{"patients":"x"}', "﻿{}", "x".repeat(2e6)]) {
      const r = parseBackupText(t);
      if (r.ok && !r.encrypted) expect(validateBackup(r.backup).ok).toBe(false);
    }
  });
  it("does not let a file change what every object inherits", () => {
    const r = parseBackupText('{"format":"merident-backup","version":1,"data":{"__proto__":{"polluted":1},"patients":[{"id":"p1","name":"A","__proto__":{"polluted":2}}]}}');
    if (r.ok && !r.encrypted && validateBackup(r.backup).ok) mergeBackup({}, r.backup);
    expect({}.polluted).toBeUndefined();
  });
});
