import { describe, it, expect } from "vitest";
import {
  buildClinic, buildVisit, paymentState, pendingP, summary, duesByClinic, comingUp, visitNumber, filterVisits, monthsPresent,
  allocatePayment, docLogCsv, daysBetween,
} from "../src/docLog.js";

const NOW = new Date(2026, 10, 14, 12); // 14 Nov 2026
const clinics = [{ id: "C1", name: "Sri Sai Dental", place: "Pollachi" }, { id: "C2", name: "Smile Care", place: "Tiruppur" }];
const form = (over = {}) => ({ clinicId: "C1", date: "2026-11-12", treatment: "RCT", patient: "Ramesh K", fee: "3500", received: "", status: "inprogress", ...over });
const mk = (over = {}) => { const r = buildVisit(form(over), over.id || "V" + Math.random(), clinics, NOW); if (r.error) throw new Error(r.error); return r.visit; };

describe("DocLog: clinics", () => {
  it("needs a name, keeps money in paise and limits the share to 0-100", () => {
    expect(buildClinic({ name: "  " }, "C").error).toMatch(/clinic name/);
    const ok = buildClinic({ name: "Sri Sai", place: "Pollachi", defaultFee: "3,500", sharePct: "40", phone: "98765 43210" }, "C1");
    expect(ok.clinic).toMatchObject({ id: "C1", name: "Sri Sai", defaultFeeP: 350000, sharePct: 40, phone: "9876543210" });
    expect(buildClinic({ name: "A", sharePct: "120" }, "C").error).toMatch(/0 and 100/);
    expect(buildClinic({ name: "A", defaultFee: "99999999999" }, "C").error).toMatch(/usual fee/);
  });
});

describe("DocLog: visits", () => {
  it("accepts a minimal visit and fills sensible defaults", () => {
    const r = buildVisit({ clinicId: "C1", date: "2026-11-14", treatment: "Consultation" }, "V1", clinics, NOW);
    expect(r.visit).toMatchObject({ clinicName: "Sri Sai Dental", status: "completed", feeP: 0, receivedP: 0, payMode: "", nextVisit: "" });
  });
  it("refuses bad input with a clear message", () => {
    expect(buildVisit(form({ clinicId: "" }), "V", clinics, NOW).error).toMatch(/clinic/);
    expect(buildVisit(form({ date: "2026-02-30" }), "V", clinics, NOW).error).toMatch(/date/);
    expect(buildVisit(form({ date: "2028-01-01" }), "V", clinics, NOW).error).toMatch(/year ahead/);
    expect(buildVisit(form({ treatment: "" }), "V", clinics, NOW).error).toMatch(/treatment/);
    expect(buildVisit(form({ nextVisit: "2026-11-01" }), "V", clinics, NOW).error).toMatch(/before this visit/);
    expect(buildVisit(form({ received: "4000" }), "V", clinics, NOW).error).toMatch(/more than the fee/);
    expect(buildVisit(form({ age: "200" }), "V", clinics, NOW).error).toMatch(/age/);
    expect(buildVisit(form({ fee: "99999999999" }), "V", clinics, NOW).error).toMatch(/too large/);
  });
  it("keeps only a valid payment mode and only when money was received", () => {
    expect(mk({ received: "1000", payMode: "upi" }).payMode).toBe("upi");
    expect(mk({ received: "1000", payMode: "bitcoin" }).payMode).toBe("cash");
    expect(mk({ received: "", payMode: "upi" }).payMode).toBe("");
    expect(mk({ received: "1000", payMode: "other", payOther: "  Cheque " }).payMode).toBe("Cheque");
    expect(mk({ received: "1000", payMode: "other", payOther: "A very long made up mode" }).payMode.length).toBeLessThanOrEqual(10);
    expect(mk({ received: "1000", payMode: "other", payOther: "" }).payMode).toBe("other");
  });
  it("names the payment state", () => {
    expect(paymentState(mk({ fee: "0" }))).toBe("free");
    expect(paymentState(mk({ received: "" }))).toBe("pending");
    expect(paymentState(mk({ received: "1000" }))).toBe("part");
    expect(paymentState(mk({ received: "3500" }))).toBe("paid");
    expect(pendingP(mk({ received: "1000" }))).toBe(250000);
  });
  it("cleans spaces and a spreadsheet formula in a name stays harmless in the export", () => {
    const v = mk({ patient: "=HYPERLINK(\"x\")" });
    expect(docLogCsv([v])).toContain("'=HYPERLINK");
  });
});

describe("DocLog: totals, dues and what is coming up", () => {
  const a = mk({ id: "a", date: "2026-11-12", received: "", nextVisit: "2026-11-15" });
  const b = mk({ id: "b", clinicId: "C2", date: "2026-11-11", patient: "Anitha M", treatment: "Implant", fee: "12000", received: "7500", nextVisit: "2026-11-17" });
  const c = mk({ id: "c", date: "2026-10-20", patient: "Lakshmi S", treatment: "Consultation", fee: "1500", received: "1500", status: "completed" });
  const d = mk({ id: "d", date: "2026-10-22", patient: "Suresh P", fee: "2000", received: "" });
  const all = [a, b, c, d];

  it("adds up a month and all time", () => {
    expect(summary(all, "2026-11")).toMatchObject({ count: 2, clinics: 2, earnedP: 1550000, receivedP: 750000, pendingP: 800000, pendingClinics: 2, collectedPct: 48 });
    expect(summary(all, "").count).toBe(4);
    expect(summary([], "2026-11")).toMatchObject({ count: 0, earnedP: 0, collectedPct: 0 });
  });
  it("shows money owed per clinic across months, biggest first, with the oldest unpaid age", () => {
    const dues = duesByClinic(all, "2026-11-14");
    expect(dues.map((x) => [x.clinicId, x.pendingP])).toEqual([["C1", 550000], ["C2", 450000]]);
    expect(dues[0].oldestDays).toBe(23);
  });
  it("lists upcoming visits in date order and drops a booking once a later visit is logged", () => {
    expect(comingUp(all, "2026-11-14").map((v) => v.id)).toEqual(["a", "b"]);
    const done = mk({ id: "e", date: "2026-11-15", received: "" });
    expect(comingUp([...all, done], "2026-11-14").map((v) => v.id)).toEqual(["b"]);
    expect(comingUp(all, "2026-11-16").map((v) => v.id)).toEqual(["b"]);
  });
  it("counts which visit this is for the same patient and treatment", () => {
    const first = mk({ id: "p1", date: "2026-11-05" });
    const second = mk({ id: "p2", date: "2026-11-12" });
    expect(visitNumber([first, second], second)).toBe(2);
    expect(visitNumber([first, second], first)).toBe(1);
  });
  it("filters by month, clinic, status and search text", () => {
    expect(filterVisits(all, { ym: "2026-10" }).map((v) => v.id)).toEqual(["d", "c"]);
    expect(filterVisits(all, { clinicId: "C2" }).map((v) => v.id)).toEqual(["b"]);
    expect(filterVisits(all, { status: "pending" }).map((v) => v.id)).toEqual(["a", "b", "d"]);
    expect(filterVisits(all, { status: "completed" }).map((v) => v.id)).toEqual(["c"]);
    expect(filterVisits(all, { status: "inprogress" }).map((v) => v.id)).toEqual(["a", "b", "d"]);
    expect(filterVisits(all, { q: "implant" }).map((v) => v.id)).toEqual(["b"]);
  });
  it("lists months present, newest first, always including the current month", () => {
    expect(monthsPresent(all, "2026-11")).toEqual(["2026-11", "2026-10"]);
    expect(monthsPresent([], "2026-11")).toEqual(["2026-11"]);
  });
});

describe("DocLog: a clinic pays", () => {
  it("spreads a payment over the oldest unpaid visits first and reports any leftover", () => {
    const v1 = mk({ id: "v1", date: "2026-10-01", fee: "3000" });
    const v2 = mk({ id: "v2", date: "2026-10-10", fee: "2000" });
    const v3 = mk({ id: "v3", date: "2026-10-20", fee: "1000" });
    const other = mk({ id: "o", clinicId: "C2", date: "2026-10-02", fee: "500" });
    const r = allocatePayment([v3, other, v2, v1], "C1", 400000, "upi", NOW);
    expect(r.changed.map((v) => [v.id, v.receivedP])).toEqual([["v1", 300000], ["v2", 100000]]);
    expect(r.changed.every((v) => v.payMode === "upi")).toBe(true);
    expect(r.leftoverP).toBe(0);
    expect(allocatePayment([v1], "C1", 999999, "cash", NOW).leftoverP).toBe(999999 - 300000);
    expect(allocatePayment([v1], "C1", 0, "cash", NOW).changed).toEqual([]);
  });
});

describe("DocLog: dates", () => {
  it("counts days between two dates across a month end", () => {
    expect(daysBetween("2026-10-31", "2026-11-02")).toBe(2);
    expect(daysBetween("2026-11-02", "2026-10-31")).toBe(-2);
  });
});

import { treatmentsFor, buildProfile, SPECIALTY_TREATMENTS } from "../src/docLog.js";
import { SPECIALTIES } from "../src/connect/rules.js";
describe("DocLog speciality profile", () => {
  it("has a treatment list for every speciality, ending with Other", () => {
    for (const [k] of SPECIALTIES) { const l = treatmentsFor(k); expect(l.length).toBeGreaterThan(2); expect(l[l.length - 1]).toBe("Other"); }
    expect(Object.keys(SPECIALTY_TREATMENTS).sort()).toEqual(SPECIALTIES.map(([k]) => k).sort());
  });
  it("falls back to general for unknown or unset", () => {
    expect(treatmentsFor("")).toEqual(treatmentsFor("general"));
    expect(treatmentsFor("zzz")).toEqual(treatmentsFor("general"));
  });
  it("needs a real speciality and trims text", () => {
    expect(buildProfile({ specialty: "" }).error).toBeTruthy();
    expect(buildProfile({ specialty: "nope" }).error).toBeTruthy();
    expect(buildProfile({ specialty: "endodontics", name: "  Dr  A ", qualification: "MDS" }).profile).toEqual({ name: "Dr A", qualification: "MDS", specialty: "endodontics" });
  });
});

describe("modeLabel with a typed mode", () => {
  it("shows a known mode by name and a typed mode as typed", async () => {
    const { modeLabel } = await import("../src/docLog.js");
    expect(modeLabel("upi")).toBe("UPI");
    expect(modeLabel("Cheque")).toBe("Cheque");
    expect(modeLabel("")).toBe("");
  });
});

import { doctorName, greeting, todayLine } from "../src/docLog.js";
describe("greeting a doctor", () => {
  it("tidies the name however it was typed", () => {
    expect(doctorName("Dr.priyanka")).toBe("Priyanka");
    expect(doctorName("  dr  priyanka   kumar ")).toBe("Priyanka Kumar");
    expect(doctorName("Doctor Ravi")).toBe("Ravi");
    expect(doctorName("Dr.SanthoshKumar Sivakumar")).toBe("SanthoshKumar Sivakumar");
    expect(doctorName("Drishti")).toBe("Drishti"); // a name that only starts with the letters "dr"
    expect(doctorName("Dr.")).toBe("");
    expect(doctorName(null)).toBe("");
  });
  it("says hi with Dr. and the name, or a plain greeting without one", () => {
    expect(greeting("Dr.priyanka")).toBe("Hi Dr. Priyanka");
    expect(greeting("Anita")).toBe("Hi Dr. Anita");
    expect(greeting("")).toBe("Hi doctor");
    expect(greeting(undefined)).toBe("Hi doctor");
  });
  it("summarises today in one line, and stays silent when there is nothing to say", () => {
    const v = (o) => ({ id: "a", clinicId: "C1", clinicName: "X", patient: "P", date: "2026-11-10", feeP: 100000, receivedP: 40000, nextVisit: "", ...o });
    expect(todayLine([], "2026-11-16")).toBe("");
    expect(todayLine(null, "2026-11-16")).toBe("");
    expect(todayLine([v({ feeP: 0, receivedP: 0, nextVisit: "2026-11-16" })], "2026-11-16")).toBe("1 follow-up booked for today");
    expect(todayLine([v({}), v({ id: "b", clinicId: "C2", feeP: 50000, receivedP: 0 })], "2026-11-16", (p) => `Rs${p / 100}`)).toBe("Rs1100 still to receive from 2 clinics");
  });
});

import { makeBinEntry, binRecord, binDaysLeft, expiredBinIds, sortedBin, describeBin } from "../src/docLog.js";
describe("DocLog recently deleted helpers", () => {
  const rec = { id: "V1", patient: "Ramesh", treatment: "RCT", clinicName: "Sai", date: "2026-11-10" };
  const now = new Date("2026-11-16T00:00:00Z");
  it("keeps a visit or clinic, and nothing else", () => {
    const e = makeBinEntry("visits", "V1", rec, now);
    expect(e.id).toBe("visits__V1");
    expect(binRecord(e)).toEqual(rec);
    expect(makeBinEntry("patients", "V1", rec)).toBeNull();
    expect(makeBinEntry("visits", "", rec)).toBeNull();
    expect(makeBinEntry("visits", "V1", null)).toBeNull();
    expect(makeBinEntry("visits", "V1", { note: "x".repeat(30000) })).toBeNull();
  });
  it("counts 30 days and lists expired copies", () => {
    const e = makeBinEntry("visits", "V1", rec, now);
    expect(binDaysLeft(e, now)).toBe(30);
    expect(binDaysLeft(e, new Date("2026-12-10T00:00:00Z"))).toBe(6);
    const later = new Date("2026-12-17T00:00:00Z");
    expect(expiredBinIds([e], later)).toEqual(["visits__V1"]);
    expect(expiredBinIds([{ id: "x", deletedAt: "bad" }], now)).toEqual(["x"]);
  });
  it("describes entries and ignores junk", () => {
    expect(describeBin(makeBinEntry("visits", "V1", rec, now)).title).toBe("Ramesh");
    expect(describeBin(makeBinEntry("clinics", "C1", { name: "Sai Dental", place: "Pollachi" }, now)).title).toBe("Sai Dental");
    expect(binRecord({ json: "nope" })).toBeNull();
    expect(sortedBin([null, {}, makeBinEntry("visits", "V1", rec, now)]).length).toBe(1);
  });
});

import { sharePOf, clinicBreakdown, hasShares, myShareTotalP, whatsappNumber, statementText } from "../src/docLog.js";

describe("DocLog: consultant share and statements", () => {
  const cl = [{ id: "C1", name: "Sri Sai Dental", place: "Pollachi", sharePct: 40 }, { id: "C2", name: "Smile Care", place: "Tiruppur", sharePct: 0 }];
  const v = (o) => ({ id: "x" + Math.random(), clinicId: "C1", clinicName: "Sri Sai Dental", date: "2026-11-05", patient: "Ramesh K", treatment: "RCT", tooth: "36", feeP: 350000, receivedP: 0, createdAt: "2026-11-05T10:00:00Z", ...o });

  it("works out the doctor's share in whole paise; no share set means the whole fee", () => {
    expect(sharePOf(v(), cl)).toBe(140000);
    expect(sharePOf(v({ clinicId: "C2" }), cl)).toBe(350000);
    expect(sharePOf(v({ clinicId: "gone" }), cl)).toBe(350000);
    expect(sharePOf(v({ feeP: 333 }), [{ id: "C1", sharePct: 33.33 }])).toBe(111);
    expect(sharePOf(v({ feeP: 0 }), cl)).toBe(0);
    expect(sharePOf(null, null)).toBe(0);
    expect(Number.isInteger(sharePOf(v({ feeP: 1000000000 }), [{ id: "C1", sharePct: 99.99 }]))).toBe(true);
  });
  it("never gives a share above the fee, even with a bad share value", () => {
    for (const pct of [-5, 250, NaN, "abc", null, 100]) expect(sharePOf(v(), [{ id: "C1", sharePct: pct }])).toBeLessThanOrEqual(350000);
  });
  it("breaks a month down by clinic and totals the share", () => {
    const vis = [v({ receivedP: 100000 }), v({ date: "2026-11-09", feeP: 100000 }), v({ clinicId: "C2", clinicName: "Smile Care", feeP: 200000, receivedP: 200000 }), v({ date: "2026-10-01" })];
    const r = clinicBreakdown(vis, cl, "2026-11");
    expect(r.map((x) => x.clinicId)).toEqual(["C2", "C1"]);
    expect(r[1]).toMatchObject({ visits: 2, billedP: 450000, shareP: 180000, receivedP: 100000, pendingP: 350000 });
    expect(myShareTotalP(vis, cl, "2026-11")).toBe(380000);
    expect(clinicBreakdown(vis, cl, "").reduce((n, x) => n + x.visits, 0)).toBe(4);
    expect(clinicBreakdown(null, null, "")).toEqual([]);
  });
  it("shows a separate share figure only when some clinic keeps part of the bill", () => {
    expect(hasShares(cl)).toBe(true);
    expect(hasShares([{ id: "a", sharePct: 0 }, { id: "b", sharePct: 100 }])).toBe(false);
    expect(hasShares(undefined)).toBe(false);
  });
  it("makes a WhatsApp number from an Indian mobile or an international one", () => {
    expect(whatsappNumber("98765 43210")).toBe("919876543210");
    expect(whatsappNumber("+91 98765-43210")).toBe("919876543210");
    expect(whatsappNumber("0044 7700 900123")).toBe("447700900123");
    expect(whatsappNumber("12345")).toBe("");
    expect(whatsappNumber(undefined)).toBe("");
  });
  it("writes a statement of unpaid visits, oldest first, and nothing when nothing is owed", () => {
    const vis = [v({ date: "2026-11-09", patient: "Latha", treatment: "Extraction", tooth: "", feeP: 100000, receivedP: 40000 }), v(), v({ feeP: 500000, receivedP: 500000 }), v({ clinicId: "C2", clinicName: "Smile Care" })];
    const t = statementText({ visits: vis, clinic: cl[0], doctor: "Dr.priyanka", today: "2026-11-14", fmt: (p) => `Rs ${p / 100}` });
    expect(t).toContain("from Dr. Priyanka, as on 2026-11-14");
    expect(t).toContain("To: Sri Sai Dental, Pollachi");
    expect(t.indexOf("2026-11-05")).toBeLessThan(t.indexOf("2026-11-09"));
    expect(t).toContain("Ramesh K, RCT (tooth 36): Rs 3500");
    expect(t).toContain("Latha, Extraction: Rs 600");
    expect(t).toContain("Total pending: Rs 4100 (2 visits)");
    expect(statementText({ visits: [v({ receivedP: 350000 })], clinic: cl[0], today: "2026-11-14" })).toBe("");
    expect(statementText({ visits: null, clinic: null })).toBe("");
  });
});
