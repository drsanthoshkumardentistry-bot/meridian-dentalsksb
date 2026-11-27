import crypto from "node:crypto";
import { describe, it, expect, vi } from "vitest";
import { logAction, listLog, getNote, setNote } from "../api/_lib/auditCore.js";
import { insightsOf } from "../src/components/Insights.jsx";
import { actionLabel, when } from "../src/components/FounderLog.jsx";

const DAY = 86400000;
const { privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });
const sa = { client_email: "s@p.iam.gserviceaccount.com", private_key: privateKey, project_id: "proj" };
const fake = () => {
  const docs = new Map();
  const fetchFn = vi.fn(async (url, init = {}) => {
    const u = String(url);
    if (u.includes("oauth2")) return { ok: true, status: 200, json: async () => ({ access_token: "t" }) };
    const path = u.split("/documents/")[1] || "";
    if (init.method === "PATCH") { docs.set(path, JSON.parse(init.body).fields); return { ok: true, status: 200, json: async () => ({}) }; }
    const [col] = path.split("?");
    if (!col.includes("/")) return { ok: true, status: 200, json: async () => ({ documents: [...docs].filter(([k]) => k.startsWith(col + "/")).map(([k, f]) => ({ name: `x/${k}`, fields: f })) }) };
    return docs.has(col) ? { ok: true, status: 200, json: async () => ({ fields: docs.get(col) }) } : { ok: false, status: 404, json: async () => ({}) };
  });
  return { fetchFn, docs };
};

describe("action log", () => {
  it("writes lines and lists them newest first without throwing on failure", async () => {
    const { fetchFn } = fake();
    await logAction({ sa, actor: "boss@x.com", action: "suspend", target: "a@x.com", fetchFn, now: 1000 });
    await logAction({ sa, actor: "boss@x.com", action: "plan", target: "b@x.com", detail: "pro, 30 days", fetchFn, now: 2000 });
    const rows = await listLog({ sa, fetchFn });
    expect(rows.map((r) => r.action)).toEqual(["plan", "suspend"]);
    expect(rows[0]).toMatchObject({ target: "b@x.com", detail: "pro, 30 days", actor: "boss@x.com" });
    const bad = vi.fn(async () => { throw new Error("down"); });
    expect(await logAction({ sa, actor: "a", action: "x", fetchFn: bad })).toBe(false);
    expect(await logAction({ sa: null, actor: "a", action: "x" })).toBe(false);
  });
  it("labels and dates entries", () => {
    expect(actionLabel("pause_subscription")).toBe("Paused subscription");
    expect(actionLabel("zzz")).toBe("zzz");
    expect(when(1000, 1000 + 5 * 60000)).toBe("5 min ago");
    expect(when(1000, 1000 + 3 * 3600000)).toBe("3 h ago");
  });
});

describe("clinic notes on the account", () => {
  it("saves and reads a note, trimmed to 2000 characters", async () => {
    const { fetchFn } = fake();
    expect(await getNote({ sa, uid: "uidClinic1", fetchFn })).toEqual({ note: "", updatedAt: 0 });
    await setNote({ sa, uid: "uidClinic1", note: "x".repeat(2500), fetchFn, now: 5 });
    const n = await getNote({ sa, uid: "uidClinic1", fetchFn });
    expect(n.note.length).toBe(2000);
    expect(n.updatedAt).toBe(5);
    await expect(setNote({ sa, uid: "../bad", note: "a", fetchFn })).rejects.toThrow("uid");
  });
});

describe("revenue and risk", () => {
  const now = 1e12;
  const c = (o) => ({ uid: o.email, email: o.email, state: "unpaid", plan: "", paidUntil: 0, created: now - 40 * DAY, lastLogin: now - DAY, weekMin: 10, suspended: false, ...o });
  it("works out revenue, plan mix and who needs a call", () => {
    const clinics = [
      c({ email: "a@x", state: "paid", plan: "standard", paidUntil: now + 3 * DAY, weekMin: 0 }),
      c({ email: "b@x", state: "paid", plan: "pro", paidUntil: now + 40 * DAY }),
      c({ email: "t@x", created: now - 26 * DAY }),
      c({ email: "n@x", created: now - 10 * DAY, lastLogin: 0, weekMin: 0 }),
    ];
    const i = insightsOf(clinics, now);
    expect(i.mrr).toBe(499 + 999);
    expect(i.arr).toBe((499 + 999) * 12);
    expect(i.conversion).toBe(50);
    expect(i.byPlan.find((p) => p.id === "pro").count).toBe(1);
    expect(i.quiet.map((x) => x.email)).toEqual(["a@x"]);
    expect(i.endingSoon.map((x) => x.email)).toEqual(["a@x"]);
    expect(i.trialEnding.map((x) => x.email)).toEqual(["t@x"]);
    expect(i.neverUsed.map((x) => x.email)).toEqual(["n@x"]);
  });
  it("handles an empty list", () => {
    expect(insightsOf([], now)).toMatchObject({ mrr: 0, avg: 0, conversion: 0, paidCount: 0 });
  });
});
