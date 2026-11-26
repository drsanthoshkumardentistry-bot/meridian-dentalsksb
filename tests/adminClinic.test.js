import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({ lookup: null, uid: "uidC", blocked: [], paused: [], fail: "" }));
vi.mock("../api/_lib/loginAlertCore.js", () => ({ lookupUser: async () => h.lookup }));
vi.mock("../api/_lib/blockCore.js", () => ({ readServiceAccount: () => ({ project_id: "p" }), setBlocked: async (_sa, uid, b) => { h.blocked.push([uid, b]); return true; } }));
vi.mock("../api/_lib/planCore.js", () => ({
  uidByEmail: async ({ email }) => (email === "none@x.com" ? "" : h.uid),
  pausePlan: async ({ uid }) => { if (h.fail) throw new Error(h.fail); h.paused.push(["pause", uid]); return { plan: "pro", paidUntil: 1, paused: true, pausedRemaining: 5 }; },
  resumePlan: async ({ uid }) => { if (h.fail) throw new Error(h.fail); h.paused.push(["resume", uid]); return { plan: "pro", paidUntil: 9 }; },
}));
import handler from "../api/admin-clinic.js";

const jwt = (age) => `h.${Buffer.from(JSON.stringify({ auth_time: Math.floor(Date.now() / 1000) - age })).toString("base64url")}.s`;
const call = async (body, { token = jwt(10), method = "POST" } = {}) => {
  const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = b; } };
  await handler({ method, headers: { authorization: `Bearer ${token}` }, body }, res);
  return { status: res.statusCode, body: JSON.parse(res.body) };
};
beforeEach(() => { process.env.FOUNDER_EMAILS = "boss@x.com"; h.lookup = { uid: "uidBoss", email: "boss@x.com" }; h.blocked = []; h.paused = []; h.fail = ""; });

describe("admin-clinic", () => {
  it("only founders with a fresh sign-in may suspend", async () => {
    h.lookup = { uid: "u2", email: "clinic@x.com" };
    expect((await call({ email: "a@x.com", action: "suspend" })).status).toBe(403);
    h.lookup = { uid: "uidBoss", email: "boss@x.com" };
    expect((await call({ email: "a@x.com", action: "suspend" }, { token: jwt(3 * 3600) })).status).toBe(401);
    expect(h.blocked).toEqual([]);
  });
  it("suspends and resumes a clinic", async () => {
    expect((await call({ email: "A@x.com", action: "suspend" })).body).toEqual({ email: "a@x.com", suspended: true });
    expect((await call({ email: "a@x.com", action: "resume" })).body.suspended).toBe(false);
    expect(h.blocked).toEqual([["uidC", true], ["uidC", false]]);
  });
  it("refuses founders, yourself, unknown emails and bad actions", async () => {
    expect((await call({ email: "boss@x.com", action: "suspend" })).status).toBe(400);
    h.uid = "uidBoss"; expect((await call({ email: "me@x.com", action: "suspend" })).status).toBe(400); h.uid = "uidC";
    expect((await call({ email: "none@x.com", action: "suspend" })).status).toBe(404);
    expect((await call({ email: "a@x.com", action: "delete" })).status).toBe(400);
    expect(h.blocked).toEqual([]);
  });
  it("pauses and starts a subscription without touching sign-in", async () => {
    expect((await call({ email: "a@x.com", action: "pause_subscription" })).body.paused).toBe(true);
    expect((await call({ email: "a@x.com", action: "resume_subscription" })).body.paidUntil).toBe(9);
    expect(h.paused).toEqual([["pause", "uidC"], ["resume", "uidC"]]);
    expect(h.blocked).toEqual([]);
  });
  it("explains why a pause cannot happen", async () => {
    h.fail = "already_paused";
    const r = await call({ email: "a@x.com", action: "pause_subscription" });
    expect(r.status).toBe(400); expect(r.body.error).toMatch(/already paused/);
    h.lookup = { uid: "u2", email: "clinic@x.com" };
    expect((await call({ email: "a@x.com", action: "pause_subscription" })).status).toBe(403);
  });
});
