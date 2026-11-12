import { describe, it, expect } from "vitest";
import { newExam, setDepth, toggleBop, setMobility, summarize, compareExams, hasReadings, saveExam, MAX_EXAMS } from "../src/perio.js";
import { buildSchedule, scheduleStatus, withInstalments, instalmentView, syncDueDate } from "../src/instalments.js";
import { validateCertificate, buildCertificateHtml } from "../src/certificate.js";

describe("perio", () => {
  it("records depths, bleeding and mobility and ignores bad input", () => {
    let e = newExam("E1", "2026-11-12");
    e = setDepth(e, "16", 0, "3"); e = setDepth(e, "16", 1, "5"); e = setDepth(e, "16", 2, "7");
    e = setDepth(e, "99", 0, "3"); e = setDepth(e, "16", 9, "3"); e = setDepth(e, "16", 3, "40");
    e = toggleBop(e, "16"); e = setMobility(e, "16", "2");
    expect(e.teeth["99"]).toBeUndefined();
    expect(e.teeth["16"].pd).toEqual([3, 5, 7, null, null, null]);
    expect(summarize(e)).toMatchObject({ sites: 3, sites4: 2, sites6: 1, pct4: 67, bopTeeth: 1, bopPct: 100, mobile: 1, meanDepth: 5, deepest: { tooth: "16", site: "MB", depth: 7 } });
    expect(hasReadings(newExam("E", "2026-01-01"))).toBe(false);
    expect(hasReadings(e)).toBe(true);
    e = setDepth(e, "16", 0, "");
    expect(e.teeth["16"].pd[0]).toBeNull();
  });
  it("compares exams and keeps history newest first", () => {
    let a = setDepth(setDepth(newExam("A", "2026-01-01"), "11", 0, 6), "11", 1, 4);
    let b = setDepth(setDepth(newExam("B", "2026-06-01"), "11", 0, 3), "11", 1, 5);
    expect(compareExams(a, b)).toEqual({ better: 1, worse: 1, same: 0 });
    let list = saveExam([], a); list = saveExam(list, b);
    expect(list.map((x) => x.id)).toEqual(["B", "A"]);
    expect(saveExam(list, { ...a, date: "2026-07-01" })[0].id).toBe("A");
    let many = []; for (let i = 0; i < MAX_EXAMS + 3; i += 1) many = saveExam(many, newExam(`X${i}`, `2026-01-${String(i + 1).padStart(2, "0")}`));
    expect(many).toHaveLength(MAX_EXAMS);
  });
});

describe("instalments", () => {
  it("splits evenly with the remainder on the last", () => {
    const r = buildSchedule({ totalP: 100000, count: 3, firstDueOn: "2026-11-30", downP: 1000 });
    expect(r.ok).toBe(true);
    expect(r.schedule.map((s) => s.amountP)).toEqual([33000, 33000, 33000]);
    expect(r.schedule.map((s) => s.dueOn)).toEqual(["2026-11-30", "2026-12-30", "2027-01-30"]);
    expect(buildSchedule({ totalP: 100, count: 3, firstDueOn: "2026-01-31" }).schedule.map((s) => s.dueOn)).toEqual(["2026-01-31", "2026-02-28", "2026-03-31"]);
    expect(buildSchedule({ totalP: 100, count: 1, firstDueOn: "2026-01-01" }).ok).toBe(false);
    expect(buildSchedule({ totalP: 100, count: 3, firstDueOn: "x" }).ok).toBe(false);
    expect(buildSchedule({ totalP: 100, count: 3, firstDueOn: "2026-01-01", downP: 100 }).ok).toBe(false);
    expect(buildSchedule({ totalP: 100001, count: 3, firstDueOn: "2026-01-01" }).schedule.map((s) => s.amountP)).toEqual([33333, 33333, 33335]);
  });
  it("tracks paid, part, due and overdue and moves the due date", () => {
    const schedule = buildSchedule({ totalP: 90000, count: 3, firstDueOn: "2026-11-01", downP: 0 }).schedule;
    const rows = scheduleStatus(schedule, 40000, "2026-12-15");
    expect(rows.map((r) => r.status)).toEqual(["paid", "overdue", "due"]);
    expect(rows[1].paidP).toBe(10000);
    expect(scheduleStatus(schedule, 0, "2026-10-01").map((r) => r.status)).toEqual(["due", "due", "due"]);
    let inv = withInstalments({ id: "I1", totalP: 90000, payments: [] }, schedule, 0, "2026-10-01");
    expect(inv.dueDate).toBe("2026-11-01");
    inv = syncDueDate({ ...inv, payments: [{ amountP: 30000 }] }, "2026-11-02");
    expect(inv.dueDate).toBe("2026-12-01");
    expect(instalmentView({ id: "x" })).toBeNull();
    expect(instalmentView(inv, "2026-11-02").next.no).toBe(2);
  });
});

describe("certificate", () => {
  it("validates by kind", () => {
    expect(validateCertificate({ type: "x" })).toMatch(/kind/);
    expect(validateCertificate({ type: "rest", issuedOn: "2026-11-12", days: "0", from: "2026-11-12", treatment: "RCT" })).toMatch(/days/);
    expect(validateCertificate({ type: "rest", issuedOn: "2026-11-12", days: "2", from: "2026-11-12", treatment: "" })).toMatch(/treatment/i);
    expect(validateCertificate({ type: "fitness", issuedOn: "2026-11-12" })).toBe("");
    expect(validateCertificate({ type: "rest", issuedOn: "2026-11-12", days: "2", from: "2026-11-12", treatment: "RCT" })).toBe("");
  });
  it("prints the details and escapes text", () => {
    const html = buildCertificateHtml({ type: "rest", patient: { id: "P1", name: "Asha <b>", age: 30 }, profile: { name: "Smile Dental", drName: "Dr. Ravi", councilRegNumber: "TN123", qualification: "BDS" }, issuedOn: "2026-11-12", days: "2", from: "2026-11-13", treatment: "RCT of 36" });
    expect(html).toContain("Asha &lt;b&gt;");
    expect(html).toContain("12/11/2026");
    expect(html).toContain("<strong>2 days</strong>");
    expect(html).toContain("Reg. No: TN123");
    expect(html).toContain("Dr. Ravi");
    expect(html).not.toContain("Dr. Dr.");
  });
});
