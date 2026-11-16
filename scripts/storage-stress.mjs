// Randomised stress test of MeriDent's storage helpers: browser storage that fails or returns junk, restore points,
// chunked backups, storage-usage maths and the cloud/device merge. Usage: node scripts/storage-stress.mjs [seed] [count]
// Deterministic for a given seed. Real Firestore and a real browser are not covered here.
import * as rp from "../src/restorePoints.js";
import * as sc from "../src/storageCheck.js";
import * as rel from "../src/reliability.js";
import * as su from "../src/storageUsage.js";
import { mergeDoc } from "../src/syncMerge.js";

const SEED = Number(process.argv[2] || 20261116);
const N = Number(process.argv[3] || 10000);
let s = SEED >>> 0;
const rnd = () => { s += 0x6d2b79f5; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = (xs) => xs[int(0, xs.length - 1)];
const chance = (p) => rnd() < p;
const ALPHABET = ["a", "Z", " ", "\n", "é", "த", "😀", "\u0000", "\"", "\\", "{", "9"];
const text = (n) => Array.from({ length: n }, () => pick(ALPHABET)).join("");
const DAY = 86400000, NOW = Date.UTC(2026, 10, 16, 5, 0, 0);

const fails = {}; const total = {};
const ok = (cond, name, detail) => { total[name] = (total[name] || 0) + 1; if (!cond) { const f = (fails[name] ||= { n: 0, sample: "" }); f.n++; if (!f.sample) f.sample = String(typeof detail === "function" ? detail() : detail).slice(0, 300); } };
const noThrow = (name, fn) => { try { return { v: fn() }; } catch (e) { ok(false, name, e && e.message); return { threw: true }; } };

// Browser storage in every state it can be in.
const makeStore = (mode) => {
  const data = new Map();
  const bad = () => { throw new Error(mode); };
  if (mode === "works") return { getItem: (k) => (data.has(k) ? data.get(k) : null), setItem: (k, v) => { data.set(k, String(v)); }, removeItem: (k) => data.delete(k), _d: data };
  if (mode === "quota") return { getItem: (k) => (data.has(k) ? data.get(k) : null), setItem: () => { const e = new Error("QuotaExceededError"); e.name = "QuotaExceededError"; throw e; } };
  if (mode === "blocked") return { getItem: bad, setItem: bad };
  if (mode === "junk") return { getItem: () => pick(["{", "null", "[]", "\"x\"", "123", "{\"mib\":\"a\",\"at\":null}", "{\"mib\":-1,\"at\":1}", text(int(0, 20)), "", undefined, null]), setItem: () => {} };
  if (mode === "null") return null;
  return {};
};
const MODES = ["works", "quota", "blocked", "junk", "null", "empty"];

const mkPoint = (i) => ({ id: `rp-${i}`, at: chance(0.1) ? pick(["", "bad", undefined, null, 5]) : new Date(NOW - int(0, 200) * 3600000 * pick([1, 5, 24])).toISOString(), counts: { patients: int(0, 500), appointments: int(0, 900), invoices: int(0, 900) } });
const validPoints = (ps) => ps.filter((p) => p && p.id && p.at);

const cases = {
  chunks() {
    const t = text(int(0, 400)); const size = pick([1, 2, 3, 7, 50, 0, -5, NaN, 2.7, Infinity, undefined, "9", 1e9]);
    const r = noThrow("chunks: never throws", () => rp.chunkText(t, size)); if (r.threw) return;
    const parts = r.v;
    ok(rp.joinChunks(parts) === t, "chunks: joining gives back exactly the same text", () => `${JSON.stringify(t).slice(0, 60)} size ${size}`);
    ok(Array.isArray(parts) && parts.length >= 1, "chunks: always at least one piece", () => JSON.stringify(parts));
    const eff = Number.isFinite(size) && size >= 1 ? Math.floor(size) : rp.CHUNK_CHARS;
    ok(parts.every((p) => p.length <= eff), "chunks: no piece is longer than the size asked for", () => `size ${size}`);
    ok(parts.length === Math.max(1, Math.ceil(t.length / eff)), "chunks: right number of pieces", () => `${parts.length} for ${t.length}/${eff}`);
  },
  chunkBig() { // a clinic-sized backup, split at the real limit and put back together
    const t = "x".repeat(int(1, 900000)) + text(int(0, 50)); const parts = rp.chunkText(t);
    ok(rp.joinChunks(parts) === t && parts.every((p) => p.length <= rp.CHUNK_CHARS), "chunks: a clinic-sized backup survives the real chunk limit", () => `${t.length}`);
  },
  prune() {
    const ps = Array.from({ length: int(0, 9) }, (_, i) => mkPoint(i)); const keep = pick([3, 1, 5, 2, 10]);
    const r = noThrow("prune: never throws", () => rp.toDelete(ps, keep)); if (r.threw) return;
    const del = new Set(r.v); const valid = validPoints(ps); const sorted = rp.sortedPoints(ps);
    ok(del.size === r.v.length, "prune: no restore point listed twice", () => JSON.stringify(r.v));
    ok(valid.length - del.size === Math.min(keep, valid.length), "prune: exactly the newest few are kept", () => `${valid.length} valid, ${del.size} deleted, keep ${keep}`);
    if (sorted[0]) ok(!del.has(sorted[0].id), "prune: the newest restore point is never deleted", () => sorted[0].id);
    ok([...del].every((id) => valid.some((p) => p.id === id)), "prune: only real restore points are deleted", () => JSON.stringify([...del]));
    for (const id of del) { const p = valid.find((x) => x.id === id); const keptNewer = sorted.slice(0, keep).every((k) => String(k.at) >= String(p.at)); ok(keptNewer, "prune: everything deleted is older than everything kept", () => id); }
  },
  due() {
    const ps = chance(0.2) ? [] : Array.from({ length: int(1, 5) }, (_, i) => mkPoint(i)); const now = new Date(NOW);
    const r = noThrow("due: never throws", () => rp.dueForRestorePoint(ps, now)); if (r.threw) return;
    const newest = rp.sortedPoints(ps)[0];
    if (!newest) ok(r.v === true, "due: a restore point is due when there are none", () => JSON.stringify(ps));
    else if (Number.isFinite(Date.parse(newest.at))) { const age = (NOW - Date.parse(newest.at)) / 3600000; ok(r.v === (age >= rp.MIN_GAP_HOURS), "due: due exactly when the newest is 20 hours old", () => `age ${age}h -> ${r.v}`); }
  },
  complete() {
    const ps = chance(0.3) ? [] : [mkPoint(1)]; const had = ps[0] ? ps[0].counts.patients : 0;
    const counts = { patients: int(0, 600), appointments: int(0, 50), invoices: int(0, 50) };
    const r = noThrow("complete: never throws", () => rp.looksComplete(counts, ps)); if (r.threw) return;
    const tot = counts.patients + counts.appointments + counts.invoices;
    if (tot === 0) ok(r.v === false, "complete: an empty clinic is never saved as a restore point", () => JSON.stringify(counts));
    else if (ps[0] && ps[0].at && ps[0].id) ok(r.v === (counts.patients >= Math.floor(had * 0.8)), "complete: a clinic that lost over 20% of patients is not saved", () => `${counts.patients} vs ${had}`);
    noThrow("complete: junk counts never throw", () => rp.looksComplete(pick([null, undefined, "x", { patients: "a" }, [], 5]), pick([null, undefined, "x", [null], [{}]])));
  },
  checkStore() {
    const mode = pick(MODES); const store = makeStore(mode);
    const l = noThrow(`storage check: reading never throws (${mode} storage)`, () => sc.loadCheck(store)); if (!l.threw) ok(l.v === null || (Number.isFinite(l.v.mib) && l.v.mib >= 0 && Number.isFinite(l.v.at)), "storage check: what is read back is empty or a valid reading", () => JSON.stringify(l.v));
    const mib = pick([0, 1, 512, 700, 1024 * 1024, 1024 * 1024 + 1, -1, NaN, Infinity, "12", "abc", null, undefined, {}, int(0, 2000)]);
    const w = noThrow(`storage check: saving never throws (${mode} storage)`, () => sc.saveCheck(mib, NOW, store)); if (w.threw) return;
    const valid = Number.isFinite(Number(mib)) && Number(mib) >= 0 && Number(mib) <= 1024 * 1024 && mib !== null && mib !== "" ;
    if (mib !== null && mib !== undefined && !Array.isArray(mib)) ok(valid ? w.v && w.v.mib === Number(mib) : w.v === null, "storage check: only sensible numbers are accepted", () => `${String(mib)} -> ${JSON.stringify(w.v)}`);
    if (mode === "works" && w.v) { const back = sc.loadCheck(store); ok(back && back.mib === w.v.mib && back.at === NOW, "storage check: a saved reading is read back unchanged", () => JSON.stringify(back)); }
  },
  checkStatus() {
    const a = int(0, 1500), b = a + int(0, 600), t = NOW - int(0, 90) * DAY;
    const x = sc.checkStatus({ mib: a, at: t }, NOW), y = sc.checkStatus({ mib: b, at: t }, NOW);
    ok(y.percent >= x.percent, "storage check: more storage used never shows a lower percent", () => `${a} vs ${b}`);
    ok((x.percent >= sc.WARN_PERCENT) === (x.level === "warn"), "storage check: warns exactly from 70%", () => JSON.stringify(x));
    ok(x.daysAgo >= 0 && Number.isInteger(x.daysAgo), "storage check: days ago is a whole number, never negative", () => JSON.stringify(x));
    noThrow("storage check: status never throws on junk", () => sc.checkStatus(pick([null, undefined, {}, { mib: "a" }, { mib: 5, at: "x" }]), NOW));
  },
  backupNote() {
    const mode = pick(MODES); const store = makeStore(mode); const id = pick(["", "C1", "ക്ലിനിക്", text(5)]);
    const r = noThrow(`backup note: reading never throws (${mode} storage)`, () => rel.readLastBackup(id, store)); if (!r.threw) ok(typeof r.v === "string", "backup note: reading always gives text", () => String(r.v));
    const w = noThrow(`backup note: saving never throws (${mode} storage)`, () => rel.markBackupDone(id, new Date(NOW), store));
    if (!w.threw && mode === "works") ok(w.v === true && rel.readLastBackup(id, store) === new Date(NOW).toISOString(), "backup note: a saved time is read back unchanged", () => String(w.v));
    if (!w.threw && (mode === "quota" || mode === "blocked")) ok(w.v === false, "backup note: a failed save says so", () => String(w.v));
    const age = rel.backupAgeDays(pick(["", "bad", null, undefined, new Date(NOW - int(0, 60) * DAY).toISOString(), new Date(NOW + 5 * DAY).toISOString()]), new Date(NOW));
    ok(age === null || (Number.isInteger(age) && age >= 0), "backup note: age is empty or a whole number of days, never negative", () => String(age));
    const iso = new Date(NOW - int(0, 20) * DAY).toISOString(); const n = rel.backupNotification(iso, new Date(NOW), { hasData: true });
    ok((n === null) === (rel.backupAgeDays(iso, new Date(NOW)) < rel.BACKUP_REMIND_DAYS), "backup note: reminder appears exactly after 7 days", () => iso);
    ok(rel.backupNotification(iso, new Date(NOW), { hasData: false }) === null, "backup note: no reminder for an empty clinic", () => iso);
  },
  usage() {
    const len = int(0, 5000000), more = len + int(0, 100000);
    const a = su.dataUrlBytes("x".repeat(Math.min(len, 20000))), b = su.dataUrlBytes("x".repeat(Math.min(len, 20000) + int(0, 500)));
    ok(Number.isInteger(a) && a >= 0 && b >= a, "usage: picture size is a whole number and grows with the text", () => `${a} ${b}`);
    ok(su.dataUrlBytes(pick([null, undefined, 5, {}, [], ""])) === 0, "usage: a missing picture counts as zero", () => "");
    const pa = su.usageLevel(len * 300), pb = su.usageLevel(more * 300); const rank = { ok: 0, watch: 1, full: 2 };
    ok(rank[pb] >= rank[pa], "usage: the warning level never gets lower as use grows", () => `${len} ${more}`);
    const patients = Array.from({ length: int(0, 8) }, () => pick([null, undefined, 5, "x", {}, { opgImage: "x".repeat(int(0, 900)) }, { hasOpg: true, opgBytes: int(-10, 5000) }, { hasOpg: true, opgBytes: "z" }]));
    const o = noThrow("usage: counting pictures never throws on junk", () => su.opgUsage(patients)); if (!o.threw) ok(o.v.count <= patients.length && o.v.bytes >= 0 && Number.isFinite(o.v.bytes), "usage: picture count and bytes are sane", () => JSON.stringify(o.v));
    ok(su.galleryUpperBytes(pick([-5, "x", null, undefined, NaN, int(0, 99)])) >= 0, "usage: gallery size is never negative", () => "");
    const f = su.formatBytes(pick([0, 1, 1023, 1024, 1048576, 5e8, 1073741824, 2.5e12, int(0, 9e9)]));
    ok(typeof f === "string" && /^\d/.test(f) && !/NaN|Infinity/.test(f), "usage: sizes are shown as readable text", () => f);
  },
  merge() {
    const mk = () => ({ id: "C1", name: text(3), patients: Array.from({ length: int(0, 4) }, (_, i) => ({ id: `P${i}`, name: text(2), age: int(1, 90) })), settings: { a: int(0, 3), b: text(2) } });
    const base = mk(), local = chance(0.3) ? base : { ...mk(), id: "C1" }, remote = chance(0.3) ? base : { ...mk(), id: "C1" };
    const r = noThrow("merge: never throws", () => mergeDoc(chance(0.2) ? undefined : base, local, remote)); if (r.threw) return;
    ok(r.v && r.v.id === "C1", "merge: the device's id is always kept", () => JSON.stringify(r.v).slice(0, 100));
    const same = noThrow("merge: never throws on identical copies", () => mergeDoc(base, local, local)); if (!same.threw) ok(JSON.stringify(same.v) === JSON.stringify(local) || JSON.stringify(Object.keys(same.v).sort()) === JSON.stringify(Object.keys(local).sort()), "merge: merging two identical copies changes nothing", () => JSON.stringify(same.v).slice(0, 150));
    const idem = mergeDoc(base, r.v, r.v); ok(JSON.stringify(idem) === JSON.stringify(r.v), "merge: merging the result with itself changes nothing", () => "");
    const onlyCloud = mergeDoc(base, base, remote); ok(JSON.stringify(onlyCloud) === JSON.stringify({ ...remote, id: base.id }), "merge: when only the cloud changed, the cloud copy is kept", () => "");
    const onlyDevice = mergeDoc(base, local, base); ok(JSON.stringify(onlyDevice) === JSON.stringify(local), "merge: when only this device changed, this device's copy is kept", () => "");
    const noBase = mergeDoc(undefined, local, remote); ok(remote.patients.every((p) => noBase.patients && noBase.patients.some((q) => q.id === p.id)), "merge: with no base, nothing the cloud has is deleted", () => "");
    noThrow("merge: junk never throws", () => mergeDoc(pick([null, undefined, 5, "x", [], {}]), pick([null, undefined, 5, "x", [], {}, local]), pick([null, undefined, 5, "x", [], {}, remote])));
  },
};

const names = Object.keys(cases); const t0 = Date.now();
for (let i = 0; i < N; i++) { const n = pick(names); try { cases[n](); } catch (e) { ok(false, `${n}: the test itself crashed`, e && e.stack); } }
const failing = Object.values(fails).reduce((a, f) => a + f.n, 0);
console.log(JSON.stringify({ seed: SEED, cases: N, checks: Object.values(total).reduce((a, b) => a + b, 0), failures: failing, distinct: fails, seconds: Math.round((Date.now() - t0) / 1000) }, null, 2));
process.exit(failing ? 1 : 0);
