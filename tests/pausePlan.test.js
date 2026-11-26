import crypto from "node:crypto";
import { describe, it, expect, vi } from "vitest";
import { pausePlan, resumePlan, setPlan, getPlan } from "../api/_lib/planCore.js";
import { planStatus } from "../src/plan.js";
import { buildOverview } from "../api/_lib/overviewCore.js";

const DAY = 86400000;
const { privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });
const sa = { client_email: "s@p.iam.gserviceaccount.com", private_key: privateKey, project_id: "proj" };
const fake = () => {
  const store = new Map();
  const fetchFn = vi.fn(async (url, init = {}) => {
    const u = String(url);
    if (u.includes("oauth2")) return { ok: true, status: 200, json: async () => ({ access_token: "t" }) };
    const id = decodeURIComponent(u.split("/plans/")[1] || "");
    if (init.method === "PATCH") { store.set(id, JSON.parse(init.body).fields); return { ok: true, status: 200, json: async () => ({}) }; }
    if (!store.has(id)) return { ok: false, status: 404, json: async () => ({}) };
    return { ok: true, status: 200, json: async () => ({ fields: store.get(id) }) };
  });
  return { fetchFn, store };
};

describe("pause and start subscription", () => {
  it("keeps the days left on pause and gives them back from today on start", async () => {
    const { fetchFn } = fake(); const t0 = 1e12;
    await setPlan({ sa, uid: "uidClinic1", plan: "pro", days: 30, fetchFn, now: t0 });
    const p = await pausePlan({ sa, uid: "uidClinic1", fetchFn, now: t0 + 10 * DAY });
    expect(p).toMatchObject({ paused: true, pausedRemaining: 20 * DAY });
    expect(await getPlan({ sa, uid: "uidClinic1", fetchFn, now: t0 + 40 * DAY })).toMatchObject({ plan: "pro", paused: true, pausedRemaining: 20 * DAY });
    const r = await resumePlan({ sa, uid: "uidClinic1", fetchFn, now: t0 + 50 * DAY });
    expect(r.paidUntil).toBe(t0 + 70 * DAY);
    expect(await getPlan({ sa, uid: "uidClinic1", fetchFn, now: t0 + 50 * DAY })).toEqual({ plan: "pro", paidUntil: t0 + 70 * DAY });
  });
  it("refuses a second pause, a pause with nothing left, a start when not paused, and adding days while paused", async () => {
    const { fetchFn } = fake(); const t0 = 1e12;
    await expect(pausePlan({ sa, uid: "uidClinic1", fetchFn, now: t0 })).rejects.toThrow("nothing_to_pause");
    await expect(resumePlan({ sa, uid: "uidClinic1", fetchFn, now: t0 })).rejects.toThrow("not_paused");
    await setPlan({ sa, uid: "uidClinic1", plan: "standard", days: 5, fetchFn, now: t0 });
    await pausePlan({ sa, uid: "uidClinic1", fetchFn, now: t0 });
    await expect(pausePlan({ sa, uid: "uidClinic1", fetchFn, now: t0 })).rejects.toThrow("already_paused");
    await expect(setPlan({ sa, uid: "uidClinic1", plan: "standard", days: 5, fetchFn, now: t0 })).rejects.toThrow("paused");
  });
  it("planStatus shows paused with the days kept", () => {
    expect(planStatus({ live: true, paused: true, pausedRemaining: 10 * DAY, plan: "pro", paidUntil: 1 })).toMatchObject({ state: "paused", plan: "pro", daysLeft: 10 });
  });
  it("overview marks a paused clinic and does not count it as paid", () => {
    const o = buildOverview({ users: [{ uid: "u1", email: "a@x.com" }], plans: [{ id: "u1", plan: "pro", paidUntil: 5, pausedRemaining: 3 * DAY }], presence: [], requests: [], now: 100 });
    expect(o.clinics[0].state).toBe("paused");
    expect(o.billing.paidActive).toBe(0);
  });
});

import { signedInFor } from "../src/components/AdminDashboard.jsx";
describe("signed-in time", () => {
  const now = Date.parse("2026-11-27T10:00:00Z");
  it("shows how long the account has been signed in", () => {
    const at = (min) => ({ metadata: { lastSignInTime: new Date(now - min * 60000).toUTCString() } });
    expect(signedInFor(at(0), now)).toBe("just now");
    expect(signedInFor(at(42), now)).toBe("42m");
    expect(signedInFor(at(135), now)).toBe("2h 15m");
    expect(signedInFor(at(3000), now)).toBe("2d 2h");
    expect(signedInFor({}, now)).toBe("");
  });
});
