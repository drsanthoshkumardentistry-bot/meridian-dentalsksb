import { describe, it, expect } from "vitest";
import { buildClaim, claimOutstandingP, addClaim, updateClaim, removeClaim, claimsSummary, claimsOf } from "../src/claims.js";

const now = new Date(2026, 10, 26, 10);
const ok = (f) => buildClaim({ insurer: "Star Health", claimed: "5000", ...f }, "C1", now);
describe("buildClaim", () => {
  it("shapes a valid claim in paise", () => {
    const r = ok({ kind: "TPA", policyNo: " P-1 ", approved: "4,000", status: "Approved" });
    expect(r.ok).toBe(true);
    expect(r.claim).toMatchObject({ kind: "TPA", policyNo: "P-1", claimedP: 500000, approvedP: 400000, status: "Approved", date: "2026-11-26" });
  });
  it("rejects bad input with a plain reason", () => {
    expect(buildClaim({ claimed: "100" }, "C", now).ok).toBe(false);
    expect(ok({ claimed: "0" }).error).toMatch(/amount claimed/);
    expect(ok({ claimed: "abc" }).ok).toBe(false);
    expect(ok({ approved: "9000" }).error).toMatch(/approved amount/);
    expect(ok({ approved: "1000", settled: "2000" }).error).toMatch(/settled/);
    expect(ok({ status: "Settled" }).error).toMatch(/settled/);
    expect(ok({ status: "Approved" }).error).toMatch(/approved/);
    expect(ok({ date: "2027-01-01" }).error).toMatch(/future/);
    expect(ok({ date: "nope" }).ok).toBe(false);
  });
  it("falls back on unknown kind and status, and trims long text", () => {
    const r = ok({ kind: "x", status: "y", notes: "n".repeat(900) });
    expect(r.claim.kind).toBe("Insurance");
    expect(r.claim.status).toBe("Pre-auth requested");
    expect(r.claim.notes.length).toBe(500);
  });
});
describe("outstanding and summary", () => {
  const settled = ok({ approved: "4000", settled: "4000", status: "Settled" }).claim;
  const approved = ok({ approved: "4000", settled: "1000", status: "Approved" }).claim;
  const rejected = { ...ok({}).claim, id: "C3", status: "Rejected" };
  const pending = { ...ok({ claimed: "2000" }).claim, id: "C4" };
  it("computes what is still owed", () => {
    expect(claimOutstandingP(settled)).toBe(0);
    expect(claimOutstandingP(rejected)).toBe(0);
    expect(claimOutstandingP(approved)).toBe(300000);
    expect(claimOutstandingP(pending)).toBe(200000);
    expect(claimOutstandingP(null)).toBe(0);
  });
  it("adds, updates, removes and summarises across patients", () => {
    let p = addClaim({ id: "P1", name: "Asha" }, approved);
    p = updateClaim(p, { ...approved, status: "Settled", settledP: 400000 });
    expect(claimsOf(p)[0].status).toBe("Settled");
    const q = addClaim(addClaim({ id: "P2", name: "Ravi" }, rejected), pending);
    const s = claimsSummary([p, q, { id: "P3" }]);
    expect(s).toMatchObject({ open: 1, rejected: 1, outstandingP: 200000, settledP: 400000 });
    expect(s.rows.length).toBe(3);
    expect(claimsOf(removeClaim(q, "C3")).length).toBe(1);
  });
});
