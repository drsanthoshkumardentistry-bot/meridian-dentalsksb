import { describe, it, expect } from "vitest";
import { balancePaise, paidPaise, paymentStatus } from "../src/billing.js";
import { addVisit, sortVisits } from "../src/visits.js";
import { findings } from "../src/extraoral.js";
import { stockSummary } from "../src/stock.js";
import { sortImages } from "../src/gallery.js";
import { buildNotifications } from "../src/notifications.js";
import { recordSheetHtml } from "../src/recordSheet.js";
import { validateBackup } from "../src/portability.js";

describe("damaged stored data does not crash the screens", () => {
  it("billing ignores a payments field that is not a list", () => {
    expect(paidPaise({ totalP: 500, payments: "x" })).toBe(0);
    expect(balancePaise({ totalP: 500, payments: { a: 1 } })).toBe(500);
    expect(paymentStatus({ totalP: 500, payments: [null, { amountP: "200" }] })).toBe("Part paid");
    expect(balancePaise(undefined)).toBe(0);
  });
  it("visits tolerate notes without a date or a broken list", () => {
    expect(sortVisits([{ id: "a" }, null, { id: "b", date: "2026-01-01" }]).map((v) => v.id)).toEqual(["b", "a"]);
    expect(addVisit({ visits: 5 }, { id: "n", date: "2026-02-02" }).visits).toHaveLength(1);
  });
  it("extra-oral findings, stock summary, gallery, notifications and the record sheet accept junk", () => {
    expect(findings(undefined)).toEqual([]);
    expect(findings({})).toEqual([]);
    expect(stockSummary([null, { name: "x", quantity: 0 }]).out).toBe(1);
    expect(sortImages([null, { takenOn: "2026-01-01" }])).toHaveLength(1);
    expect(buildNotifications({ inventory: [null], appointments: [undefined] })).toEqual([]);
    expect(recordSheetHtml(null, { appointments: [null], invoices: [null] }, null)).toContain("<html");
  });
  it("a backup file with records that cannot be read as text is refused", () => {
    const evil = JSON.parse('{"format":"merident-backup","version":1,"data":{"patients":[{"id":"P1","name":"A","phone":{"toString":null}}]}}');
    expect(validateBackup(evil).ok).toBe(false);
    const evil2 = JSON.parse('{"format":"merident-backup","version":1,"data":{"patients":[{"id":"P1","name":"A","x":[{"__proto__":{"a":1}}]}]}}');
    expect(validateBackup(evil2).ok).toBe(false);
    const fine = { format: "merident-backup", version: 1, data: { patients: [{ id: "P1", name: "A", phone: "9876543210" }] } };
    expect(validateBackup(fine).ok).toBe(true);
  });
});
