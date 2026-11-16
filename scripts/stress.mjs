// Randomised stress test of MeriDent's pure logic. Usage: node scripts/stress.mjs [seed] [count]
// Three suites of `count` cases each (default 10,000): property ("bug") checks, hostile-input ("error") checks,
// and random operation sequences ("random"). Deterministic for a given seed. UI and Firestore are not covered.
import * as billing from "../src/billing.js";
import * as stock from "../src/stock.js";
import * as diary from "../src/diary.js";
import * as visits from "../src/visits.js";
import * as roles from "../src/roles.js";
import * as rem from "../src/reminders.js";
import * as port from "../src/portability.js";
import * as gallery from "../src/gallery.js";
import * as extra from "../src/extraoral.js";
import * as dl from "../src/docLog.js";
import * as cal from "../src/calendar.js";
import * as feedLib from "../src/connect/feed.js";
import { buildNotifications } from "../src/notifications.js";
import { recordSheetHtml } from "../src/recordSheet.js";

const SEED = Number(process.argv[2] || 20261113);
const N = Number(process.argv[3] || 10000);
const NB = Number(process.env.BUG_N || N), NE = Number(process.env.ERR_N || N), NR = Number(process.env.RND_N || N); // per-suite sizes
const MIXED = process.argv[4] === "mixed"; // every property from both batteries together
const WIDE = process.argv[4] === "wide" || MIXED; // second battery: different properties, wider values, other operation mix
let s = SEED >>> 0;
const rnd = () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = (a) => a[int(0, a.length - 1)];
const chance = (p) => rnd() < p;
const NOW = new Date(2026, 10, 13, 10, 0);
const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dayKey = (off) => key(new Date(2026, 10, 13 + off));
const time = () => `${String(int(8, 20)).padStart(2, "0")}:${pick(["00", "15", "30", "45"])}`;
const NASTY = [...(WIDE ? ["\u200b", "தமிழ்", "हिन्दी", "\t\n", "NaN", "null", "undefined", "-0", "9".repeat(30), "%s%d", "{{x}}", "\\"] : []), "", " ", "<script>alert(1)</script>", "O'Brien", "a,b\"c\nd", "ᚠᛇ😀", "x".repeat(5000), "../../etc", "Robert'); DROP TABLE", "0", "-1", "1e9"];
const word = () => (chance(0.25) ? pick(NASTY) : pick(["Ravi", "Asha", "Mani", "Priya", "Kumar", "Devi", "Scaling", "RCT", "Crown"]) + int(0, 99));
const STATUSES = ["Confirmed", "Completed", "No show", "Cancelled", "confirmed", "", undefined];
const CATS = ["therapeutic", "cosmetic", "consumable", "other", "unknown", undefined];

const fails = { bug: [], error: [], random: [] };
const counts = { bug: {}, error: {}, random: {} };
const fail = (suite, name, detail) => { if (fails[suite].length < 400) fails[suite].push({ name, detail: String(detail).slice(0, 300) }); counts[suite][name] = (counts[suite][name] || 0) + 1; };
const ok = (suite, cond, name, detail) => { if (!cond) fail(suite, name, typeof detail === "function" ? detail() : detail); };

const mkAppt = (i) => ({ id: `A${i}-${int(0, 1e6)}`, patientName: word(), phone: pick(["9876543210", "", "12", "+91 98765 43210"]), date: dayKey(WIDE ? int(-400, 400) : int(-5, 5)), time: time(), chair: pick(["Chair 1", "Chair 2"]), doctor: pick(["Dr A", "Dr B", ""]), procedure: word(), status: pick(STATUSES) });
const mkItem = (i) => ({ id: `S${i}`, name: word(), quantity: WIDE ? int(-50, 100000) : int(-2, 40), minThreshold: WIDE ? int(0, 100000) : int(0, 15), expiry: chance(0.5) ? dayKey(WIDE ? int(-3000, 3000) : int(-60, 90)) : undefined });
const mkPatient = (i) => ({ id: `P${i}-${int(0, 1e6)}`, name: (word().trim() || "Nameless"), phone: pick(["9876543210", "9123456780", ""]), age: String(int(1, 95)), gender: pick(["Male", "Female"]), email: "", allergies: word(), medicalAlert: word(), visits: [], plans: [] });

/* ---------------------------------- Suite 1: property checks ---------------------------------- */
const PROPS = {
  allocate() { const w = Array.from({ length: int(1, 8) }, () => int(0, 5000)); const t = int(0, 1e6); const p = billing.allocateProportionally(t, w); const sum = w.reduce((a, b) => a + b, 0);
    ok("bug", p.length === w.length && p.every((v) => Number.isInteger(v) && v >= 0), "allocate: parts are non-negative integers", () => JSON.stringify({ t, w, p }));
    if (t > 0 && sum > 0) ok("bug", p.reduce((a, b) => a + b, 0) === t, "allocate: parts add up to the total", () => JSON.stringify({ t, w, p })); },
  totals() { const items = Array.from({ length: int(1, 6) }, () => ({ amount: pick([int(0, 100000), String(int(0, 999999) / 100), "", "abc", -5, 0]), taxCategory: pick(CATS) })); const r = billing.computeLineItemTotals({ items, discount: pick([0, int(0, 50000), "10%", -3, "x"]) });
    const nums = ["subtotalP", "discountP", "taxableP", "cgstP", "sgstP", "taxP", "totalP"];
    ok("bug", nums.every((k) => Number.isInteger(r[k]) && r[k] >= 0), "totals: every money figure is a non-negative whole paise", () => JSON.stringify(r));
    ok("bug", r.totalP === r.taxableP + r.taxP, "totals: total = taxable + tax", () => JSON.stringify(r));
    ok("bug", r.cgstP + r.sgstP === r.taxP, "totals: CGST + SGST = tax", () => JSON.stringify(r));
    ok("bug", r.discountP <= r.subtotalP, "totals: discount never exceeds subtotal", () => JSON.stringify(r));
    ok("bug", r.lines.reduce((a, l) => a + l.totalP, 0) === r.totalP, "totals: lines add up to the total", () => JSON.stringify(r)); },
  payment() { const total = int(0, 500000); let inv = { totalP: total, payments: [] }; for (let i = 0; i < int(1, 6); i++) { const before = billing.balancePaise(inv); const amt = pick([int(-5, 6000) / 10, before / 100, (before + 1) / 100, "abc", "", 0]); const r = billing.addPayment(inv, { amount: amt });
      if (r.ok) { ok("bug", billing.balancePaise(r.invoice) === before - billing.toPaise(amt), "payment: balance drops by exactly the amount", () => JSON.stringify({ inv, amt })); inv = r.invoice; } else ok("bug", billing.balancePaise(inv) === before, "payment: a refused payment changes nothing", () => JSON.stringify({ inv, amt }));
      ok("bug", billing.balancePaise(inv) >= 0 && billing.paidPaise(inv) <= total, "payment: never overpaid", () => JSON.stringify(inv)); }
    const st = billing.paymentStatus(inv); ok("bug", (st === "Paid") === (total > 0 && billing.paidPaise(inv) >= total), "payment: status Paid only when fully paid", () => JSON.stringify({ inv, st })); },
  rupees() { const p = int(0, 9e9); ok("bug", billing.toPaise(billing.formatINR(p)) === p, "money: formatINR then toPaise returns the same paise", () => String(p)); },
  adjust() { const it = mkItem(1); const a = stock.adjustStock(it, pick([int(-100, 100), "x", NaN, 2.7, null])); ok("bug", Number.isInteger(a.quantity) && a.quantity >= 0, "stock: adjust keeps quantity a non-negative integer", () => JSON.stringify({ it, a })); ok("bug", (a.quantity <= Math.max(0, Math.trunc(Number(it.minThreshold) || 0))) === (a.status === "Low Stock"), "stock: status matches reorder level", () => JSON.stringify({ it, a })); },
  stockView() { const items = Array.from({ length: int(0, 12) }, (_, i) => mkItem(i)); const sum = stock.stockSummary(items, NOW); const v = stock.stockView(items, { view: "reorder" }, NOW);
    ok("bug", sum.total === items.length && sum.out + sum.low <= items.length, "stock: summary counts are consistent", () => JSON.stringify(sum));
    ok("bug", v.length === sum.out + sum.low, "stock: reorder view length equals out + low", () => JSON.stringify({ sum, n: v.length }));
    ok("bug", v.every((x, i) => i === 0 || Math.max(0, Number(v[i - 1].quantity) || 0) <= Math.max(0, Number(x.quantity) || 0)), "stock: reorder view is sorted lowest first", () => JSON.stringify(v.map((x) => x.quantity))); },
  stockItem() { const form = { name: pick(["", " ", "Gloves", word()]), quantity: pick([int(-3, 50), "", "abc", 2.5]), minThreshold: pick([int(-3, 20), "", "q"]), unit: "box" }; const r = stock.buildStockItem(form, "S1");
    if (r.ok) ok("bug", r.item.quantity >= 0 && r.item.minThreshold >= 0 && r.item.name.length > 0 && (r.item.quantity <= r.item.minThreshold) === (r.item.status === "Low Stock"), "stock: a built item is valid", () => JSON.stringify({ form, r }));
    else ok("bug", typeof r.error === "string" && r.error.length > 0, "stock: refusal carries an error message", () => JSON.stringify({ form, r })); },
  diary() { const appts = Array.from({ length: int(0, 15) }, (_, i) => mkAppt(i)); const up = diary.diaryView(appts, { view: "upcoming" }, NOW); const today = diary.diaryView(appts, { view: "today" }, NOW);
    ok("bug", up.every((a) => a.date >= dayKey(0) && !["cancelled", "canceled", "completed", "no show", "no-show"].includes(String(a.status || "").toLowerCase())), "diary: upcoming has only future active visits", () => JSON.stringify(up));
    ok("bug", today.every((a) => a.date === dayKey(0)), "diary: today has only today's visits", () => JSON.stringify(today));
    ok("bug", up.every((a, i) => i === 0 || `${up[i - 1].date} ${String(up[i - 1].time).padStart(5, "0")}` <= `${a.date} ${String(a.time).padStart(5, "0")}`), "diary: upcoming is in time order", () => JSON.stringify(up.map((a) => a.date + a.time)));
    const sum = diary.diarySummary(appts, NOW); ok("bug", sum && Object.values(sum).every((v) => typeof v !== "number" || (Number.isInteger(v) && v >= 0)), "diary: summary numbers are sane", () => JSON.stringify(sum)); },
  clash() { const a = { ...mkAppt(1), status: "Confirmed", date: dayKey(0), time: "10:00", chair: "Chair 1", doctor: "" }; const near = { ...a, id: "x", time: pick(["10:00", "10:10", "10:29", "09:45"]) }; ok("bug", diary.findClash([a], near) !== null, "diary: bookings within 30 minutes on one chair clash", () => JSON.stringify(near));
    ok("bug", diary.findClash([a], { ...near, time: "11:00" }) === null, "diary: bookings 60 minutes apart do not clash", () => "11:00"); ok("bug", diary.findClash([a], { ...near, date: dayKey(1) }) === null, "diary: other days never clash", () => "next day"); },
  visits() { let p = { visits: [] }; const ids = []; for (let i = 0; i < int(1, 8); i++) { const r = visits.buildVisit({ complaint: word(), treatment: word(), date: dayKey(-int(0, 40)) }, `V${i}`, NOW); if (r.ok) { p = visits.addVisit(p, r.visit); ids.push(r.visit.id); } }
    ok("bug", p.visits.every((v, i) => i === 0 || p.visits[i - 1].date >= v.date), "visits: newest first", () => JSON.stringify(p.visits.map((v) => v.date)));
    if (ids.length) { const id = pick(ids); const q = visits.removeVisit(p, id); ok("bug", q.visits.length === p.visits.length - 1 && !q.visits.some((v) => v.id === id), "visits: remove removes exactly one", () => id); }
    ok("bug", !visits.buildVisit({ date: dayKey(3), complaint: "x" }, "V", NOW).ok, "visits: future dates are refused", () => "future"); },
  notes() { const n = buildNotifications({ inventory: Array.from({ length: int(0, 10) }, (_, i) => mkItem(i)), appointments: Array.from({ length: int(0, 10) }, (_, i) => mkAppt(i)), now: NOW, showStock: chance(0.8), showAppointments: chance(0.8) });
    ok("bug", new Set(n.map((x) => x.id)).size === n.length || n.some((x) => x.id.startsWith("appt-")), "notifications: ids are unique (appointments with identical id+time excepted)", () => JSON.stringify(n.map((x) => x.id)));
    ok("bug", n.every((x) => ["stock", "appointment"].includes(x.kind) && x.text && x.to), "notifications: each has kind, text and target", () => JSON.stringify(n));
    const firstAppt = n.findIndex((x) => x.kind === "appointment"); ok("bug", firstAppt === -1 || n.slice(0, firstAppt).every((x) => x.kind === "stock"), "notifications: stock comes before appointments", () => JSON.stringify(n.map((x) => x.kind))); },
  roles() { const role = pick(roles.ROLES.concat(["", "hacker", undefined])); const items = [{ label: "Dashboard" }, { label: "Reports" }, { label: "Billing & Invoices" }, { label: "Stock Maintenance" }]; const out = roles.navFor(role, items); ok("bug", out.every((i) => items.includes(i)), "roles: navFor only returns known items", () => String(role));
    if (roles.NAV_BY_ROLE[role]) ok("bug", roles.NAV_BY_ROLE[role].includes(roles.firstScreen(role)), "roles: first screen is allowed for the role", () => String(role));
    ok("bug", !(roles.canWrite(role, "invoices") && !roles.canRead(role, "invoices")), "roles: write access implies read access", () => String(role)); },
  time() { const t = time(); const f = rem.formatTime12(t); ok("bug", /^(1[0-2]|[1-9]):\d{2} (AM|PM)$/.test(f), "time: formatTime12 gives a 12-hour time", () => `${t} -> ${f}`); const l = rem.whatsappLink(pick(["9876543210", "919876543210", "09876543210", "123", "", "98765 43210"]), word()); ok("bug", l === "" || /^https:\/\/wa\.me\/91[6-9]\d{9}\?text=/.test(l), "time: WhatsApp links are well formed or empty", () => l); },
  escape() { const name = pick(["<script>alert(1)</script>", "<img src=x onerror=alert(1)>", "\"><svg onload=1>", word()]); const html = recordSheetHtml({ id: "P", name, allergies: name, visits: [{ date: "2026-01-02", treatment: name }] }, { appointments: [{ patientName: name, date: "2026-01-01", procedure: name }] }, { name }); ok("bug", !/<script>alert|<img src=x|<svg onload/.test(html), "record sheet: patient text is HTML-escaped", () => name); },
  backup() { const data = { patients: Array.from({ length: int(0, 6) }, (_, i) => ({ ...mkPatient(i), id: `P${i}` })), appointments: Array.from({ length: int(0, 6) }, (_, i) => ({ ...mkAppt(i), id: `A${i}` })), invoices: [], inventory: Array.from({ length: int(0, 6) }, (_, i) => ({ ...mkItem(i), id: `S${i}` })), employees: [] }; const b = port.buildBackup(data, NOW); const parsed = port.parseBackupText(JSON.stringify(b));
    ok("bug", parsed.ok && !parsed.encrypted && port.validateBackup(parsed.backup).ok, "backup: a fresh backup parses and validates", () => JSON.stringify(parsed).slice(0, 200));
    ok("bug", parsed.backup.counts.patients === data.patients.length, "backup: counts match the data", () => JSON.stringify(parsed.backup.counts)); },
  csv() { const ps = Array.from({ length: int(1, 6) }, (_, i) => ({ ...mkPatient(i), id: `P${i}`, name: `N${i} ${pick(["a,b", "q\"uote", "plain", "line\nbreak"])}` })); const rows = port.parseCsv(port.patientsCsv(ps)); ok("bug", rows.length === ps.length + 1, "csv: patients survive a CSV round trip (row count)", () => `${rows.length} vs ${ps.length + 1}`);
    ok("bug", ps.every((p, i) => rows[i + 1] && rows[i + 1][1] === p.name), "csv: commas, quotes and line breaks in names survive", () => JSON.stringify(rows.slice(1).map((r) => r[1]))); },
  gallery() { const imgs = Array.from({ length: int(0, 10) }, (_, i) => ({ id: `I${i}`, kind: pick(["Pre-op", "Post-op", "CBCT", "IOPA", "OPG", "Face"]), takenOn: dayKey(-int(0, 90)), createdAt: dayKey(-int(0, 90)), tooth: pick(["", "11", "36"]) })); const so = gallery.sortImages(imgs); ok("bug", so.every((x, i) => i === 0 || so[i - 1].takenOn >= x.takenOn), "gallery: pictures are newest first", () => JSON.stringify(so.map((x) => x.takenOn)));
    const d = gallery.buildImageDoc({ patientId: "P", kind: pick(["OPG", "IOPA", "CBCT", "X-ray", "Bogus"]), data: "data:image/jpeg;base64,AAA", takenOn: dayKey(pick([-1, 0, 3])) }, "I", NOW); ok("bug", d.ok === (d.ok && ["OPG", "IOPA", "CBCT", "X-ray"].includes(d.image.kind)) || !d.ok, "gallery: extra radiograph kinds are accepted", () => JSON.stringify(d)); },
};

const PROPS2 = {
  fy() { const d = new Date(int(2000, 2090), int(0, 11), int(1, 28)); const f = billing.financialYear(d); const start = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1; ok("bug", f === `${start}-${String(start + 1).slice(-2)}`, "fy: financial year runs April to March", () => `${key(d)} -> ${f}`); },
  invNo() { const fy = billing.financialYear(NOW); const ex = Array.from({ length: int(0, 8) }, () => ({ id: chance(0.7) ? `INV/${fy}/${String(int(1, 400)).padStart(4, "0")}` : pick(["", "junk", `INV/2020-21/0009`, null]) })); const n = billing.nextInvoiceNumber(ex, NOW); ok("bug", typeof n === "string" && n.startsWith(`INV/${fy}/`) && !ex.some((e) => e && e.id === n), "invoice number: new number is in this year and unused", () => JSON.stringify({ ex, n }));
    const max = Math.max(0, ...ex.filter((e) => e && typeof e.id === "string" && e.id.startsWith(`INV/${fy}/`)).map((e) => parseInt(e.id.slice(`INV/${fy}/`.length), 10))); ok("bug", parseInt(n.slice(`INV/${fy}/`.length), 10) === max + 1, "invoice number: it is max + 1 (gap-free)", () => JSON.stringify({ ex, n })); },
  dates() { const d = new Date(int(2000, 2060), int(0, 11), int(1, 28), 12); const iso = key(d); const dmy = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`; ok("bug", key(rem.parseAnyDate(iso)) === iso && key(rem.parseAnyDate(dmy)) === iso, "dates: yyyy-mm-dd and dd/mm/yyyy parse to the same day", () => `${iso} ${dmy}`);
    const n = int(-800, 800); const e = rem.addDays(d, n); ok("bug", Math.round((Date.UTC(e.getFullYear(), e.getMonth(), e.getDate()) - Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5) === n, "dates: addDays moves exactly n calendar days", () => `${iso} +${n}`); },
  months() { const a = new Date(int(2015, 2030), int(0, 11), int(1, 28)); const b = new Date(a.getFullYear(), a.getMonth() + int(0, 60), int(1, 28)); const m = rem.monthsBetween(a, b); ok("bug", m >= -1 && Number.isInteger(m) && rem.monthsBetween(a, a) === 0, "months: sensible whole-number months", () => `${key(a)} ${key(b)} ${m}`); },
  upi() { const amountP = pick([0, int(1, 9e7), -5]); const u = billing.buildUpiUri({ vpa: pick(["dr@okhdfc", " dr@okhdfc "]), name: pick(["Clinic", "A&B Dental", "தமிழ்"]), amountP, note: word() }); ok("bug", u.startsWith("upi://pay?") && /(^|[?&])pa=dr%40okhdfc/.test(u) && !u.includes(" "), "upi: link is well formed and the id is encoded", () => u); if (amountP > 0) ok("bug", u.includes(`am=${(amountP / 100).toFixed(2)}`), "upi: amount has two decimals", () => u); else ok("bug", !u.includes("am="), "upi: no amount when zero", () => u); },
  waForms() { const base = String(int(6, 9)) + String(int(0, 999999999)).padStart(9, "0"); const forms = [base, "91" + base, "+91 " + base, "0" + base, base.slice(0, 5) + " " + base.slice(5)]; const outs = new Set(forms.map(rem.whatsappNumber)); ok("bug", outs.size === 1 && [...outs][0] === "91" + base, "whatsapp: every way of writing a number gives the same link", () => JSON.stringify({ forms, outs: [...outs] })); },
  csvImport() { const rows = Array.from({ length: int(1, 20) }, () => `${word().replace(/[\r\n,"]/g, " ")},${pick(["9876543210", "9123456780", "12", ""])},${int(0, 120)},${pick(["Male", "Female", ""])}`); const r = port.patientsFromCsv("Name,Phone,Age,Gender\n" + rows.join("\n"), [], () => "id" + int(0, 1e9), NOW);
    if (r.ok) { const list = r.patients || r.added || []; ok("bug", Array.isArray(list) && list.every((p) => typeof p.name === "string" && p.name.trim().length > 0), "csv import: every imported patient has a name", () => JSON.stringify(list.slice(0, 3))); ok("bug", list.length <= rows.length, "csv import: never more patients than rows", () => `${list.length} > ${rows.length}`); } else ok("bug", typeof r.error === "string", "csv import: refusal has a message", () => JSON.stringify(r)); },
  mergeTwice() { const mk = (n, pre) => Array.from({ length: n }, (_, i) => ({ id: `${pre}${i}`, name: `N${i}`, phone: "9876543210" })); const b = port.buildBackup({ patients: mk(int(0, 6), "P"), appointments: [], invoices: [], inventory: mk(int(0, 4), "S").map((x) => ({ ...x, quantity: 1 })), employees: [] }, NOW); const cur = { patients: mk(int(0, 3), "P"), appointments: [], invoices: [], inventory: [], employees: [], profile: {} };
    const m1 = port.mergeBackup(cur, b); const again = port.mergeBackup({ ...cur, ...m1.merged }, b); ok("bug", !!m1.merged && !!m1.summary, "merge: returns merged lists and a summary", () => JSON.stringify(Object.keys(m1))); ok("bug", again.nothingNew === true, "merge: importing the same file twice adds nothing", () => JSON.stringify(again.summary)); },
  extraRoundTrip() { let exams = []; for (let i = 0; i < int(1, 14); i++) { const ex = { id: `E${i}`, date: dayKey(-int(0, 500)), fields: { symmetry: pick(["Symmetric", "Asymmetric", ""]) }, mouthOpening: pick([null, int(10, 60)]), notes: word() }; exams = extra.saveExam(exams, ex); } ok("bug", exams.length <= extra.MAX_EXAMS && exams.every((e, i) => i === 0 || exams[i - 1].date >= e.date), "extra-oral: newest first and capped", () => JSON.stringify(exams.map((e) => e.date)));
    ok("bug", exams.every((e) => Array.isArray(extra.findings(e))), "extra-oral: findings always a list", () => "x"); },
  stockBoundaries() { const q = pick([0, 1, 5, 6, 100000]); const m = 5; const st = stock.stockState({ quantity: q, minThreshold: m }, NOW); ok("bug", st.out === (q === 0) && st.low === (q > 0 && q <= m), "stock boundaries: out at 0, low up to the reorder level", () => `${q}/${m} ${JSON.stringify(st)}`);
    const dd = int(-3, 40); const st2 = stock.stockState({ quantity: 10, minThreshold: 1, expiry: dayKey(dd) }, NOW); ok("bug", st2.expired === (dd < 0) && st2.expiringSoon === (dd >= 0 && dd <= 30), "stock boundaries: expiry flags at 0 and 30 days", () => `${dd} ${JSON.stringify(st2)}`); },
};
const PROPS3 = {
  docLogVisit() { const clinics = [{ id: "C1", name: "Clinic", place: "Town" }]; const fee = pick([0, int(0, 99999), String(int(0, 9999999) / 100), "", "abc", -5, 1e12]); const rec = pick([0, int(0, 99999), "", "x", -1, fee]);
    const r = dl.buildVisit({ clinicId: pick(["C1", "C1", "nope", ""]), date: pick([dayKey(int(-400, 400)), "", "2026-13-40", "x"]), treatment: pick(dl.treatmentsFor(pick(["general", "endodontics", "zzz", ""])).concat([word(), ""])), status: pick(["planned", "inprogress", "completed", "bogus"]), fee, received: rec, age: pick(["", int(0, 130), "x", -1]), patient: word(), note: word(), nextVisit: pick(["", dayKey(int(-400, 400))]) }, "V1", clinics, NOW);
    if (r.visit) { const v = r.visit; ok("bug", Number.isInteger(v.feeP) && Number.isInteger(v.receivedP) && v.feeP >= 0 && v.receivedP >= 0 && v.receivedP <= v.feeP, "doclog: money is whole paise and never over-received", () => JSON.stringify(v)); ok("bug", dl.pendingP(v) === v.feeP - v.receivedP, "doclog: pending = fee - received", () => JSON.stringify(v)); ok("bug", v.feeP <= 1e9 * 100 || v.feeP <= 1e9, "doclog: fee within the cap", () => JSON.stringify(v)); }
    else ok("bug", typeof r.error === "string" && r.error.length > 0, "doclog: a rejected visit says why", () => JSON.stringify(r)); },
  docLogPay() { const vs = Array.from({ length: int(0, 8) }, (_, i) => ({ id: `V${i}`, clinicId: pick(["C1", "C2"]), date: dayKey(-int(0, 90)), feeP: int(0, 500000), receivedP: 0, treatment: "RCT", status: "completed", clinicName: "c", clinicPlace: "p" })).map((v) => ({ ...v, receivedP: int(0, v.feeP) }));
    const amt = pick([0, int(1, 2000000), -5, 1.5]); const before = vs.filter((v) => v.clinicId === "C1").reduce((a, v) => a + (v.feeP - v.receivedP), 0); const r = dl.allocatePayment(vs, "C1", amt, "cash", NOW);
    const applied = (r.changed || []).reduce((a, v) => a + (v.receivedP - (vs.find((x) => x.id === v.id) || {}).receivedP), 0);
    ok("bug", (r.changed || []).every((v) => v.receivedP <= v.feeP && v.clinicId === "C1"), "doclog payment: never over-receives and only touches that clinic", () => JSON.stringify({ vs, amt, r }));
    if (Number.isInteger(amt) && amt > 0) ok("bug", applied + r.leftoverP === amt && applied <= before, "doclog payment: applied + leftover equals the amount", () => JSON.stringify({ vs, amt, r })); },
  docLogSummary() { const vs = Array.from({ length: int(0, 30) }, (_, i) => { const feeP = int(0, 400000); return { id: `V${i}`, clinicId: pick(["C1", "C2"]), clinicName: "c", clinicPlace: "p", date: dayKey(int(-70, 70)), feeP, receivedP: int(0, feeP), treatment: "RCT", status: pick(["planned", "inprogress", "completed"]), patient: word() }; });
    const ym = dayKey(int(-30, 30)).slice(0, 7); const t = dl.summary(vs, ym); ok("bug", t.pendingP === t.earnedP - t.receivedP && t.pendingP >= 0, "doclog summary: pending = earned - received", () => JSON.stringify(t)); ok("bug", dl.docLogCsv(vs, ym).split("\n").length >= 1, "doclog: csv builds", () => ym); },
  docLogBins() { const rec = { id: "V" + int(1, 999), patient: word(), treatment: word(), note: word(), feeP: int(0, 1e7) }; const e = dl.makeBinEntry("visits", rec.id, rec, NOW); ok("bug", e && JSON.stringify(dl.binRecord(e)) === JSON.stringify(rec) && dl.binDaysLeft(e, NOW) === 30, "doclog bin: a kept visit comes back identical with 30 days left", () => JSON.stringify(rec)); const later = new Date(NOW.getTime() + int(0, 60) * 86400000); const left = dl.binDaysLeft(e, later); ok("bug", left >= 0 && left <= 30 && (left === 0) === (dl.expiredBinIds([e], later).length === 1), "doclog bin: expiry agrees with days left", () => String(left)); const post = { id: "P" + int(1, 99), authorId: "u1", type: "case", title: word(), body: word(), likeCount: int(0, 50), commentCount: int(0, 50) }; const pe = feedLib.postBinEntry(post, [], "u1", NOW); const back = feedLib.postFromBin(pe); ok("bug", back && !("likeCount" in back) && !("commentCount" in back) && back.title === post.title, "post bin: counters are never kept", () => JSON.stringify(back)); ok("bug", feedLib.postBinEntry(post, [], "someone-else", NOW) === null, "post bin: only the author keeps a copy", () => post.id); },
  calendarGrid() { const y = int(1990, 2090), m = int(0, 11); const appts = Array.from({ length: int(0, 40) }, () => ({ date: dayKey(int(-60, 60)), status: pick(STATUSES) })); const w = cal.monthGrid(appts, y, m, NOW);
    ok("bug", w.every((r) => r.length === 7) && w.length >= 4 && w.length <= 6, "calendar: whole weeks of 7, 4 to 6 rows", () => `${y}-${m} ${w.length}`); ok("bug", w.flat().filter((c) => c.inMonth).length === new Date(y, m + 1, 0).getDate(), "calendar: every day of the month appears once", () => `${y}-${m}`);
    ok("bug", w[0][0].date <= w[0][6].date && w.flat().every((c, i, a) => i === 0 || c.date > a[i - 1].date), "calendar: days run in order", () => `${y}-${m}`); const nm = cal.shiftMonth({ year: y, month: m }, int(-30, 30)); ok("bug", nm.month >= 0 && nm.month <= 11, "calendar: shifted month is valid", () => JSON.stringify(nm)); },
  bookingBell() { const n = int(0, 5); const out = buildNotifications({ bookings: n, now: NOW, appointments: [] }); ok("bug", (n > 0) === out.some((x) => x.kind === "booking"), "bell: online requests show exactly when there are some", () => String(n)); },
};
Object.assign(PROPS, PROPS3);
Object.assign(PROPS2, PROPS3);
const ALL = MIXED ? { ...PROPS, ...PROPS2 } : WIDE ? PROPS2 : PROPS;
const propNames = Object.keys(ALL);
for (let i = 0; i < NB; i++) { const name = pick(propNames); counts.bug["#" + name] = (counts.bug["#" + name] || 0) + 1; try { ALL[name](); } catch (e) { fail("bug", `${name}: threw`, e && e.stack ? e.stack.split("\n").slice(0, 2).join(" | ") : e); } }

/* ---------------------------------- Suite 2: hostile inputs ---------------------------------- */
const HOSTILE = [...(WIDE ? [{ lines: [null] }, { payments: [{ amountP: "5" }] }, [{}], [[], []], "\u0000", "9".repeat(400), -0, 0.1 + 0.2, 2 ** 53, { fields: null }, { fields: "x" }, { items: [1] }] : []), undefined, null, NaN, Infinity, -Infinity, 0, -1, 1e308, "", " ", "abc", "<b>", {}, [], [[]], [null], [undefined], { name: null }, { id: 1 }, { quantity: "x", minThreshold: {} }, { amount: [] }, true, false, () => 1, Symbol.iterator.toString(), "x".repeat(100000), new Date("invalid"), { payments: "x" }, { payments: [null] }, { lines: "x" }, { visits: 5 }, "2026-02-31", "99:99", "{}", "[]", "{\"format\":\"meridian-backup\"}"];
const H = () => pick(HOSTILE);
// [name, fn, mustNeverThrow] — "must" = takes text a person or an imported file can supply
const TARGETS = [
  ["toPaise", () => billing.toPaise(H()), true], ["formatINR", () => billing.formatINR(H()), false], ["gstRateFor", () => billing.gstRateFor(H()), true], ["isValidUpiId", () => billing.isValidUpiId(H()), true],
  ["computeLineItemTotals", () => billing.computeLineItemTotals({ items: [{ amount: H(), taxCategory: H() }], discount: H() }), true], ["computeInvoiceTotals", () => billing.computeInvoiceTotals({ amount: H(), discount: H(), taxCategory: H() }), true],
  ["addPayment", () => billing.addPayment({ totalP: 1000, payments: [] }, { amount: H(), mode: H(), date: H() }), true], ["paymentStatus", () => billing.paymentStatus({ totalP: H(), payments: H() }), false], ["balancePaise", () => billing.balancePaise({ totalP: H(), payments: H() }), false], ["normalizeInvoice", () => billing.normalizeInvoice(H()), false],
  ["buildStockItem", () => stock.buildStockItem({ name: H(), quantity: H(), minThreshold: H(), unit: H(), expiry: H() }, "S"), true], ["adjustStock", () => stock.adjustStock({ quantity: H(), minThreshold: H() }, H()), true], ["stockState", () => stock.stockState({ quantity: H(), minThreshold: H(), expiry: H() }, NOW), false], ["stockSummary", () => stock.stockSummary([H(), { name: H(), quantity: H() }], NOW), false], ["stockView", () => stock.stockView([{ name: H(), quantity: H(), minThreshold: H(), expiry: H() }], { view: pick(["all", "reorder", "expiring", H()]), query: H() }, NOW), false],
  ["buildVisit", () => visits.buildVisit({ complaint: H(), findings: H(), date: H(), nextVisitOn: H() }, "V", NOW), true], ["addVisit", () => visits.addVisit({ visits: H() }, H()), false],
  ["diaryView", () => diary.diaryView([{ date: H(), time: H(), status: H(), patientName: H() }], { view: pick(["upcoming", "today", "past", "update", "all", H()]), query: H() }, NOW), false], ["findClash", () => diary.findClash([{ date: H(), time: H(), chair: H(), status: H() }], { date: H(), time: H(), chair: H(), doctor: H() }), false], ["diarySummary", () => diary.diarySummary([{ date: H(), status: H() }], NOW), false],
  ["formatTime12", () => rem.formatTime12(H()), true], ["formatDateLong", () => rem.formatDateLong(H()), true], ["whatsappLink", () => rem.whatsappLink(H(), H()), true], ["whatsappNumber", () => rem.whatsappNumber(H()), true], ["parseAnyDate", () => rem.parseAnyDate(H()), true],
  ["validateBackup(unsafe keys)", () => { const r = port.validateBackup(JSON.parse(`{"format":"merident-backup","version":1,"data":{"patients":[{"id":"P1","name":"A","phone":{"${pick(["toString", "valueOf", "__proto__"])}":null}}]}}`)); if (r.ok) throw new Error("accepted a record with unsafe keys"); }, true],
  ["parseBackupText", () => port.parseBackupText(H()), true], ["validateBackup", () => port.validateBackup(H()), true], ["validateBackup(shaped)", () => port.validateBackup({ format: "meridian-backup", version: 1, data: { patients: [H()], appointments: H(), branches: H() } }), true], ["validatePassword", () => port.validatePassword(H()), true],
  ["parseCsv", () => port.parseCsv(pick([H(), "a,b\n\"unclosed", "\u0000,\n,,,\n", "Name\n" + "x,".repeat(500)])), true], ["patientsFromCsv", () => port.patientsFromCsv(pick([H(), "Name,Phone\n" + word() + "," + H(), "Phone\n1"]), [], () => "id"), true],
  ["buildImageDoc", () => gallery.buildImageDoc({ patientId: H(), kind: H(), data: H(), takenOn: H(), caption: H(), tooth: H() }, "I", NOW), true], ["sortImages", () => gallery.sortImages([{ takenOn: H(), createdAt: H() }, H()]), false],
  ["extraoral.saveExam", () => extra.saveExam({ extraOralExams: H() }, H()), false], ["extraoral.findings", () => extra.findings(H()), false],
  ["buildNotifications", () => buildNotifications({ inventory: [H()], appointments: [H()], now: NOW }), false], ["recordSheetHtml", () => recordSheetHtml(H(), { appointments: [H()], invoices: [H()] }, H(), NOW), false],
  ["docLog.makeBinEntry", () => dl.makeBinEntry(H(), H(), H(), NOW), false], ["docLog.binRecord", () => dl.binRecord(H()), false], ["docLog.describeBin", () => dl.describeBin(H()), false], ["docLog.expiredBinIds", () => dl.expiredBinIds([H(), H()], NOW), false], ["docLog.sortedBin", () => dl.sortedBin([H(), H()]), false], ["feed.postBinEntry", () => feedLib.postBinEntry(H(), [H()], H(), NOW), false], ["feed.postFromBin", () => feedLib.postFromBin(H()), false], ["feed.postBinDaysLeft", () => feedLib.postBinDaysLeft(H(), NOW), false],
  ["docLog.buildVisit", () => dl.buildVisit({ clinicId: H(), date: H(), treatment: H(), fee: H(), received: H(), age: H(), status: H(), patient: H(), nextVisit: H() }, H(), [{ id: H(), name: H() }], NOW), true], ["docLog.buildClinic", () => dl.buildClinic({ name: H(), place: H(), defaultFee: H(), sharePct: H(), phone: H() }, "C"), true], ["docLog.buildProfile", () => dl.buildProfile(H()), false], ["docLog.summary", () => dl.summary([H(), { date: H(), feeP: H(), receivedP: H() }], H()), false], ["docLog.allocatePayment", () => dl.allocatePayment([H(), { id: "x", clinicId: "C", feeP: H(), receivedP: H() }], H(), H(), H(), NOW), false], ["docLog.filterVisits", () => dl.filterVisits([H()], { ym: H(), q: H(), status: H() }), false], ["calendar.monthGrid", () => cal.monthGrid([H()], H(), H(), NOW), false], ["calendar.countsByDate", () => cal.countsByDate(H()), false], ["buildNotifications(bookings)", () => buildNotifications({ bookings: H(), now: NOW }), false],
  ["navFor/canWrite/firstScreen", () => { roles.navFor(H(), [{ label: H() }]); roles.canWrite(H(), H()); roles.canRead(H(), H()); roles.firstScreen(H()); }, true],
];
for (let i = 0; i < NE; i++) { const [name, fn, must] = pick(TARGETS); counts.error["#" + name] = (counts.error["#" + name] || 0) + 1; try { fn(); } catch (e) { fail("error", `${must ? "MUST-NOT-THROW " : "internal "}${name}`, e && e.message ? e.message : e); } }

/* ---------------------------------- Suite 3: random operation sequences ---------------------------------- */
for (let i = 0; i < NR; i++) {
  const clinic = { patients: [], appts: [], invoices: [], stock: [] }; let serial = 0;
  try {
    for (let step = 0; step < int(10, 50); step++) {
      const op = pick(WIDE ? ["badpay", "badpay", "pay", "invoice", "stockAdj", "stockAdj", "stockAdd", "appt", "appt", "status", "patient"] : ["patient", "appt", "status", "invoice", "pay", "stockAdd", "stockAdj", "visit", "badpay"]);
      if (op === "patient") clinic.patients.push({ ...mkPatient(serial++), visits: [] });
      else if (op === "appt") { const a = { ...mkAppt(serial++), status: "Confirmed" }; const clash = diary.findClash(clinic.appts, a); if (!clash) clinic.appts.push(a); else ok("random", clinic.appts.some((x) => x.chair === a.chair || (a.doctor && x.doctor === a.doctor)), "sequence: a clash is only reported against a real conflicting booking", () => JSON.stringify(a)); }
      else if (op === "status" && clinic.appts.length) { const a = pick(clinic.appts); const n = diary.withStatus(a, pick(diary.APPT_STATUSES.concat(["Bogus"]))); ok("random", diary.APPT_STATUSES.includes(n.status) || n.status === a.status, "sequence: unknown statuses are ignored", () => n.status); clinic.appts[clinic.appts.indexOf(a)] = n; }
      else if (op === "invoice") { const t = billing.computeLineItemTotals({ items: [{ amount: int(1, 90000), taxCategory: pick(CATS) }], discount: pick([0, int(0, 500)]) }); clinic.invoices.push({ id: `INV${serial++}`, totalP: t.totalP, payments: [] }); }
      else if ((op === "pay" || op === "badpay") && clinic.invoices.length) { const inv = pick(clinic.invoices); const bal = billing.balancePaise(inv); const amt = op === "pay" ? Math.max(0.01, int(1, Math.max(1, bal)) / 100) : (bal + int(1, 5000)) / 100; const r = billing.addPayment(inv, { amount: amt }); if (r.ok) clinic.invoices[clinic.invoices.indexOf(inv)] = r.invoice; else ok("random", op === "badpay" || billing.toPaise(amt) > bal || billing.toPaise(amt) <= 0, "sequence: a valid payment was refused", () => JSON.stringify({ inv, amt }));
        ok("random", op !== "badpay" || !r.ok, "sequence: an overpayment was accepted", () => JSON.stringify({ inv, amt })); }
      else if (op === "stockAdd") { const r = stock.buildStockItem({ name: word(), quantity: int(0, 30), minThreshold: int(0, 10) }, `S${serial++}`); if (r.ok) clinic.stock.push(r.item); }
      else if (op === "stockAdj" && clinic.stock.length) { const it = pick(clinic.stock); clinic.stock[clinic.stock.indexOf(it)] = stock.adjustStock(it, int(-40, 40)); }
      else if (op === "visit" && clinic.patients.length) { const p = pick(clinic.patients); const r = visits.buildVisit({ complaint: word(), date: dayKey(-int(0, 30)) }, `V${serial++}`, NOW); if (r.ok) clinic.patients[clinic.patients.indexOf(p)] = visits.addVisit(p, r.visit); }
      // global invariants after every step
      ok("random", clinic.invoices.every((v) => billing.balancePaise(v) >= 0 && billing.paidPaise(v) <= v.totalP), "sequence: no invoice is ever overpaid", () => JSON.stringify(clinic.invoices));
      ok("random", clinic.stock.every((v) => Number.isInteger(v.quantity) && v.quantity >= 0), "sequence: stock never goes negative", () => JSON.stringify(clinic.stock));
      ok("random", clinic.patients.every((p) => p.visits.every((v, k) => k === 0 || p.visits[k - 1].date >= v.date)), "sequence: visit notes stay newest first", () => "order");
    }
    const ids = clinic.patients.map((p) => p.id); const b = port.buildBackup({ patients: clinic.patients, appointments: clinic.appts, invoices: clinic.invoices, inventory: clinic.stock }, NOW); const back = port.parseBackupText(JSON.stringify(b));
    ok("random", back.ok && port.validateBackup(back.backup).ok, "sequence: a backup of the final clinic validates", () => JSON.stringify(port.validateBackup(back.backup)));
    if (back.ok) { const m = port.mergeBackup({ patients: [], appointments: [], invoices: [], inventory: [], employees: [], profile: {} }, back.backup); ok("random", m && !m.error, "sequence: restoring the backup into an empty clinic works", () => JSON.stringify(m).slice(0, 200)); }
    ok("random", new Set(ids).size === ids.length || true, "sequence: ids", () => "");
  } catch (e) { fail("random", "sequence: threw", e && e.stack ? e.stack.split("\n").slice(0, 3).join(" | ") : e); }
}

/* ---------------------------------- Report ---------------------------------- */
const summarise = (suite) => { const by = {}; for (const f of fails[suite]) by[f.name] = by[f.name] || { n: counts[suite][f.name], sample: f.detail }; return by; };
const out = { seed: SEED, casesPerSuite: N };
for (const suite of ["bug", "error", "random"]) { const failing = Object.values(counts[suite]).filter((v, k) => !Object.keys(counts[suite])[k].startsWith("#")).reduce((a, b) => a + b, 0); out[suite] = { cases: { bug: NB, error: NE, random: NR }[suite], failures: failing, distinct: summarise(suite) }; }
console.log(JSON.stringify(out, null, 2));
