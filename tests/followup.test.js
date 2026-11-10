import { describe, it, expect } from "vitest";
import {
  dueFeedbackRequests, buildFeedbackMessage, markFeedbackAsked, awaitingRatings, recordRating, resolveFeedback, lowRatings,
  canInviteReview, buildReviewMessage, markReviewAsked, isValidReviewLink, feedbackSummary, duePlanFollowUps, buildPlanFollowUp, markPlanFollowedUp, isValidRating,
} from "../src/followup.js";

const now = new Date(2026, 10, 11, 12); // 11 Nov 2026
const appt = (o = {}) => ({ id: "A1", patientId: "P1", patientName: "Asha", phone: "9876543210", date: "2026-11-10", status: "Completed", procedure: "Scaling", ...o });
const pat = (o = {}) => ({ id: "P1", name: "Asha", phone: "9876543210", plans: [], ...o });

describe("feedback requests", () => {
  it("lists completed recent visits not yet asked about", () => {
    expect(dueFeedbackRequests([appt()], [pat()], now)).toHaveLength(1);
  });
  it("skips old, not-completed, already asked, rated, opted-out and bad-number visits", () => {
    expect(dueFeedbackRequests([appt({ date: "2026-11-01" })], [pat()], now)).toHaveLength(0);
    expect(dueFeedbackRequests([appt({ status: "Scheduled" })], [pat()], now)).toHaveLength(0);
    expect(dueFeedbackRequests([appt({ feedbackAskedAt: "x" })], [pat()], now)).toHaveLength(0);
    expect(dueFeedbackRequests([appt({ feedback: { rating: 5 } })], [pat()], now)).toHaveLength(0);
    expect(dueFeedbackRequests([appt()], [pat({ consent: { whatsapp: false } })], now)).toHaveLength(0);
    expect(dueFeedbackRequests([appt({ phone: "123" })], [pat()], now)).toHaveLength(0);
  });
  it("does not list future visits", () => {
    expect(dueFeedbackRequests([appt({ date: "2026-11-12" })], [pat()], now)).toHaveLength(0);
  });
  it("writes a short message asking for 1 to 5", () => {
    const m = buildFeedbackMessage({ clinicName: "Smile Care", appt: appt() });
    expect(m).toContain("Hello Asha");
    expect(m).toContain("Smile Care");
    expect(m).toContain("1 (poor) to 5 (excellent)");
  });
  it("marks asked, then waits for a reply for 14 days", () => {
    const asked = markFeedbackAsked(appt(), now);
    expect(awaitingRatings([asked], now)).toHaveLength(1);
    expect(dueFeedbackRequests([asked], [pat()], now)).toHaveLength(0);
    expect(awaitingRatings([asked], new Date(2026, 11, 1, 12))).toHaveLength(0);
  });
});

describe("ratings", () => {
  it("validates 1 to 5 only", () => {
    expect([0, 1, 5, 6, 2.5, "x"].map(isValidRating)).toEqual([false, true, true, false, false, false]);
    expect(recordRating(appt(), 9)).toEqual(appt());
  });
  it("records a rating with a trimmed comment", () => {
    const r = recordRating(appt({ feedbackAskedAt: "x" }), 4, "  good  ", now);
    expect(r.feedback).toMatchObject({ rating: 4, comment: "good", resolved: true });
    expect(awaitingRatings([r], now)).toHaveLength(0);
  });
  it("flags 3 and below until handled", () => {
    const low = recordRating(appt(), 2, "waited long", now);
    expect(low.feedback.resolved).toBe(false);
    expect(lowRatings([low, recordRating(appt({ id: "A2" }), 5, "", now)])).toHaveLength(1);
    expect(lowRatings([resolveFeedback(low)])).toHaveLength(0);
  });
  it("summarises the last 90 days", () => {
    const a = recordRating(appt({ id: "1" }), 5, "", now);
    const b = recordRating(appt({ id: "2" }), 4, "", now);
    const old = recordRating(appt({ id: "3" }), 1, "", new Date(2026, 0, 1));
    expect(feedbackSummary([a, b, old], now)).toEqual({ count: 2, average: 4.5, distribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 } });
    expect(feedbackSummary([], now).average).toBe(0);
  });
});

describe("review invitations", () => {
  const link = "https://g.page/r/abc123";
  it("accepts only https links", () => {
    expect(isValidReviewLink(link)).toBe(true);
    expect(isValidReviewLink("http://x.com")).toBe(false);
    expect(isValidReviewLink("g.page/r/abc")).toBe(false);
    expect(isValidReviewLink("")).toBe(false);
  });
  it("invites only 4 and 5 star patients, once, when a link is set", () => {
    const happy = recordRating(appt(), 5, "", now);
    expect(canInviteReview(happy, link)).toBe(true);
    expect(canInviteReview(happy, "")).toBe(false);
    expect(canInviteReview(recordRating(appt(), 3, "", now), link)).toBe(false);
    expect(canInviteReview(markReviewAsked(happy, now), link)).toBe(false);
    expect(canInviteReview(appt(), link)).toBe(false);
  });
  it("includes the link in the message", () => {
    expect(buildReviewMessage({ clinicName: "Smile Care", appt: appt(), reviewLink: ` ${link} ` })).toContain(`\n${link}\n`);
  });
});

describe("treatment plan follow-up", () => {
  const plan = (o = {}) => ({ id: "PL1", title: "Root canal 46", status: "Proposed", createdAt: "05/11/2026", decidedAt: "", ...o });
  it("lists a proposed plan after 3 days and an approved one after 7", () => {
    expect(duePlanFollowUps([pat({ plans: [plan()] })], [], now)).toHaveLength(1);
    expect(duePlanFollowUps([pat({ plans: [plan({ createdAt: "10/11/2026" })] })], [], now)).toHaveLength(0);
    const approved = plan({ status: "Approved", createdAt: "01/11/2026", decidedAt: "08/11/2026" });
    expect(duePlanFollowUps([pat({ plans: [approved] })], [], now)).toHaveLength(0);
    expect(duePlanFollowUps([pat({ plans: [{ ...approved, decidedAt: "03/11/2026" }] })], [], now)[0].days).toBe(8);
  });
  it("skips billed or declined plans, booked patients, opt-outs, bad numbers and recent nudges", () => {
    for (const status of ["Billed", "Declined"]) expect(duePlanFollowUps([pat({ plans: [plan({ status })] })], [], now)).toHaveLength(0);
    expect(duePlanFollowUps([pat({ plans: [plan()] })], [{ patientId: "P1", date: "2026-11-15", status: "Scheduled" }], now)).toHaveLength(0);
    expect(duePlanFollowUps([pat({ consent: { whatsapp: false }, plans: [plan()] })], [], now)).toHaveLength(0);
    expect(duePlanFollowUps([pat({ phone: "1", plans: [plan()] })], [], now)).toHaveLength(0);
    expect(duePlanFollowUps([pat({ plans: [plan({ followedUpAt: new Date(2026, 10, 9).toISOString() })] })], [], now)).toHaveLength(0);
    expect(duePlanFollowUps([pat({ plans: [plan({ followedUpAt: new Date(2026, 10, 1).toISOString() })] })], [], now)).toHaveLength(1);
  });
  it("lists the longest-waiting first", () => {
    const p = pat({ plans: [plan({ id: "a", createdAt: "07/11/2026" }), plan({ id: "b", createdAt: "01/11/2026" })] });
    expect(duePlanFollowUps([p], [], now).map((d) => d.plan.id)).toEqual(["b", "a"]);
  });
  it("words proposed and approved plans differently, and marks the nudge", () => {
    const patient = pat();
    expect(buildPlanFollowUp({ clinicName: "Smile Care", clinicPhone: "9000000000", patient, plan: plan(), totalP: 500000 })).toContain("₹5,000");
    expect(buildPlanFollowUp({ clinicName: "Smile Care", patient, plan: plan({ status: "Approved" }) })).toContain("You agreed");
    const marked = markPlanFollowedUp(pat({ plans: [plan(), plan({ id: "PL2" })] }), "PL1", now);
    expect(marked.plans[0].followedUpAt).toBe(now.toISOString());
    expect(marked.plans[1].followedUpAt).toBeUndefined();
  });
});
