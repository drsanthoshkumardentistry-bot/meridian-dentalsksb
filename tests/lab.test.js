import { describe, it, expect } from "vitest";
import {
  validateLabOrder, createLabOrder, moveLabOrder, canMove, daysToDue, isOverdue, isDueSoon, openLabOrders, overdueCount, readyToTell,
  buildLabChase, buildPatientReady, markPatientNotified, knownLabs,
} from "../src/lab.js";

const now = new Date(2026, 10, 11, 12);
const draft = (o = {}) => ({ lab: "Sri Dental Lab", labPhone: "9876543210", workType: "Crown", teeth: "36", shade: "A2", sentOn: "2026-11-08", dueOn: "2026-11-15", note: "", ...o });
const order = (o = {}) => ({ ...createLabOrder(draft(), "L1"), ...o });
const patient = (orders, o = {}) => ({ id: "P1", name: "Asha", phone: "9123456780", labOrders: orders, ...o });

describe("validateLabOrder", () => {
  it("accepts a complete draft", () => expect(validateLabOrder(draft())).toBe(""));
  it.each([
    [{ lab: " " }, /lab's name/], [{ workType: "Spaceship" }, /type of work/], [{ teeth: "99" }, /FDI/], [{ labPhone: "123" }, /10-digit/],
    [{ sentOn: "" }, /sent the work/], [{ dueOn: "" }, /expect it back/], [{ dueOn: "2026-11-01" }, /before the sent date/], [{ note: "x".repeat(301) }, /note/],
  ])("rejects %j", (o, msg) => expect(validateLabOrder(draft(o))).toMatch(msg));
  it("allows no teeth and no phone", () => expect(validateLabOrder(draft({ teeth: "", labPhone: "" }))).toBe(""));
});

describe("order flow", () => {
  it("creates a clean order with teeth tidied", () => {
    const o = createLabOrder(draft({ teeth: "36 ,37 36" }), "L9");
    expect(o).toMatchObject({ id: "L9", status: "sent", teeth: "36, 37", receivedOn: "", fittedOn: "" });
  });
  it("moves sent to received to fitted and stamps the dates", () => {
    const r = moveLabOrder(order(), "received", now);
    expect(r).toMatchObject({ status: "received", receivedOn: "2026-11-11" });
    expect(moveLabOrder(r, "fitted", now)).toMatchObject({ status: "fitted", fittedOn: "2026-11-11" });
  });
  it("blocks jumps and moves out of finished states", () => {
    expect(canMove(order(), "fitted")).toBe(false);
    expect(moveLabOrder(order(), "fitted", now).status).toBe("sent");
    expect(canMove(order({ status: "fitted" }), "cancelled")).toBe(false);
    expect(canMove(order({ status: "received" }), "cancelled")).toBe(true);
  });
});

describe("due dates", () => {
  it("counts days to due, late is negative", () => {
    expect(daysToDue(order({ dueOn: "2026-11-15" }), now)).toBe(4);
    expect(daysToDue(order({ dueOn: "2026-11-09" }), now)).toBe(-2);
    expect(daysToDue(order({ dueOn: "" }), now)).toBeNull();
  });
  it("flags overdue and due soon only while with the lab", () => {
    expect(isOverdue(order({ dueOn: "2026-11-10" }), now)).toBe(true);
    expect(isOverdue(order({ dueOn: "2026-11-11" }), now)).toBe(false);
    expect(isDueSoon(order({ dueOn: "2026-11-13" }), now)).toBe(true);
    expect(isDueSoon(order({ dueOn: "2026-11-14" }), now)).toBe(false);
    expect(isOverdue(order({ dueOn: "2026-11-01", status: "received" }), now)).toBe(false);
  });
});

describe("board", () => {
  const p1 = patient([order({ id: "a", dueOn: "2026-11-20" }), order({ id: "b", dueOn: "2026-11-09" }), order({ id: "c", status: "fitted" }), order({ id: "d", status: "cancelled" })]);
  const p2 = patient([order({ id: "e", status: "received", dueOn: "2026-11-30" })], { id: "P2", name: "Ravi" });
  it("lists open orders, received first, then most urgent", () => {
    expect(openLabOrders([p1, p2], now).map((r) => r.order.id)).toEqual(["e", "b", "a"]);
  });
  it("counts overdue orders", () => expect(overdueCount([p1, p2], now)).toBe(1));
  it("lists received work the patient has not been told about, respecting consent and number", () => {
    expect(readyToTell([p1, p2]).map((r) => r.order.id)).toEqual(["e"]);
    expect(readyToTell([{ ...p2, consent: { whatsapp: false } }])).toHaveLength(0);
    expect(readyToTell([{ ...p2, phone: "1" }])).toHaveLength(0);
    expect(readyToTell([{ ...p2, labOrders: [markPatientNotified(p2.labOrders[0], now)] }])).toHaveLength(0);
  });
  it("remembers labs by name once", () => {
    expect(knownLabs([p1, p2])).toEqual([{ lab: "Sri Dental Lab", labPhone: "9876543210" }]);
  });
});

describe("messages", () => {
  it("chases the lab with the work, patient and dates", () => {
    const m = buildLabChase({ clinicName: "Smile Care", patient: { name: "Asha" }, order: order() });
    expect(m).toContain("Hello Sri Dental Lab");
    expect(m).toContain("Crown (tooth 36), shade A2");
    expect(m).toContain("Asha");
  });
  it("tells the patient their work is ready", () => {
    const m = buildPatientReady({ clinicName: "Smile Care", clinicPhone: "9000000000", patient: { name: "Asha" }, order: order() });
    expect(m).toContain("Your crown has come back");
    expect(m).toContain("9000000000");
  });
});
