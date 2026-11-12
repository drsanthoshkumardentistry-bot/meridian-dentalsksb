import { describe, it, expect } from "vitest";
import { todayActionTiles, totalActions, liveFlow } from "../src/todayActions.js";

const now = new Date("2026-11-12T10:00:00");
const e = (o) => ({ id: o.token, date: "2026-11-12", name: `P${o.token}`, status: "Waiting", priority: "Normal", arrivedAt: "2026-11-12T09:30:00", calledAt: "", ...o });

describe("today action tiles", () => {
  it("lists every kind of job and totals them", () => {
    const tiles = todayActionTiles({ bookings: 2, nextVisits: 3, payments: 1 });
    expect(tiles.map((t) => t.id)).toEqual(["bookings", "reminders", "nextVisits", "recalls", "plans", "payments", "feedback"]);
    expect(totalActions(tiles)).toBe(6);
    expect(totalActions(todayActionTiles())).toBe(0);
  });
  it("sends each tile to the right screen", () => {
    const by = Object.fromEntries(todayActionTiles().map((t) => [t.id, t.to]));
    expect(by.payments).toBe("Billing & Invoices");
    expect(by.nextVisits).toBe("Appointments Diary");
  });
});

describe("waiting room now", () => {
  it("is null when nobody came in today", () => {
    expect(liveFlow([], "2026-11-12", now)).toBeNull();
    expect(liveFlow([e({ token: 1, date: "2026-11-11" })], "2026-11-12", now)).toBeNull();
  });
  it("counts waiting, urgent, in chair and seen, and names who is next and who waited longest", () => {
    const q = [
      e({ token: 1, status: "In chair", calledAt: "2026-11-12T09:40:00" }),
      e({ token: 2, status: "Done", calledAt: "2026-11-12T09:00:00" }),
      e({ token: 3, arrivedAt: "2026-11-12T09:00:00" }),
      e({ token: 4, priority: "Urgent", arrivedAt: "2026-11-12T09:50:00" }),
    ];
    const f = liveFlow(q, "2026-11-12", now);
    expect(f).toMatchObject({ waiting: 2, urgent: 1, inChair: 1, seen: 1 });
    expect(f.next.name).toBe("P4");
    expect(f.longest).toEqual({ name: "P3", minutes: 60 });
  });
});
