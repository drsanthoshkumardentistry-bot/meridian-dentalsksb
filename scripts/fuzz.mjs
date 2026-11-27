// Randomized property checks on MeriDent's core logic (money, plans, notes, records).
// Run: npm run fuzz -- <total checks> [seed]  (bundles the logic with esbuild, then runs on every core). Every check is a real property that must hold for random input.
// A failing input is printed with its seed and index so it can be replayed. Not part of CI (too long); the quick tests are.
import { Worker, isMainThread, workerData, parentPort } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import os from "node:os";

const here = fileURLToPath(import.meta.url);
const total = Math.max(1, Number(process.argv[2]) || 1_000_000);
const seed0 = Number(process.argv[3]) || 20261128;

if (isMainThread) {
  const n = Math.max(1, Math.min(os.cpus().length, 8));
  const per = Math.floor(total / n);
  const t0 = Date.now();
  let done = 0, failed = 0;
  const failures = [];
  const per_prop = {};
  let finished = 0;
  for (let i = 0; i < n; i++) {
    const count = i === n - 1 ? total - per * (n - 1) : per;
    const w = new Worker(here, { argv: [String(total), String(seed0)], workerData: { count, seed: seed0 + i * 7919, id: i } });
    w.on("message", (m) => {
      if (m.progress) { done += m.progress; if (done % 2_000_000 < m.progress) console.log(`${(done / 1e6).toFixed(0)}M checks, ${failed} failures, ${((Date.now() - t0) / 1000).toFixed(0)}s`); }
      if (m.fail) { failed++; if (failures.length < 20) failures.push(m.fail); }
      if (m.final) { for (const [k, v] of Object.entries(m.final)) per_prop[k] = (per_prop[k] || 0) + v; finished++; if (finished === n) report(); }
    });
    w.on("error", (e) => { console.error("worker crashed", e); process.exit(2); });
  }
  function report() {
    const secs = (Date.now() - t0) / 1000;
    const sum = Object.values(per_prop).reduce((a, b) => a + b, 0);
    console.log(JSON.stringify({ checks: sum, failures: failed, seconds: Math.round(secs), seed: seed0, perProperty: per_prop, failuresShown: failures }, null, 1));
    process.exit(failed ? 1 : 0);
  }
} else {
  const { count, seed, id } = workerData;
  const { toPaise, formatINR, computeLineItemTotals, computeInvoiceTotals, normalizeInvoice, paidPaise, balancePaise, paymentStatus, addPayment, reversePayment, voidInvoice, allocateProportionally, planAccess, editVisit, visitToForm, registrationHistory, prefillComplaint, safePatients, safeInvoices, alertText } = await import(process.env.FUZZ_LIB);

  let s = (seed >>> 0) || 1;
  const rnd = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pick = (a) => a[int(0, a.length - 1)];
  const junk = () => pick([undefined, null, "", " ", "abc", 0, -5, 1e21, NaN, [], {}, [1, null, "x"], { a: 1 }, true, "NKDA", "NRH", "None / NRH", "Penicillin", ["Penicillin", "Sulfa"]]);
  const DAY = 86400000;
  const NOW = Date.UTC(2026, 10, 28);
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const counts = {};
  const props = {
    "line totals add up (taxable + tax = total, cgst + sgst = tax, none negative)"() {
      const items = Array.from({ length: int(1, 8) }, () => ({ name: "x", amount: int(0, 900000) / 100, taxCategory: pick(["therapeutic", "cosmetic", "other"]) }));
      const r = computeLineItemTotals({ items, discount: pick([0, int(0, 5000), int(0, 100000) / 100]) });
      if (!r || r.error) return true;
      const t = r.totals || r;
      const ok = [t.taxableP, t.taxP, t.totalP, t.cgstP, t.sgstP].every((v) => Number.isInteger(v) && v >= 0) && t.taxableP + t.taxP === t.totalP && t.cgstP + t.sgstP === t.taxP;
      return ok || { items, t };
    },
    "single invoice totals add up"() {
      const r = computeInvoiceTotals({ amount: int(0, 5000000) / 100, discount: pick([0, int(0, 100000) / 100]), taxCategory: pick(["therapeutic", "cosmetic", "other"]) });
      if (!r || r.error) return true;
      return (r.taxableP + r.taxP === r.totalP && r.cgstP + r.sgstP === r.taxP && r.totalP >= 0) || r;
    },
    "paise and rupees round-trip"() {
      const p = int(0, 1_000_000_000);
      const r = toPaise((p / 100).toFixed(2));
      return r === p || { p, r };
    },
    "formatINR never throws on junk"() { formatINR(junk()); return true; },
    "split by weights adds up exactly"() {
      const w = Array.from({ length: int(1, 9) }, () => int(0, 100000));
      const total = int(0, 10_000_000);
      const out = allocateProportionally(total, w);
      if (!Array.isArray(out)) return true;
      const sum = out.reduce((a, b) => a + b, 0);
      return (w.every((x) => x === 0) || sum === total) && out.every((v) => v >= 0) || { total, w, out };
    },
    "payments never exceed the bill, and reversing returns the balance"() {
      const totalP = int(100, 5_000_000);
      let inv = normalizeInvoice({ id: "I", date: "01/11/2026", totalP, payments: [] });
      const before = [];
      for (let k = 0; k < int(1, 5); k++) {
        const r = addPayment(inv, { amount: (int(1, Math.ceil(totalP * 1.3)) / 100).toFixed(2), mode: pick(["Cash", "UPI", "Card"]) });
        if (r.ok) { before.push(inv); inv = r.invoice; }
        if (paidPaise(inv) > totalP) return { overpaid: inv };
      }
      if (!inv.payments.length) return true;
      const idx = int(0, inv.payments.length - 1);
      const rv = reversePayment(inv, idx, "mistake entry", "o", new Date(NOW));
      if (!rv.ok) return { rv };
      const lost = inv.payments[idx].amountP;
      return (paidPaise(rv.invoice) === paidPaise(inv) - lost && balancePaise(rv.invoice) === balancePaise(inv) + lost && rv.invoice.reversedPayments.length === 1) || { inv, rv };
    },
    "voiding zeroes money and cannot repeat"() {
      const inv = { id: "I", date: "01/11/2026", totalP: int(100, 9_000_000), payments: int(0, 1) ? [{ date: "d", mode: "Cash", amountP: int(1, 9_000_000) }] : [] };
      const v = voidInvoice(inv, "wrong patient", "o", new Date(NOW));
      if (!v.ok) return { v };
      if (paidPaise(v.invoice) !== 0 || paymentStatus(v.invoice) !== "Void") return { bad: v.invoice };
      return voidInvoice(v.invoice, "again please").ok === false || { again: true };
    },
    "bad invoices never crash"() { normalizeInvoice(junk()); safeInvoices(pick([junk(), [junk(), { id: 1, payments: junk() }]])); paidPaise(junk()); balancePaise(junk()); return true; },
    "plan access never throws, never locks a paid-up clinic, only gets stricter with time"() {
      const createdAt = NOW - int(0, 400) * DAY;
      const paidUntil = pick([0, undefined, NOW + int(-120, 120) * DAY]);
      const base = { createdAt, paidUntil, plan: pick(["", "standard", "pro", "scale"]), paused: pick([false, false, true]), pausedRemaining: int(0, 40) * DAY, live: true };
      const order = { full: 0, grace: 1, viewonly: 2, download: 3 };
      let last = -1;
      for (const d of [0, 3, 9, 20, 40, 90, 400]) {
        const a = planAccess({ ...base, now: NOW + d * DAY });
        if (!(a.mode in order)) return { a };
        if (paidUntil > NOW + d * DAY && !base.paused && base.plan && a.mode !== "full" && createdAt) return { lockedWhilePaid: { base, d, a } };
        if (!base.paused) { if (order[a.mode] < last && !(paidUntil > NOW + d * DAY)) return { loosened: { base, d, a } }; last = Math.max(last, order[a.mode]); }
      }
      return planAccess({ ...base, live: false }).mode === "full" || { offNotFull: true };
    },
    "editing a note keeps its id, history and never loses the rest"() {
      const v = { id: "V1", date: "2026-11-20", complaint: "Pain", findings: "Caries", treatment: "", advice: "" };
      let p = { id: "P", name: "A", visits: [v, { id: "V0", date: "2026-10-01", complaint: "Old" }] };
      const n = int(1, 4);
      for (let k = 0; k < n; k++) {
        const r = editVisit(p, "V1", { ...visitToForm(p.visits.find((x) => x.id === "V1")), findings: "F" + int(0, 999) }, "dr", new Date(NOW + k * DAY));
        if (!r.ok) return { r };
        p = r.patient;
      }
      const cur = p.visits.find((x) => x.id === "V1");
      return (p.visits.length === 2 && cur.edits.length === n && p.visits.some((x) => x.id === "V0") && cur.complaint === "Pain") || { p };
    },
    "registration history: NRH / NKDA rules"() {
      const f = { medicalAlert: pick(["", "NRH", "Asthma", " nrh "]), conditions: pick(["", "NRH", "Diabetes"]), allergies: pick(["", "nkda", "NKDA", "Penicillin", "NRH"]), nrh: rnd() < 0.3 };
      const h = registrationHistory(f);
      if (h.nrh && (h.conditions !== "None / NRH" || h.allergies !== "None / NRH")) return { f, h };
      if (/^nrh$/i.test(String(f.medicalAlert).trim()) && alertText({ medicalAlert: h.medicalAlert, conditions: h.conditions, allergies: h.allergies })) return { redBanner: { f, h } };
      if (!h.nrh && /^nkda$/i.test(f.allergies.trim()) && h.allergies !== "NKDA") return { f, h };
      return true;
    },
    "typed history survives loading, and loading twice changes nothing"() {
      const p = { id: "P" + int(0, 99), name: "Name", allergies: pick(["NKDA", "Penicillin", "None / NRH", ""]), conditions: pick(["Asthma", "None / NRH", ""]), medicalAlert: pick(["", "Cardiac"]), chiefComplaint: pick(["Pain", ""]) };
      const once = safePatients([p])[0];
      if (once !== p) return { changed: { p, once } };
      const bad = safePatients([{ id: junk(), name: junk(), allergies: junk(), visits: junk(), plans: junk() }]);
      return (bad.length === 1 && Array.isArray(bad[0].visits) && typeof bad[0].allergies === "string" && eq(safePatients(bad), bad)) || { bad };
    },
    "complaint pre-fill rules"() {
      const c = pick(["", " ", "Pain 36", "Swelling"]);
      const hasReal = rnd() < 0.5;
      const out = prefillComplaint({ chiefComplaint: c, visits: [{ fromIntake: true }, ...(hasReal ? [{ id: "x" }] : [])] });
      return out === (hasReal ? "" : c.trim()) || { c, hasReal, out };
    },
  };
  const names = Object.keys(props);
  const per = {};
  let sinceReport = 0;
  for (let i = 0; i < count; i++) {
    const name = names[i % names.length];
    let r;
    try { r = props[name](); } catch (e) { r = { threw: String(e && e.message) }; }
    if (r !== true) parentPort.postMessage({ fail: { property: name, worker: id, index: i, seed, detail: JSON.stringify(r).slice(0, 400) } });
    per[name] = (per[name] || 0) + 1;
    if (++sinceReport === 250_000) { parentPort.postMessage({ progress: sinceReport }); sinceReport = 0; }
  }
  if (sinceReport) parentPort.postMessage({ progress: sinceReport });
  parentPort.postMessage({ final: per });
}
