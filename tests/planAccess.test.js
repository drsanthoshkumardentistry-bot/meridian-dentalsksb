import { describe, it, expect } from "vitest";
import { planAccess, GRACE_DAYS, VIEW_ONLY_DAYS, TRIAL_DAYS } from "../src/plan.js";

const DAY = 86400000;
const now = Date.UTC(2026, 11, 20, 6);
const created = now - 200 * DAY; // old account, trial long over

describe("what happens when a plan ends", () => {
  it("changes nothing while pricing is off or when data is missing", () => {
    expect(planAccess({ createdAt: created, paidUntil: 0, now }).mode).toBe("full");
    expect(planAccess({ createdAt: 0, paidUntil: 0, now, live: true }).mode).toBe("full");
    expect(planAccess({ createdAt: created, paidUntil: now + 5 * DAY, now, live: true }).mode).toBe("full");
    expect(planAccess({ createdAt: now - 5 * DAY, now, live: true }).mode).toBe("full");
  });
  it("gives 7 grace days, then view-only to day 30, then downloads only", () => {
    const at = (days) => planAccess({ createdAt: created, paidUntil: now - days * DAY + 3600000, now, live: true });
    expect(at(0.5).mode).toBe("grace");
    expect(at(1)).toMatchObject({ mode: "grace", daysSince: 1, graceLeft: GRACE_DAYS });
    expect(at(7)).toMatchObject({ mode: "grace", daysSince: 7, graceLeft: 1 });
    expect(at(7.5)).toMatchObject({ mode: "viewonly", daysSince: 8, viewOnlyLeft: VIEW_ONLY_DAYS - 7 });
    expect(at(30)).toMatchObject({ mode: "viewonly", daysSince: 30, viewOnlyLeft: 1 });
    expect(at(30.5).mode).toBe("download");
    expect(at(400).mode).toBe("download");
  });
  it("counts from the end of the free trial when nothing was ever paid", () => {
    const a = planAccess({ createdAt: now - (TRIAL_DAYS + 3) * DAY, now, live: true });
    expect(a).toMatchObject({ mode: "grace", reason: "trial" });
    expect(planAccess({ createdAt: now - (TRIAL_DAYS + 12) * DAY, now, live: true }).mode).toBe("viewonly");
  });
  it("counts a lapsed paid plan from its paid-until date, not the trial", () => {
    const a = planAccess({ createdAt: created, paidUntil: now - 10 * DAY, plan: "pro", now, live: true });
    expect(a).toMatchObject({ mode: "viewonly", reason: "paid" });
  });
  it("treats a paused plan like an ended one from the day it was paused", () => {
    const a = planAccess({ createdAt: created, paidUntil: now - 2 * DAY, paused: true, pausedRemaining: 20 * DAY, plan: "pro", now, live: true });
    expect(a).toMatchObject({ mode: "grace", reason: "paused" });
    const b = planAccess({ createdAt: created, paidUntil: now - 12 * DAY, paused: true, pausedRemaining: 20 * DAY, now, live: true });
    expect(b.mode).toBe("viewonly");
    expect(planAccess({ createdAt: created, paidUntil: 0, paused: true, pausedRemaining: 5 * DAY, now, live: true }).mode).toBe("viewonly");
  });
  it("renewing brings everything back at once", () => {
    expect(planAccess({ createdAt: created, paidUntil: now + 30 * DAY, plan: "pro", now, live: true }).mode).toBe("full");
  });
});
