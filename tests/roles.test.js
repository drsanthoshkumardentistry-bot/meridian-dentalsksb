import { describe, it, expect } from "vitest";
import { accessOf, canRead, canWrite, navFor, firstScreen, branchScope, NAV_BY_ROLE } from "../src/roles.js";
import { validateInvite, buildInvite, isActiveMember, isPendingInvite, inviteMessage, normalizeEmail } from "../src/team.js";
import { scopeToBranches, writeBranchId } from "../src/branches.js";

describe("roles", () => {
  it("gives each role the right access", () => {
    expect(canWrite("receptionist", "invoices")).toBe(true);
    expect(canWrite("dentist", "invoices")).toBe(false);
    expect(canRead("dentist", "invoices")).toBe(true);
    expect(canRead("receptionist", "employees")).toBe(false);
    expect(canWrite("manager", "employees")).toBe(true);
    expect(canWrite("owner", "profile")).toBe(true);
    expect(accessOf("unknown", "patients")).toBe("");
  });
  it("limits the menu by role and never lets staff reach Connect", () => {
    const items = ["Dashboard", "Billing & Invoices", "MeriDent Connect", "Reports", "Practice Profile", "Appointments Diary", "Patients & Odontogram"].map((label) => ({ label }));
    expect(navFor("owner", items)).toHaveLength(items.length);
    expect(navFor("dentist", items).map((i) => i.label)).toEqual(["Dashboard", "Appointments Diary", "Patients & Odontogram"]);
    expect(navFor("receptionist", items).map((i) => i.label)).toContain("Billing & Invoices");
    expect(navFor("manager", items).map((i) => i.label)).not.toContain("MeriDent Connect");
    expect(navFor("nobody", items)).toEqual([]);
    Object.values(NAV_BY_ROLE).filter(Boolean).forEach((n) => expect(n).not.toContain("MeriDent Connect"));
    expect(firstScreen("dentist")).toBe("Patients & Odontogram");
  });
  it("scopes records to assigned branches", () => {
    expect(branchScope({ branchIds: ["b2"] })).toEqual(["b2"]);
    expect(branchScope({ branchIds: [] })).toBeNull();
    expect(branchScope(null)).toBeNull();
    const items = [{ id: 1 }, { id: 2, branchId: "b2" }, { id: 3, branchId: "b3" }];
    expect(scopeToBranches(items, ["b2"]).map((i) => i.id)).toEqual([2]);
    expect(scopeToBranches(items, ["main", "b3"]).map((i) => i.id)).toEqual([1, 3]);
    expect(scopeToBranches(items, null)).toBe(items);
    expect(writeBranchId([], "all")).toBe("main");
  });
});

describe("team invitations", () => {
  const ids = ["main", "b2"];
  it("validates the invite", () => {
    expect(validateInvite({ email: "bad", role: "dentist" }, [], "o@x.com", ids).ok).toBe(false);
    expect(validateInvite({ email: "O@x.com", role: "dentist" }, [], "o@x.com", ids).error).toMatch(/own login/);
    expect(validateInvite({ email: "a@x.com", role: "owner" }, [], "o@x.com", ids).ok).toBe(false);
    expect(validateInvite({ email: "A@x.com", role: "dentist" }, [{ email: "a@x.com" }], "o@x.com", ids).error).toMatch(/already/);
    expect(validateInvite({ email: "a@x.com", role: "dentist", branchIds: ["zzz"] }, [], "o@x.com", ids).ok).toBe(false);
    const ok = validateInvite({ email: "  A@X.com ", role: "receptionist", branchIds: ["b2", "b2"] }, [], "o@x.com", ids);
    expect(ok).toMatchObject({ ok: true, email: "a@x.com", branchIds: ["b2"] });
  });
  it("builds an invitation that must be accepted first", () => {
    const inv = buildInvite({ email: "a@x.com", role: "dentist", branchIds: [] }, { clinicId: "c1", clinicName: "Smile", ownerEmail: "O@x.com" }, new Date(2026, 10, 11));
    expect(inv).toMatchObject({ clinicId: "c1", status: "invited", active: true, invitedBy: "o@x.com" });
    expect(isPendingInvite(inv)).toBe(true);
    expect(isActiveMember(inv)).toBe(false);
    expect(isActiveMember({ ...inv, status: "active" })).toBe(true);
    expect(isActiveMember({ ...inv, status: "active", active: false })).toBe(false);
    expect(isActiveMember(null)).toBe(false);
    expect(inviteMessage(inv, "https://x.com/")).toContain("a@x.com");
    expect(normalizeEmail(" A@B.com ")).toBe("a@b.com");
  });
});
