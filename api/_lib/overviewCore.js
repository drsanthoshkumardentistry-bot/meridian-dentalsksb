// Everything the founder dashboard shows, built from sign-in accounts, presence, plans and requests. Pure and testable.
import { summarise } from "./adminCore.js";
import { summarisePresence } from "./presenceCore.js";
import { PLANS } from "../../src/plan.js";

const price = (id) => (PLANS.find((p) => p.id === id) || {}).monthly || 0;

export function buildOverview({ users, presence, plans, requests, now = Date.now() }) {
  const u = summarise(users, now);
  const pr = summarisePresence(presence, now);
  const ok = (a) => (Array.isArray(a) ? a : []).filter((x) => x && typeof x === "object");
  const planBy = new Map(ok(plans).map((p) => [p.id, p]));
  const reqBy = new Map(ok(requests).map((r) => [r.id, r]));
  const presBy = new Map(pr.rows.map((r) => [r.uid, r]));

  const clinics = ok(users).filter((x) => x.uid).map((x) => {
    const p = planBy.get(x.uid), r = reqBy.get(x.uid), s = presBy.get(x.uid);
    const paidUntil = p ? Number(p.paidUntil) || 0 : 0;
    return {
      uid: x.uid, email: String(x.email || "(no email)").slice(0, 120), created: Number(x.createdAt) || 0, lastLogin: Number(x.lastLoginAt) || 0,
      online: !!(s && s.online), todayMin: s ? s.todayMin : 0, weekMin: s ? s.weekMin : 0,
      plan: p && (p.plan === "pro" || p.plan === "standard") ? p.plan : "", paidUntil,
      state: paidUntil > now ? "paid" : paidUntil > 0 ? "expired" : "unpaid",
      request: r ? r.status || "" : "",
    };
  }).sort((a, b) => Number(b.online) - Number(a.online) || b.lastLogin - a.lastLogin).slice(0, 200);

  const paid = clinics.filter((c) => c.state === "paid");
  const reqs = ok(requests).map((r) => ({
    uid: r.id, email: String(r.email || "").slice(0, 120), clinic: String(r.clinic || "").slice(0, 80), plan: r.plan, yearly: !!r.yearly,
    status: r.status || "", createdAt: Number(r.createdAt) || 0, decidedAt: Number(r.decidedAt) || 0,
  })).sort((a, b) => (a.status === "pending" ? 0 : 1) - (b.status === "pending" ? 0 : 1) || b.createdAt - a.createdAt).slice(0, 60);

  return {
    users: u,
    presence: { onlineNow: pr.onlineNow, activeToday: pr.activeToday, hoursToday: pr.hoursToday, hoursWeek: pr.hoursWeek, dayTotals: pr.dayTotals },
    billing: {
      paidActive: paid.length,
      expired: clinics.filter((c) => c.state === "expired").length,
      pending: reqs.filter((r) => r.status === "pending").length,
      monthlyValue: paid.reduce((n, c) => n + price(c.plan), 0),
    },
    requests: reqs,
    clinics,
  };
}
