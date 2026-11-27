import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({ lookup: null, saved: [], logged: [] }));
vi.mock("../api/_lib/loginAlertCore.js", () => ({ lookupUser: async () => h.lookup }));
vi.mock("../api/_lib/blockCore.js", () => ({ readServiceAccount: () => ({ project_id: "p" }) }));
vi.mock("../api/_lib/planCore.js", () => ({ uidByEmail: async ({ email }) => (email === "none@x.com" ? "" : "uidClinic1") }));
vi.mock("../api/_lib/auditCore.js", () => ({
  listLog: async () => [{ id: "1", at: 1, actor: "boss@x.com", action: "plan", target: "a@x.com", detail: "" }],
  getNote: async () => ({ note: "hi", updatedAt: 1 }),
  setNote: async ({ note }) => { h.saved.push(note); return { note, updatedAt: 2 }; },
  logAction: async (e) => { h.logged.push(e.action); return true; },
}));
import logHandler from "../api/admin-log.js";
import notesHandler from "../api/admin-notes.js";

const run = async (handler, { method = "GET", body, token = "abc" } = {}) => {
  const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = b; } };
  await handler({ method, headers: token ? { authorization: `Bearer ${token}` } : {}, body }, res);
  return { status: res.statusCode, body: JSON.parse(res.body), headers: res.headers };
};
beforeEach(() => { process.env.FOUNDER_EMAILS = "boss@x.com"; h.lookup = { uid: "uidBoss", email: "boss@x.com" }; h.saved = []; h.logged = []; });

describe("admin-log endpoint", () => {
  it("lets only a signed-in founder read the log, and never caches it", async () => {
    const ok = await run(logHandler);
    expect(ok.status).toBe(200);
    expect(ok.body.entries).toHaveLength(1);
    expect(ok.headers["Cache-Control"]).toBe("no-store");
    h.lookup = null;
    expect((await run(logHandler, { token: "" })).status).toBe(401);
    h.lookup = { uid: "u2", email: "clinic@x.com" };
    expect((await run(logHandler)).status).toBe(403);
    expect((await run(logHandler, { method: "POST" })).status).toBe(405);
  });
});

describe("admin-notes endpoint", () => {
  it("reads without a note, saves with one, and logs only the save", async () => {
    expect((await run(notesHandler, { method: "POST", body: { email: "a@x.com" } })).body.note).toBe("hi");
    expect(h.logged).toEqual([]);
    const saved = await run(notesHandler, { method: "POST", body: { email: "A@x.com", note: "call back" } });
    expect(saved.body.note).toBe("call back");
    expect(h.logged).toEqual(["note"]);
  });
  it("refuses clinics, signed-out callers, unknown emails and bad requests", async () => {
    h.lookup = { uid: "u2", email: "clinic@x.com" };
    expect((await run(notesHandler, { method: "POST", body: { email: "a@x.com", note: "x" } })).status).toBe(403);
    expect(h.saved).toEqual([]);
    h.lookup = null;
    expect((await run(notesHandler, { method: "POST", body: { email: "a@x.com" }, token: "" })).status).toBe(401);
    h.lookup = { uid: "uidBoss", email: "boss@x.com" };
    expect((await run(notesHandler, { method: "POST", body: { email: "none@x.com" } })).status).toBe(404);
    expect((await run(notesHandler, { method: "POST", body: {} })).status).toBe(400);
    expect((await run(notesHandler, { method: "POST", body: "{bad" })).status).toBe(400);
    expect((await run(notesHandler, { method: "GET" })).status).toBe(405);
  });
});
