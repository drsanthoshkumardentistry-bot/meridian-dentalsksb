import { describe, it, expect } from "vitest";
import {
  buildPlan, upsertPlans, removePlan, addMonthsISO, sellMembership, membershipStatus, daysLeft, activeMembershipFor,
  discountedAmountP, membershipSummary, renewalMessage, buildLead, setLeadStatus, followUpDue, leadSummary, sortLeads, leadWhatsAppLink, MAX_PLANS,
} from "../src/growth.js";
import { canRead, canWrite, navFor } from "../src/roles.js";

describe("plans", () => {
  it("validates and stores in paise", () => {
    const r = buildPlan({ name: " Family Gold ", price: "2999.5", months: "12", discountPct: "15", perks: "Free scaling" }, "MP1");
    expect(r.ok).toBe(true);
    expect(r.plan).toMatchObject({ name: "Family Gold", priceP: 299950, months: 12, discountPct: 15 });
    expect(buildPlan({ name: "", price: 1, months: 1 }).ok).toBe(false);
    expect(buildPlan({ name: "a", price: -1, months: 1 }).ok).toBe(false);
    expect(buildPlan({ name: "a", price: 1, months: 0 }).ok).toBe(false);
    expect(buildPlan({ name: "a", price: 1, months: 1, discountPct: 120 }).ok).toBe(false);
  });
  it("adds, replaces, removes and caps", () => {
    const p = (id) => ({ id, name: id });
    expect(upsertPlans([p("a")], { id: "a", name: "new" })).toEqual([{ id: "a", name: "new" }]);
    expect(removePlan([p("a"), p("b")], "a")).toEqual([p("b")]);
    const full = Array.from({ length: MAX_PLANS }, (_, i) => p(String(i)));
    expect(upsertPlans(full, p("x"))).toHaveLength(MAX_PLANS);
  });
});

describe("memberships", () => {
  it("adds months and clamps month ends", () => {
    expect(addMonthsISO("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonthsISO("2026-11-12", 12)).toBe("2027-11-12");
    expect(addMonthsISO("bad", 1)).toBe("");
  });
  const plan = { id: "MP1", name: "Gold", priceP: 100000, months: 12, discountPct: 10, perks: "" };
  const patient = { id: "P1", name: "Asha", phone: "9876543210" };
  it("sells with defaults and tracks status", () => {
    const r = sellMembership({ patient, plan, startOn: "2026-11-12" }, "MB1", new Date("2026-11-12T10:00:00Z"));
    expect(r.ok).toBe(true);
    expect(r.membership).toMatchObject({ endOn: "2027-11-12", paidP: 100000, patientName: "Asha" });
    expect(sellMembership({ patient: null, plan }, "x").ok).toBe(false);
    expect(sellMembership({ patient, plan, paidRupees: "abc" }, "x").ok).toBe(false);
    const m = r.membership;
    expect(membershipStatus(m, "2026-12-01")).toBe("active");
    expect(membershipStatus(m, "2027-10-20")).toBe("expiring");
    expect(membershipStatus(m, "2027-11-13")).toBe("expired");
    expect(daysLeft(m, "2027-11-02")).toBe(10);
  });
  it("finds the active membership and totals", () => {
    const a = { id: "1", patientId: "P1", startOn: "2025-01-01", endOn: "2026-01-01", paidP: 500 };
    const b = { id: "2", patientId: "P1", startOn: "2026-01-01", endOn: "2027-01-01", paidP: 700 };
    expect(activeMembershipFor([a, b], "P1", "2026-06-01").id).toBe("2");
    expect(activeMembershipFor([a], "P1", "2026-06-01")).toBeNull();
    expect(membershipSummary([a, b], "2026-06-01")).toEqual({ active: 1, expiring: 0, expired: 1, soldP: 1200 });
    expect(discountedAmountP(10000, 15)).toBe(8500);
    expect(renewalMessage({ clinicName: "Smile", m: { patientName: "Asha", planName: "Gold", endOn: "2026-12-01", startOn: "2026-01-01", discountPct: 10 }, today: "2026-11-30" })).toContain("ends in 1 day.");
  });
});

describe("leads", () => {
  const now = new Date("2026-11-12T10:00:00Z");
  it("validates", () => {
    expect(buildLead({ name: "", phone: "9876543210" }, "L").ok).toBe(false);
    expect(buildLead({ name: "Ravi", phone: "123" }, "L").ok).toBe(false);
    const r = buildLead({ name: "Ravi", phone: "+91 98765 43210", source: "Instagram", interest: "Braces", followUpOn: "2026-11-10" }, "L1", now);
    expect(r.lead).toMatchObject({ phone: "9876543210", source: "Instagram", status: "New", followUpOn: "2026-11-10" });
  });
  it("tracks follow-ups and summary", () => {
    const l1 = buildLead({ name: "A", phone: "9876543210", followUpOn: "2026-11-10" }, "1", now).lead;
    const l2 = setLeadStatus(buildLead({ name: "B", phone: "9876543211", followUpOn: "2026-11-10" }, "2", now).lead, "Booked");
    expect(followUpDue(l1, "2026-11-12")).toBe(true);
    expect(followUpDue(l2, "2026-11-12")).toBe(false);
    expect(l2.followUpOn).toBe("");
    expect(leadSummary([l1, l2], "2026-11-12")).toMatchObject({ total: 2, New: 1, Booked: 1, due: 1, bookedPct: 50 });
    expect(sortLeads([l2, l1], "2026-11-12")[0].id).toBe("1");
    expect(leadWhatsAppLink(l1, "Smile")).toContain("wa.me/919876543210");
  });
});

describe("access", () => {
  it("lets reception and managers use it, not dentists", () => {
    expect(canWrite("receptionist", "leads")).toBe(true);
    expect(canWrite("manager", "memberships")).toBe(true);
    expect(canRead("dentist", "leads")).toBe(false);
    const items = [{ label: "Memberships & Leads" }];
    expect(navFor("dentist", items)).toEqual([]);
    expect(navFor("receptionist", items)).toHaveLength(1);
  });
});
