/* ==============================================================================
 * MERIDENT OS - MULTI-BRANCH COMPARISON (pure functions, no React)
 * One month, every branch side by side. Amounts are in paise.
 * ============================================================================== */

import { MAIN_ID, inBranch } from "./branches.js";
import { normalizeInvoice, balancePaise } from "./billing.js";
import { parseAnyDate } from "./reminders.js";
import { currentMonthKey, toCsv } from "./reports.js";

const pad = (n) => String(n).padStart(2, "0");
const ymOf = (date) => (date ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}` : "");
const noShow = (a) => /^no[ -]?show$/i.test(String(a.status || "").trim());
const done = (a) => String(a.status || "").trim().toLowerCase() === "completed";

const rowFor = (branch, { patients, appointments, invoices }, ym) => {
  const invs = invoices.filter((i) => inBranch(i, branch.id)).map(normalizeInvoice);
  const appts = appointments.filter((a) => inBranch(a, branch.id) && ymOf(parseAnyDate(a.date)) === ym);
  const collectedP = invs.reduce((s, inv) => s + (inv.payments || []).filter((p) => ymOf(parseAnyDate(p.date)) === ym).reduce((t, p) => t + (p.amountP || 0), 0), 0);
  const billedP = invs.filter((i) => ymOf(parseAnyDate(i.date)) === ym).reduce((s, i) => s + (i.totalP || 0), 0);
  const outstandingP = invs.reduce((s, i) => s + balancePaise(i), 0);
  const completed = appts.filter(done).length;
  const noShows = appts.filter(noShow).length;
  const booked = appts.filter((a) => !/^cancel/i.test(String(a.status || ""))).length;
  return {
    id: branch.id,
    name: branch.name,
    collectedP,
    billedP,
    outstandingP,
    completedVisits: completed,
    noShows,
    noShowRate: booked ? Math.round((noShows / booked) * 100) : 0,
    newPatients: patients.filter((p) => inBranch(p, branch.id) && ymOf(parseAnyDate(p.registeredDate)) === ym).length,
    perVisitP: completed ? Math.round(collectedP / completed) : 0,
  };
};

/** Rows for every branch plus a total, and each branch's share of the money received. */
export const branchComparison = (branches = [], data = {}, ym = currentMonthKey()) => {
  const d = { patients: data.patients || [], appointments: data.appointments || [], invoices: data.invoices || [] };
  const list = branches.length ? branches : [{ id: MAIN_ID, name: "Main branch" }];
  const rows = list.map((b) => rowFor(b, d, ym));
  const sum = (k) => rows.reduce((s, r) => s + r[k], 0);
  const collectedP = sum("collectedP");
  const completedVisits = sum("completedVisits");
  const noShows = sum("noShows");
  const booked = noShows + completedVisits; // rate on outcomes already known
  const withShare = rows.map((r) => ({ ...r, sharePct: collectedP ? Math.round((r.collectedP / collectedP) * 100) : 0 }));
  const top = collectedP ? withShare.reduce((a, b) => (b.collectedP > a.collectedP ? b : a)) : null;
  return {
    rows: withShare,
    total: {
      collectedP, billedP: sum("billedP"), outstandingP: sum("outstandingP"), completedVisits, noShows, newPatients: sum("newPatients"),
      perVisitP: completedVisits ? Math.round(collectedP / completedVisits) : 0,
      noShowRate: booked ? Math.round((noShows / booked) * 100) : 0,
    },
    topBranchId: top ? top.id : null,
  };
};

const rupees = (p) => (p / 100).toFixed(2);

export const branchComparisonCsv = (cmp, ym) =>
  toCsv([
    ["Month", ym],
    [],
    ["Branch", "Received (Rs)", "Invoiced (Rs)", "Outstanding (Rs)", "Completed visits", "No shows", "No-show rate (%)", "New patients", "Received per visit (Rs)", "Share of received (%)"],
    ...cmp.rows.map((r) => [r.name, rupees(r.collectedP), rupees(r.billedP), rupees(r.outstandingP), r.completedVisits, r.noShows, r.noShowRate, r.newPatients, rupees(r.perVisitP), r.sharePct]),
    ["Total", rupees(cmp.total.collectedP), rupees(cmp.total.billedP), rupees(cmp.total.outstandingP), cmp.total.completedVisits, cmp.total.noShows, cmp.total.noShowRate, cmp.total.newPatients, rupees(cmp.total.perVisitP), cmp.total.collectedP ? 100 : 0],
  ]);
