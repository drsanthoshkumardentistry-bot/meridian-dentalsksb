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
