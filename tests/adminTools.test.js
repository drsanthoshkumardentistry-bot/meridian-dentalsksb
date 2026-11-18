import { describe, it, expect } from "vitest";
import { toCsv, clinicsCsv, requestsCsv, followUps, emailList, readLocal, writeLocal, cleanTodos, weeklySignups, renewalsTimeline, sortClinics } from "../src/adminTools.js";
const DAY = 86400000, NOW = 1_800_000_000_000;
describe("admin tools", () => {
  it("escapes csv cells and blocks formula injection", () => {
    expect(toCsv([["a,b", 'say "hi"', "=cmd()", "+1", "ok"]])).toBe('"a,b","say ""hi""",\'=cmd(),\'+1,ok\r\n');
    expect(toCsv([[null, undefined, 0]])).toBe(",,0\r\n");
  });
  it("builds clinic and request exports", () => {
    const c = clinicsCsv([{ email: "a@x.com", created: NOW, lastLogin: 0, online: true, todayMin: 5, plan: "pro", paidUntil: NOW + DAY, state: "paid" }]);
    expect(c.split("\r\n")[0]).toContain("Email,Joined");
    expect(c).toContain("a@x.com");
    expect(c).toContain("yes");
    expect(requestsCsv([{ email: "b@x.com", plan: "standard", yearly: true, status: "pending", createdAt: NOW }])).toContain("b@x.com,,standard,yes,pending");
    expect(clinicsCsv(undefined).split("\r\n").length).toBe(2);
  });
  it("sorts clinics into follow-up lists", () => {
    const rows = [
      { email: "soon@x", state: "paid", paidUntil: NOW + 3 * DAY, lastLogin: NOW, created: NOW - 40 * DAY },
      { email: "later@x", state: "paid", paidUntil: NOW + 30 * DAY, lastLogin: NOW, created: NOW - 40 * DAY },
      { email: "old@x", state: "expired", paidUntil: NOW - DAY, lastLogin: NOW - 50 * DAY, created: NOW - 90 * DAY },
      { email: "new@x", state: "unpaid", lastLogin: NOW - DAY, created: NOW - 2 * DAY },
      null,
    ];
    const f = followUps(rows, NOW);
    expect(f.renewalsDue.map((c) => c.email)).toEqual(["soon@x"]);
    expect(f.expired.map((c) => c.email)).toEqual(["old@x"]);
    expect(f.quiet.map((c) => c.email)).toEqual(["old@x"]);
    expect(f.fresh.map((c) => c.email)).toEqual(["new@x"]);
    expect(followUps(undefined, NOW).quiet).toEqual([]);
  });
  it("lists unique emails", () => {
    expect(emailList([{ email: "a@x" }, { email: " a@x " }, { email: "" }, {}])).toBe("a@x");
  });
  it("stores local data safely", () => {
    const mem = { s: {}, getItem(k) { return this.s[k] ?? null; }, setItem(k, v) { this.s[k] = v; } };
    expect(writeLocal("k", [1], mem)).toBe(true);
    expect(readLocal("k", [], mem)).toEqual([1]);
    mem.s.bad = "{oops";
    expect(readLocal("bad", "d", mem)).toBe("d");
    expect(readLocal("k", 0, { getItem() { throw new Error("blocked"); } })).toBe(0);
    expect(writeLocal("k", 1, { setItem() { throw new Error("full"); } })).toBe(false);
    expect(cleanTodos([{ id: 1, text: " buy ", done: 1 }, { text: "  " }, 5, null])).toEqual([{ id: "1", text: " buy ", done: true }]);
    expect(cleanTodos("x")).toEqual([]);
  });
  it("counts signups per week, oldest first", () => {
    const w = weeklySignups([{ created: NOW - DAY }, { created: NOW - 2 * DAY }, { created: NOW - 9 * DAY }, { created: 0 }, null], NOW, 4);
    expect(w.map((x) => x.count)).toEqual([0, 0, 1, 2]);
    expect(weeklySignups(undefined, NOW, 2).map((x) => x.count)).toEqual([0, 0]);
  });
  it("orders renewals and flags urgent ones", () => {
    const r = renewalsTimeline([
      { email: "b", state: "paid", paidUntil: NOW + 20 * DAY },
      { email: "a", state: "paid", paidUntil: NOW + 2 * DAY - 5 },
      { email: "x", state: "expired", paidUntil: NOW - DAY },
      { email: "y", state: "paid", paidUntil: NOW - DAY },
    ], NOW);
    expect(r.map((c) => c.email)).toEqual(["a", "b"]);
    expect(r[0].daysLeft).toBe(2);
    expect(r[0].urgent).toBe(true);
    expect(r[1].urgent).toBe(false);
  });
  it("sorts clinics", () => {
    const rows = [{ email: "b", lastLogin: 1, weekMin: 5, created: 3 }, { email: "a", lastLogin: 9, weekMin: 1, created: 1 }];
    expect(sortClinics(rows, "seen")[0].email).toBe("a");
    expect(sortClinics(rows, "time")[0].email).toBe("b");
    expect(sortClinics(rows, "new")[0].email).toBe("b");
    expect(sortClinics(rows, "email")[0].email).toBe("a");
    expect(sortClinics(rows, "nope")[0].email).toBe("a");
  });
});
