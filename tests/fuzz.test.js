/* Randomised stress test: 100,000 cases over the money, patient-matching, backup and medicine code.
 * Hostile inputs on purpose (null, NaN, text, negatives, huge numbers). Seeded, so a failure can be replayed. */
import { describe, it, expect } from "vitest";
import { allocateProportionally, computeLineItemTotals, paidPaise, balancePaise, normalizeInvoice, toPaise } from "../src/billing.js";
import { findDuplicates, duplicateWarning, duplicateKey } from "../src/duplicates.js";
import { chunkText, joinChunks } from "../src/restorePoints.js";
import { cleanMedicine } from "../src/medicines.js";
import { validPin } from "../src/appLock.js";
import { rxPdfName } from "../src/prescriptionPdf.js";

const SEED = 20261113;
const mulberry = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const mk = (seed) => {
  const r = mulberry(seed);
  const int = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  const pick = (arr) => arr[int(0, arr.length - 1)];
  const str = (max = 12) => Array.from({ length: int(0, max) }, () => pick(["a", "Z", "7", " ", "-", "+", ".", ",", "ஆ", "ह", "é", "😀", "\n", "<", "'"])).join("");
  const junk = () => pick([null, undefined, NaN, Infinity, -5, 0, "", "abc", "1,200.50", "  ", {}, [], true, 1e15, -1e15, 0.005, "9" .repeat(30)]);
  return { r, int, pick, str, junk };
};
const isInt = (n) => Number.isFinite(n) && Number.isInteger(n);

describe("fuzz: 100,000 random cases", () => {
  it("splits a discount exactly (20,000)", () => {
    const { int } = mk(SEED + 1);
    for (let i = 0; i < 20000; i += 1) {
      const weights = Array.from({ length: int(0, 8) }, () => int(0, 1000000));
      const total = int(0, 10000000);
      const out = allocateProportionally(total, weights);
      expect(out).toHaveLength(weights.length);
      out.forEach((v) => { expect(isInt(v)).toBe(true); expect(v).toBeGreaterThanOrEqual(0); });
      const sum = weights.reduce((s, w) => s + w, 0);
      const got = out.reduce((s, v) => s + v, 0);
      if (total > 0 && sum > 0) expect(got).toBe(total); else expect(got).toBe(0);
    }
  });

  it("keeps invoice totals consistent (20,000)", () => {
    const { int, pick, junk, str } = mk(SEED + 2);
    for (let i = 0; i < 20000; i += 1) {
      const items = Array.from({ length: int(0, 6) }, () => ({ description: str(), amount: pick([int(0, 500000), int(0, 99999) / 100, junk()]), taxCategory: pick(["therapeutic", "cosmetic", "nope", undefined]) }));
      const t = computeLineItemTotals({ items, discount: pick([0, int(0, 600000), junk()]) });
      ["subtotalP", "discountP", "taxableP", "cgstP", "sgstP", "taxP", "totalP"].forEach((k) => expect(isInt(t[k]), `${k} ${t[k]}`).toBe(true));
      expect(t.discountP).toBeLessThanOrEqual(t.subtotalP);
      expect(t.taxableP).toBe(t.subtotalP - t.discountP);
      expect(t.cgstP + t.sgstP).toBe(t.taxP);
      expect(t.totalP).toBe(t.taxableP + t.taxP);
      expect(t.totalP).toBeGreaterThanOrEqual(0);
    }
  });

  it("never shows a negative balance, even with junk payments (20,000)", () => {
    const { int, pick, junk } = mk(SEED + 3);
    for (let i = 0; i < 20000; i += 1) {
      const inv = pick([
        { totalP: int(0, 1000000), payments: Array.from({ length: int(0, 5) }, () => pick([null, 5, "x", { amountP: int(0, 1200000) }, { amountP: junk() }])) },
        { total: junk(), rawAmount: junk(), status: pick(["Self-Pay Completed", "Claim Settled", "Pending"]) },
      ]);
      const n = normalizeInvoice(inv);
      const bal = balancePaise(n);
      expect(Number.isFinite(bal)).toBe(true);
      expect(bal).toBeGreaterThanOrEqual(0);
      expect(bal).toBeLessThanOrEqual(Math.max(0, Number(n.totalP) || 0));
      expect(Number.isFinite(paidPaise(n))).toBe(true);
      expect(Number.isFinite(toPaise(junk()))).toBe(true);
    }
  });

  it("matches patients safely and never crashes (20,000)", () => {
    const { int, pick, junk, str } = mk(SEED + 4);
    const phone = () => pick(["9876543210", "+91 98765-43210", "09876543210", String(int(1000000000, 9999999999)), "123", "", junk()]);
    for (let i = 0; i < 20000; i += 1) {
      const patients = pick([null, undefined, "x", Array.from({ length: int(0, 6) }, () => pick([null, 3, { name: pick(["Asha K", str()]), phone: phone() }]))]);
      const entry = pick([undefined, null, { name: pick(["asha  k", str(), junk()]), phone: phone() }]);
      let f;
      try { f = findDuplicates(patients, entry || undefined); } catch (e) { throw new Error(`threw on ${JSON.stringify([patients, entry])}: ${e.message}`); }
      f.same.forEach((p) => expect(f.shared.includes(p)).toBe(false));
      expect(typeof duplicateWarning(f)).toBe("string");
      expect(typeof duplicateKey(entry || undefined)).toBe("string");
    }
  });

  it("round-trips backups, medicines, PINs and file names (20,000)", () => {
    const { int, pick, junk, str } = mk(SEED + 5);
    for (let i = 0; i < 20000; i += 1) {
      const text = str(300) + pick(["", "😀😀", "ஆ"]);
      const parts = chunkText(text, int(1, 40));
      expect(joinChunks(parts)).toBe(text);

      const m = cleanMedicine({ name: pick([str(80), junk()]), frequency: pick([str(10), junk()]), duration: pick([str(10), junk()]), dosage: junk(), generic: junk(), instruction: junk() }, "id");
      expect(typeof m.ok).toBe("boolean");
      if (m.ok) { expect(m.med.name.length).toBeLessThanOrEqual(60); expect(m.med.name.length).toBeGreaterThan(0); }

      const pin = pick([String(int(0, 999999)).padStart(int(0, 7), "0"), str(8), junk()]);
      expect(validPin(pin)).toBe(/^\d{4,6}$/.test(String(pin || "")));

      expect(rxPdfName({ name: pick([str(30), junk()]) })).toMatch(/^prescription-[a-z0-9-]+\.pdf$/);
    }
  });
});
