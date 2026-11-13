/* Stress test #2: 1,000,000 random cases on everything that reads data from outside the app:
 * backup files, spreadsheet imports, the public booking form, the early-access form, sign-in errors, search and page paths.
 * Seeded, so a failure replays exactly. Run time is a few minutes, so it only runs when FUZZ=1 is set. */
import { describe, it, expect } from "vitest";
import { buildBackup, parseBackupText, validateBackup, mergeBackup, parseCsv, patientsFromCsv, patientsCsv, mapHeaders } from "../src/portability.js";
import { validateBookingRequest, buildBookingDoc, requestToAppointment } from "../src/booking.js";
import { csvCell, toCsv } from "../src/reports.js";
import { validateEarlyAccess, earlyAccessMessage, earlyAccessLink, cleanPhone } from "../src/earlyAccess.js";
import { friendlyAuthError, isValidEmailAddress } from "../src/authErrors.js";
import { globalSearch } from "../src/search.js";
import { seoPageForPath } from "../src/seoPages.js";

const RUN = process.env.FUZZ === "1";
const N = RUN ? 1000000 : 6000; // by default a small smoke run, so the normal test suite stays fast
const per = Math.floor(N / 6);

const mulberry = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const mk = (seed) => {
  const r = mulberry(seed);
  const int = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  const pick = (a) => a[int(0, a.length - 1)];
  const chars = ["a", "B", "7", " ", "-", "+", "=", "@", ".", ",", ";", "\t", "\n", "\r", '"', "'", "<", ">", "&", "/", "\\", "ஆ", "ह", "😀", "\u0000", "‮", "é"];
  const str = (max = 14) => Array.from({ length: int(0, max) }, () => pick(chars)).join("");
  const junk = () => pick([null, undefined, NaN, Infinity, -1, 0, 1, 1e15, "", "abc", true, false, [], {}, [1, "x"], { a: 1 }, "__proto__", str()]);
  const phone = () => pick(["9876543210", "+91 98765 43210", "09876543210", "5876543210", "123", String(int(6000000000, 9999999999)), str(11)]);
  const date = () => pick(["2026-11-13", "2027-01-05", "2020-01-01", "2026-13-45", "13/11/2026", str(10), junk()]);
  return { r, int, pick, str, junk, phone, date };
};
const safeKeys = () => expect({}.polluted).toBeUndefined();

describe(`fuzz: ${N.toLocaleString("en-IN")} random cases on outside data`, () => {
  it("backup files: parse, check, merge never crash and never pollute", () => {
    const { int, pick, str, junk, phone } = mk(101);
    const base = (n) => buildBackup({ patients: Array.from({ length: n }, (_, i) => ({ id: `P${i}`, name: `Pat ${i}`, phone: phone() })), appointments: [], invoices: [], inventory: [], employees: [], profile: {} });
    for (let i = 0; i < per; i += 1) {
      let text;
      const k = int(0, 5);
      if (k === 0) text = str(60);
      else if (k === 1) text = JSON.stringify(junk());
      else {
        const b = JSON.parse(JSON.stringify(base(int(0, 3))));
        const target = pick([b, b.data, b.data.patients, b.data.patients[0] || b, b.profile || b]);
        if (target && typeof target === "object") {
          const key = pick(["format", "version", "data", "patients", "id", "name", "branchId", "__proto__", "constructor", "appointments", "polluted", str(5)]);
          if (r_() < 0.5) delete target[key]; else target[key] = pick([junk(), { polluted: 1 }, [{ id: "../x" }], [null], "x"]);
        }
        text = k === 2 ? JSON.stringify(b) : JSON.stringify(b).replace(/"__proto__"/g, '"__proto__"').slice(0, int(10, 4000));
        if (k === 5) text = text.replace('"patients"', '"__proto__"');
      }
      const p = parseBackupText(text);
      expect(typeof p.ok).toBe("boolean");
      if (p.ok && !p.encrypted) {
        const v = validateBackup(p.backup);
        expect(typeof v.ok).toBe("boolean");
        if (v.ok) {
          const m = mergeBackup({ patients: [{ id: "P0", name: "x" }], profile: {} }, p.backup, { includeStaff: int(0, 1) === 1 });
          expect(Array.isArray(m.merged.patients)).toBe(true);
          expect(m.merged.patients.every((x) => x && typeof x.id === "string")).toBe(true);
        }
      }
      safeKeys();
    }
    function r_() { return int(0, 99) / 100; }
  });

  it("spreadsheet import: odd CSV never crashes and gives clean patients", () => {
    const { int, pick, str, phone } = mk(202);
    for (let i = 0; i < per; i += 1) {
      const head = pick(["Name,Phone,Age,Gender", "name;mobile;age", "Patient Name\tContact", str(20), "Name,Name,Phone", ""]);
      const rows = Array.from({ length: int(0, 5) }, () => [str(12), phone(), pick(["34", "abc", "999", "", "-5"]), pick(["M", "female", "x", ""])].map((c) => (int(0, 4) === 0 ? `"${c.replace(/"/g, '""')}"` : c)).join(pick([",", ";", "\t"])));
      const text = [head, ...rows].join(pick(["\n", "\r\n", "\r"]));
      const grid = parseCsv(text);
      expect(Array.isArray(grid)).toBe(true);
      grid.forEach((row) => row.forEach((c) => expect(typeof c).toBe("string")));
      expect(typeof mapHeaders(grid[0] || [])).toBe("object");
      let n = 0;
      const res = patientsFromCsv(text, [{ name: "Existing", phone: "9876543210" }], () => `P${(n += 1)}`);
      expect(typeof res.ok).toBe("boolean");
      if (res.ok) {
        const ids = new Set();
        res.patients.forEach((p) => {
          expect(p.name.trim().length).toBeGreaterThan(0);
          expect(p.name.length).toBeLessThanOrEqual(80);
          expect(p.phone === "" || /^\d{10}$/.test(p.phone)).toBe(true);
          expect(ids.has(p.id)).toBe(false); ids.add(p.id);
        });
      }
    }
  });

  it("spreadsheet export cannot carry a formula (CSV injection)", () => {
    const { int, pick, str } = mk(303);
    for (let i = 0; i < per; i += 1) {
      const cell = pick(["=", "+", "-", "@", "\t", "\r", ""]) + str(10);
      const out = csvCell(cell);
      const inner = out.startsWith('"') && out.endsWith('"') ? out.slice(1, -1).replace(/""/g, '"') : out;
      expect(/^[=+\-@\t\r]/.test(inner), JSON.stringify(cell)).toBe(false);
      const csv = toCsv([[cell, str(5)], [int(0, 9), null, undefined]]);
      expect(csv.endsWith("\r\n")).toBe(true);
      const exported = patientsCsv([{ name: cell, phone: str(10), toothConditions: pick([{}, null, undefined]) }]);
      expect(typeof exported).toBe("string");
    }
  });

  it("public booking form: only clean requests get through", () => {
    const { int, pick, str, junk, phone, date } = mk(404);
    for (let i = 0; i < per; i += 1) {
      const form = pick([undefined, null, {}, { name: pick(["Asha", str(100), junk()]), phone: phone(), date: date(), slot: pick(["Morning", "Evening", "Night", junk()]), service: pick(["Filling", str(), junk()]), note: str(500) }]);
      const v = validateBookingRequest(form || undefined, new Date(2026, 10, 13));
      expect(typeof v.ok).toBe("boolean");
      if (v.ok) {
        const q = v.request;
        expect(q.name.length).toBeGreaterThan(0); expect(q.name.length).toBeLessThanOrEqual(80);
        expect(/^[6-9]\d{9}$/.test(q.phone)).toBe(true);
        expect(["Morning", "Afternoon", "Evening"]).toContain(q.slot);
        expect(q.note.length).toBeLessThanOrEqual(300);
        const doc = buildBookingDoc(q, "clinic1", new Date(2026, 10, 13));
        expect(doc.status).toBe("new");
        const out = requestToAppointment(q, { newId: (p) => `${p}${int(1, 99)}`, doctor: "Dr", chair: "1", patients: [{ id: "P1", phone: phone() }] });
        expect(out.appointment.phone).toBe(q.phone);
      }
    }
  });

  it("early-access form, sign-in errors and phone/email checks never crash (2 groups)", () => {
    const { int, pick, str, junk, phone } = mk(505);
    for (let i = 0; i < per; i += 1) {
      const f = pick([undefined, {}, { name: pick(["Dr A", str(50), junk()]), clinic: str(40), phone: phone(), city: str(20), size: pick(["1 chair", str(), junk()]), note: str(300) }]);
      const v = validateEarlyAccess(f);
      expect(v === null || v === undefined || typeof v === "string" || typeof v === "object").toBe(true);
      expect(typeof earlyAccessMessage(f)).toBe("string");
      expect(earlyAccessLink(f).startsWith("https://wa.me/919043205927?text=")).toBe(true);
      expect(typeof cleanPhone(pick([phone(), junk()]))).toBe("string");
      expect(typeof isValidEmailAddress(pick([str(30), "a@b.co", junk()]))).toBe("boolean");
      expect(typeof friendlyAuthError(pick([undefined, null, {}, { code: pick(["auth/wrong-password", "auth/x", str(10), junk()]), message: junk() }, str(10)]))).toBe("string");
    }
  });

  it("search and page paths never crash", () => {
    const { int, pick, str, junk, phone } = mk(606);
    for (let i = 0; i < per; i += 1) {
      const data = { patients: Array.from({ length: int(0, 4) }, () => pick([null, 5, { id: str(3), name: pick([str(), junk()]), phone: pick([phone(), junk()]) }])), appointments: pick([[], [null, { patientName: str(), date: str(8) }]]), invoices: pick([[], [{ id: str(5), patient: str() }, null]]) };
      const res = globalSearch(data, pick([str(10), "", "9876", junk()]), pick([1, 5, 50]));
      expect(res).toBeTruthy();
      const p = seoPageForPath(pick(["/", "/login", "/" + str(20), "/free-early-access", "//", "/dental-software-india/", "/../etc/passwd", str(30)]));
      expect(p === null || p === undefined || typeof p === "object").toBe(true);
    }
  });
});
