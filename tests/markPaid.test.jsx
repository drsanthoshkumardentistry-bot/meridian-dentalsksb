import React from "react";
import crypto from "node:crypto";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { extendPaidUntil, getPlan, setPlan, uidByEmail } from "../api/_lib/planCore.js";
import myPlan from "../api/my-plan.js";
import adminPlan from "../api/admin-plan.js";
import { loadMyPlan, markPaid } from "../src/planApi.js";
import FounderCard from "../src/components/FounderCard.jsx";
import PlanCard from "../src/components/PlanCard.jsx";

afterEach(() => { cleanup(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
const DAY = 864e5;
const { privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });
const sa = { client_email: "s@p.iam.gserviceaccount.com", private_key: privateKey, project_id: "proj" };

// tiny fake Firestore + Identity
const fake = () => {
  const store = new Map(); const calls = [];
  const fetchFn = vi.fn(async (url, init = {}) => {
    const u = String(url); calls.push(u);
    if (u.includes("oauth2")) return { ok: true, status: 200, json: async () => ({ access_token: "t" }) };
    if (u.includes("accounts:lookup")) { const e = JSON.parse(init.body).email[0]; return { ok: true, status: 200, json: async () => ({ users: e === "clinic@x.com" ? [{ localId: "uidClinic1" }] : [] }) }; }
    const id = decodeURIComponent(u.split("/plans/")[1] || "");
    if (init.method === "PATCH") { store.set(id, JSON.parse(init.body).fields); return { ok: true, status: 200, json: async () => ({}) }; }
    if (!store.has(id)) return { ok: false, status: 404, json: async () => ({}) };
    return { ok: true, status: 200, json: async () => ({ fields: store.get(id) }) };
  });
  return { fetchFn, store, calls };
};

describe("planCore", () => {
  it("extends from now, or from the end of time already paid", () => {
    expect(extendPaidUntil(0, 30, 1000)).toBe(1000 + 30 * DAY);
    expect(extendPaidUntil(1000 + 10 * DAY, 30, 1000)).toBe(1000 + 40 * DAY);
    expect(extendPaidUntil(500, 30, 1000)).toBe(1000 + 30 * DAY);
    for (const d of [0, -1, 801, NaN, "x", null, undefined]) expect(() => extendPaidUntil(0, d)).toThrow();
  });
  it("saves, reads back, and stacks a second payment", async () => {
    const { fetchFn } = fake(); const now = 1e12;
    const a = await setPlan({ sa, uid: "uidClinic1", plan: "standard", days: 30, email: "clinic@x.com", fetchFn, now });
    expect(a.paidUntil).toBe(now + 30 * DAY);
    expect(await getPlan({ sa, uid: "uidClinic1", fetchFn, now })).toEqual({ plan: "standard", paidUntil: now + 30 * DAY });
    expect((await setPlan({ sa, uid: "uidClinic1", plan: "pro", days: 30, fetchFn, now })).paidUntil).toBe(now + 60 * DAY);
    expect(await getPlan({ sa, uid: "nobodyHere1", fetchFn, now })).toEqual({ plan: "", paidUntil: 0 });
  });
  it("rejects bad ids and plans before any network call", async () => {
    const { fetchFn } = fake();
    for (const uid of ["", "a/b", "../x", null, 5, "x".repeat(200)]) await expect(setPlan({ sa, uid, plan: "standard", days: 30, fetchFn })).rejects.toThrow();
    await expect(setPlan({ sa, uid: "uidClinic1", plan: "gold", days: 30, fetchFn })).rejects.toThrow("plan");
    expect(fetchFn).not.toHaveBeenCalled();
  });
  it("finds accounts by email and refuses junk emails", async () => {
    const { fetchFn } = fake();
    expect(await uidByEmail({ sa, email: " Clinic@X.com ", fetchFn })).toBe("uidClinic1");
    expect(await uidByEmail({ sa, email: "nobody@x.com", fetchFn })).toBe("");
    for (const e of ["", "x", null, "a b@c.com", "a@@b"]) expect(await uidByEmail({ sa, email: e, fetchFn })).toBe("");
  });
});

const call = async (handler, { method, headers = {}, body }) => { const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = JSON.parse(b); } }; await handler({ method, headers, body }, res); return res; };
const stubIdentity = (email) => vi.stubGlobal("fetch", vi.fn(async (u) => (String(u).includes("accounts:lookup?key=") ? { ok: true, json: async () => ({ users: [{ localId: "callerUid1", email, emailVerified: true }] }) } : { ok: false, status: 500, json: async () => ({}) })));

describe("endpoints", () => {
  it("admin-plan: 401 without sign-in, 403 for non-founders, never touches Firestore for them", async () => {
    vi.stubEnv("VITE_FIREBASE_API_KEY", "k"); vi.stubEnv("FOUNDER_EMAILS", "boss@x.com");
    expect((await call(adminPlan, { method: "POST", body: {} })).statusCode).toBe(401);
    stubIdentity("other@x.com");
    const r = await call(adminPlan, { method: "POST", headers: { authorization: "Bearer t" }, body: { email: "clinic@x.com", plan: "pro", days: 30 } });
    expect(r.statusCode).toBe(403);
    expect(fetch.mock.calls.every(([u]) => String(u).includes("accounts:lookup"))).toBe(true);
    expect((await call(adminPlan, { method: "GET", headers: {} })).statusCode).toBe(405);
  });
  it("my-plan: needs sign-in and is GET only", async () => {
    expect((await call(myPlan, { method: "GET" })).statusCode).toBe(401);
    expect((await call(myPlan, { method: "POST" })).statusCode).toBe(405);
  });
});

describe("client", () => {
  it("loadMyPlan never throws and treats failures as unpaid", async () => {
    const bad = { plan: "", paidUntil: 0 };
    expect(await loadMyPlan({ getToken: async () => "t", fetchFn: async () => ({ ok: false }) })).toEqual(bad);
    expect(await loadMyPlan({ getToken: async () => "t", fetchFn: async () => { throw new Error("x"); } })).toEqual(bad);
    expect(await loadMyPlan({ getToken: async () => { throw new Error("no"); }, fetchFn: async () => ({}) })).toEqual(bad);
    expect(await loadMyPlan({ getToken: async () => "t", fetchFn: async () => ({ ok: true, json: async () => ({ plan: "pro", paidUntil: 5 }) }) })).toEqual({ plan: "pro", paidUntil: 5 });
    expect((await loadMyPlan({ getToken: async () => "t", fetchFn: async () => ({ ok: true, json: async () => ({ plan: "<script>", paidUntil: "x" }) }) })).plan).toBe("");
  });
  it("markPaid shows the server's message on failure", async () => {
    await expect(markPaid({ email: "a@b.c", plan: "pro", days: 30 }, { getToken: async () => "t", fetchFn: async () => ({ ok: false, json: async () => ({ error: "No clinic account with that email." }) }) })).rejects.toThrow("No clinic account");
  });
  it("founder form saves and reports the new date", async () => {
    const payFn = vi.fn(async () => ({ plan: "pro", paidUntil: Date.UTC(2027, 0, 5) }));
    const stats = { total: 1, newLast7: 0, newLast30: 0, activeLast7: 0, activeLast30: 0, quiet30: 0, weeks: Array.from({ length: 8 }, () => ({ signUps: 0 })), recent: [] };
    render(<FounderCard loadFn={async () => stats} payFn={payFn} />);
    fireEvent.change(await screen.findByLabelText("Clinic email"), { target: { value: "clinic@x.com" } });
    fireEvent.change(screen.getByLabelText("Plan"), { target: { value: "pro" } });
    fireEvent.change(screen.getByLabelText("Time paid for"), { target: { value: "90" } });
    fireEvent.click(screen.getByText("Save"));
    await waitFor(() => expect(screen.getByRole("status").textContent).toMatch(/Growth until/));
    expect(payFn).toHaveBeenCalledWith({ email: "clinic@x.com", plan: "pro", days: 90 });
  });
  it("plan card shows paid time when the server says so, even while pricing is off it stays free", async () => {
    render(<PlanCard clinic="Smile" loadFn={async () => ({ plan: "pro", paidUntil: Date.now() + 5 * DAY })} />);
    expect(screen.getByTestId("plan-card").textContent).toMatch(/trial run/); // PRICING_LIVE is false
  });
});
