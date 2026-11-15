import { describe, it, expect } from "vitest";
import { safePatients, safeAppointments, safeInvoices } from "../src/safeRecords.js";

describe("damaged records never reach the screens", () => {
  it("keeps a good list exactly as it is (same object, no copying)", () => {
    const list = [{ id: "p1", name: "Asha", phone: "9", visits: [], plans: [] }];
    expect(safePatients(list)).toBe(list);
    expect(safePatients(list)[0]).toBe(list[0]);
  });
  it("turns a numeric or missing name into text", () => {
    const out = safePatients([{ id: 1, name: 12345 }, { id: "p2" }, { id: "p3", name: { x: 1 }, phone: null }]);
    expect(out.map((p) => typeof p.name)).toEqual(["string", "string", "string"]);
    expect(out[0].name).toBe("12345");
    expect(() => out.forEach((p) => p.name.toLowerCase())).not.toThrow();
  });
  it("drops non-record items and fixes list fields", () => {
    const out = safePatients([null, "str", 5, [], { id: "p1", name: "A", visits: "x", plans: [null, { a: 1 }] }]);
    expect(out).toHaveLength(1);
    expect(out[0].visits).toEqual([]);
    expect(out[0].plans).toEqual([{ a: 1 }]);
  });
  it("copes when the whole list is not a list", () => {
    expect(safePatients(null)).toEqual([]);
    expect(safeInvoices({})).toEqual([]);
    expect(safeAppointments("x")).toEqual([]);
  });
  it("makes invoice money and payments safe to add up", () => {
    const [v] = safeInvoices([{ id: "I1", totalP: "abc", subtotalP: "500", payments: null, patient: 7 }]);
    expect(v.totalP).toBe(0);
    expect(v.subtotalP).toBe(500);
    expect(v.payments).toEqual([]);
    expect(v.patient).toBe("7");
  });
  it("makes appointment text fields safe", () => {
    const [a] = safeAppointments([{ id: "A1", date: 20260101, time: 99, patientName: null }]);
    expect(a.date).toBe("20260101");
    expect(a.time).toBe("99");
  });
});

describe("missing ids and dates", () => {
  it("gives every record the text fields screens sort and search on", () => {
    expect(safePatients([{}])[0]).toMatchObject({ id: "", name: "" });
    expect(safeInvoices([{ totalP: 5 }])[0]).toMatchObject({ id: "", date: "" });
    expect(safeAppointments([{ id: "A" }])[0]).toMatchObject({ date: "", time: "" });
  });
  it("turns an explicit null into empty text", () => {
    expect(safePatients([{ id: "p", name: "A", phone: null }])[0].phone).toBe("");
  });
});
