import { normalizeInvoice } from "./billing.js";
import { parseAnyDate, dateKey } from "./reminders.js";

export const MAIN_ID = "main";
export const MAX_BRANCHES = 10;
export const defaultBranches = () => [{ id: MAIN_ID, name: "Main branch" }];

/** The clinic's branches, falling back to a single main branch. */
export const branchesOf = (profile) => {
  const list = Array.isArray(profile?.branches) ? profile.branches.filter((b) => b && b.id && String(b.name || "").trim()) : [];
  return list.length ? list : defaultBranches();
};

/** Records saved before branches existed belong to the main branch. */
export const inBranch = (item, branchId) => branchId === "all" || (item?.branchId || MAIN_ID) === branchId;
export const filterByBranch = (items = [], branchId = "all") => (branchId === "all" ? items : items.filter((i) => inBranch(i, branchId)));

/** New records go to the branch being viewed; "All branches" writes to the first branch. */
export const writeBranchId = (branches, active) => (branches.some((b) => b.id === active) ? active : branches[0]?.id ?? MAIN_ID);

/** Limit records to a member's assigned branches (null = no limit). */
export const scopeToBranches = (items = [], allowed = null) => (allowed ? items.filter((i) => allowed.includes(i?.branchId || MAIN_ID)) : items);
export const tagBranch = (item, branchId) => ({ ...item, branchId });

const cleanName = (n) => String(n || "").trim().replace(/\s+/g, " ").slice(0, 40);
const dup = (branches, name, exceptId) => branches.some((b) => b.id !== exceptId && b.name.toLowerCase() === name.toLowerCase());

export const addBranch = (branches, name, id) => {
  const n = cleanName(name);
  if (!n) return { ok: false, error: "Enter a branch name" };
  if (branches.length >= MAX_BRANCHES) return { ok: false, error: `You can add up to ${MAX_BRANCHES} branches` };
  if (dup(branches, n)) return { ok: false, error: "A branch with this name already exists" };
  return { ok: true, branches: [...branches, { id, name: n }] };
};

export const renameBranch = (branches, id, name) => {
  const n = cleanName(name);
  if (!n) return { ok: false, error: "Enter a branch name" };
  if (dup(branches, n, id)) return { ok: false, error: "A branch with this name already exists" };
  return { ok: true, branches: branches.map((b) => (b.id === id ? { ...b, name: n } : b)) };
};

export const branchUsage = (id, data = {}) =>
  ["patients", "appointments", "invoices", "queue"].reduce((s, k) => s + (data[k] || []).filter((i) => inBranch(i, id)).length, 0);

/** A branch with records cannot be removed, so no patient or invoice is ever orphaned. */
export const removeBranch = (branches, id, data) => {
  if (branches.length <= 1) return { ok: false, error: "A clinic needs at least one branch" };
  const used = branchUsage(id, data);
  if (used > 0) return { ok: false, error: `This branch has ${used} records. Records cannot be moved yet, so it cannot be removed` };
  return { ok: true, branches: branches.filter((b) => b.id !== id) };
};

/** Side-by-side numbers for every branch. */
export const branchSummary = (branches, { patients = [], appointments = [], invoices = [] } = {}, now = new Date()) => {
  const today = dateKey(now);
  const month = now.getFullYear() * 12 + now.getMonth();
  return branches.map((b) => {
    const billed = invoices
      .filter((i) => inBranch(i, b.id))
      .map(normalizeInvoice)
      .filter((i) => {
        const d = parseAnyDate(i.date);
        return d && d.getFullYear() * 12 + d.getMonth() === month;
      })
      .reduce((s, i) => s + (i.totalP || 0), 0);
    return {
      id: b.id,
      name: b.name,
      patients: patients.filter((p) => inBranch(p, b.id)).length,
      todayAppointments: appointments.filter((a) => inBranch(a, b.id) && a.date === today && a.status !== "Cancelled").length,
      billedThisMonthP: billed,
    };
  });
};
