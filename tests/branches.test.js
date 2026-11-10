import { describe, it, expect } from "vitest";
import { branchesOf, inBranch, filterByBranch, writeBranchId, addBranch, renameBranch, removeBranch, branchUsage, branchSummary, tagBranch } from "../src/branches.js";

const two = [{ id: "main", name: "Main branch" }, { id: "b2", name: "Peelamedu" }];
const now = new Date(2026, 10, 11, 12);

describe("branches", () => {
  it("falls back to one main branch", () => {
    expect(branchesOf({})).toEqual([{ id: "main", name: "Main branch" }]);
    expect(branchesOf({ branches: [{ id: "x", name: " " }] })[0].id).toBe("main");
    expect(branchesOf({ branches: two })).toEqual(two);
  });
  it("treats untagged records as main and filters", () => {
    const items = [{ id: 1 }, { id: 2, branchId: "b2" }, { id: 3, branchId: "main" }];
    expect(filterByBranch(items, "main").map((i) => i.id)).toEqual([1, 3]);
    expect(filterByBranch(items, "b2").map((i) => i.id)).toEqual([2]);
    expect(filterByBranch(items, "all")).toBe(items);
    expect(inBranch({}, "main")).toBe(true);
  });
  it("writes to the viewed branch, or the first when viewing all", () => {
    expect(writeBranchId(two, "b2")).toBe("b2");
    expect(writeBranchId(two, "all")).toBe("main");
    expect(writeBranchId(two, "gone")).toBe("main");
    expect(tagBranch({ a: 1 }, "b2")).toEqual({ a: 1, branchId: "b2" });
  });
  it("adds and renames with validation", () => {
    expect(addBranch(two, "  ", "x").ok).toBe(false);
    expect(addBranch(two, "peelamedu", "x").ok).toBe(false);
    expect(addBranch(two, "RS Puram", "b3").branches).toHaveLength(3);
    expect(addBranch(Array.from({ length: 10 }, (_, i) => ({ id: "i" + i, name: "B" + i })), "More", "z").ok).toBe(false);
    expect(renameBranch(two, "b2", "Saibaba Colony").branches[1].name).toBe("Saibaba Colony");
    expect(renameBranch(two, "b2", "Main branch").ok).toBe(false);
    expect(renameBranch(two, "b2", "Peelamedu").ok).toBe(true);
  });
  it("refuses to remove the last branch or one that has records", () => {
    const data = { patients: [{ id: 1, branchId: "b2" }], appointments: [], invoices: [], queue: [] };
    expect(removeBranch([two[0]], "main", data).ok).toBe(false);
    expect(removeBranch(two, "b2", data).error).toMatch(/1 records/);
    expect(branchUsage("main", data)).toBe(0);
    expect(removeBranch(two, "main", data).branches).toEqual([two[1]]);
  });
  it("summarises each branch", () => {
    const s = branchSummary(two, {
      patients: [{ id: 1 }, { id: 2, branchId: "b2" }, { id: 3, branchId: "b2" }],
      appointments: [{ date: "2026-11-11", status: "Confirmed", branchId: "b2" }, { date: "2026-11-11", status: "Cancelled", branchId: "b2" }, { date: "2026-11-10", status: "Confirmed" }],
      invoices: [{ date: "05/11/2026", totalP: 100000, branchId: "b2" }, { date: "05/10/2026", totalP: 999, branchId: "b2" }, { date: "01/11/2026", totalP: 50000 }],
    }, now);
    expect(s[0]).toMatchObject({ name: "Main branch", patients: 1, todayAppointments: 0, billedThisMonthP: 50000 });
    expect(s[1]).toMatchObject({ patients: 2, todayAppointments: 1, billedThisMonthP: 100000 });
  });
});

import { transferPatient, recordsOfPatient } from "../src/branches.js";
describe("moving a patient between branches", () => {
  const branches = [{ id: "main", name: "Main" }, { id: "B2", name: "Peelamedu" }];
  const data = {
    patients: [{ id: "p1", name: "Asha" }, { id: "p2", name: "Ravi" }, { id: "p3", name: "Ravi" }],
    appointments: [{ id: "a1", patientId: "p1" }, { id: "a2", patientName: "Asha" }, { id: "a3", patientId: "p2" }, { id: "a4", patientName: "Ravi" }],
    invoices: [{ id: "i1", patientId: "p1" }, { id: "i2", patient: "Asha" }, { id: "i3", patientId: "p2" }],
  };
  it("moves the patient with linked and uniquely-named records, and nothing else", () => {
    const r = transferPatient("p1", "B2", branches, data);
    expect(r.ok).toBe(true);
    expect(r.counts).toEqual({ appointments: 2, invoices: 2 });
    expect(r.patients.find((p) => p.id === "p1").branchId).toBe("B2");
    expect(r.patients.find((p) => p.id === "p2").branchId).toBeUndefined();
    expect(r.appointments.filter((a) => a.branchId === "B2").map((a) => a.id)).toEqual(["a1", "a2"]);
    expect(r.invoices.filter((i) => i.branchId === "B2").map((i) => i.id)).toEqual(["i1", "i2"]);
  });
  it("does not guess by name when two patients share it", () => {
    expect(recordsOfPatient(data.patients[1], data).appointments.map((a) => a.id)).toEqual(["a3"]);
  });
  it("refuses a missing patient, unknown branch, or the same branch", () => {
    expect(transferPatient("zz", "B2", branches, data).ok).toBe(false);
    expect(transferPatient("p1", "nope", branches, data).ok).toBe(false);
    expect(transferPatient("p1", "main", branches, data).ok).toBe(false);
  });
});
