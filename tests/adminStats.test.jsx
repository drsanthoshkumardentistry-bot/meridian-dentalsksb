import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { summarise, isFounder, founderEmails } from "../api/_lib/adminCore.js";
import handler from "../api/admin-stats.js";
import FounderCard from "../src/components/FounderCard.jsx";
import { loadAdminStats } from "../src/adminStats.js";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllEnvs(); });
const DAY = 864e5;

describe("summarise", () => {
  it("counts sign-ups and activity", () => {
    const now = 1e12;
    const s = summarise([
      { email: "a@x.com", createdAt: String(now - 2 * DAY), lastLoginAt: String(now - DAY) },
      { email: "b@x.com", createdAt: String(now - 20 * DAY), lastLoginAt: String(now - 20 * DAY) },
      { email: "c@x.com", createdAt: String(now - 90 * DAY), lastLoginAt: String(now - 60 * DAY) },
    ], now);
    expect([s.total, s.newLast7, s.newLast30, s.activeLast7, s.activeLast30, s.quiet30]).toEqual([3, 1, 2, 1, 2, 1]);
    expect(s.weeks).toHaveLength(8);
    expect(s.recent[0].email).toBe("a@x.com");
  });
  it("survives junk", () => {
    for (const j of [null, undefined, 5, "x", [null, 1, {}, { email: 7, createdAt: "abc" }]]) expect(() => summarise(j)).not.toThrow();
    expect(summarise([null, {}]).total).toBe(1);
  });
});

describe("founder check", () => {
  it("matches listed emails only, ignoring case", () => {
    expect(founderEmails(" A@x.com, b@y.com ,")).toEqual(["a@x.com", "b@y.com"]);
    expect(isFounder("A@X.com", "a@x.com")).toBe(true);
    expect(isFounder("z@x.com", "a@x.com")).toBe(false);
    expect(isFounder("", "")).toBe(false);
    expect(isFounder("a@x.com", "")).toBe(false);
  });
});

const run = async (headers, env = {}) => {
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = JSON.parse(b); } };
  await handler({ method: "GET", headers }, res);
  return res;
};

describe("/api/admin-stats", () => {
  it("rejects missing sign-in, non-founders; never calls Firestore for them", async () => {
    vi.stubEnv("VITE_FIREBASE_API_KEY", "k");
    const f = vi.fn(async () => ({ ok: true, json: async () => ({ users: [{ localId: "u1", email: "other@x.com", emailVerified: true }] }) }));
    vi.stubGlobal("fetch", f);
    expect((await run({})).statusCode).toBe(401);
    const r = await run({ authorization: "Bearer t" }, { FOUNDER_EMAILS: "boss@x.com" });
    expect(r.statusCode).toBe(403);
    expect(f.mock.calls.every(([u]) => String(u).includes("accounts:lookup"))).toBe(true);
    vi.unstubAllGlobals();
  });
  it("says 405 for POST", async () => {
    const res = { headers: {}, setHeader() {}, end(b) { this.body = JSON.parse(b); } };
    await handler({ method: "POST", headers: {} }, res);
    expect(res.statusCode).toBe(405);
  });
});

describe("client", () => {
  it("returns null for 403 and data for 200", async () => {
    expect(await loadAdminStats({ getToken: async () => "t", fetchFn: async () => ({ status: 403, ok: false, json: async () => ({}) }) })).toBeNull();
    expect(await loadAdminStats({ getToken: async () => "t", fetchFn: async () => ({ status: 200, ok: true, json: async () => ({ total: 2 }) }) })).toEqual({ total: 2 });
    await expect(loadAdminStats({ getToken: async () => "t", fetchFn: async () => ({ status: 502, ok: false, json: async () => ({ error: "bad" }) }) })).rejects.toThrow("bad");
  });
});

describe("FounderCard", () => {
  it("renders nothing for non-founders", async () => {
    const loadFn = vi.fn(async () => null);
    const { container } = render(<FounderCard loadFn={loadFn} />);
    await waitFor(() => expect(loadFn).toHaveBeenCalled());
    expect(container.innerHTML).toBe("");
  });
  it("shows numbers for the founder", async () => {
    const stats = { total: 4, newLast7: 1, newLast30: 2, activeLast7: 3, activeLast30: 4, quiet30: 0, weeks: Array.from({ length: 8 }, (_, i) => ({ from: i, signUps: i % 3 })), recent: [{ email: "a@x.com", created: 1e12, lastLogin: 0 }] };
    render(<FounderCard loadFn={async () => stats} />);
    expect(await screen.findByText("Founder view")).toBeTruthy();
    expect(screen.getByText("a@x.com")).toBeTruthy();
  });
});

import crypto from "node:crypto";
import { listAllUsers } from "../api/_lib/adminCore.js";
describe("listAllUsers", () => {
  it("follows pages and reads only the sign-in list", async () => {
    const { privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });
    const sa = { client_email: "s@p.iam.gserviceaccount.com", private_key: privateKey, project_id: "proj" };
    const urls = [];
    const fetchFn = async (u) => {
      urls.push(String(u));
      if (String(u).includes("oauth2")) return { ok: true, json: async () => ({ access_token: "t" }) };
      const second = String(u).includes("nextPageToken=p2");
      return { ok: true, json: async () => (second ? { users: [{ email: "b@x.com", createdAt: "2" }] } : { users: [{ email: "a@x.com", createdAt: "1" }], nextPageToken: "p2" }) };
    };
    const users = await listAllUsers({ sa, fetchFn });
    expect(users.map((u) => u.email)).toEqual(["a@x.com", "b@x.com"]);
    expect(urls.some((u) => u.includes("firestore"))).toBe(false);
    await expect(listAllUsers({ sa, fetchFn: async (u) => (String(u).includes("oauth2") ? { ok: true, json: async () => ({ access_token: "t" }) } : { ok: false }) })).rejects.toThrow();
  });
});
