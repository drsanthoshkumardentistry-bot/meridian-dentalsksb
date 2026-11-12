import { describe, it, expect } from "vitest";
import { buildPortalDoc, portalUrl, isPortalExpired, buildPortalMessage, PORTAL_DAYS } from "../src/portal.js";

const now = new Date(2026, 10, 12, 12);
const patient = { id: "P1", name: "Asha Rao", phone: "9876543210", address: "12 Main Rd", plans: [
  { id: "T1", title: "Root canal", status: "Approved", items: [{ description: "RCT", amount: 5000 }], discount: 0 },
  { id: "T2", title: "Old", status: "Declined", items: [{ description: "x", amount: 1 }] },
], visits: [{ id: "V1", date: "2026-11-10", advice: "Avoid hard food", nextVisitOn: "2026-11-17", findings: "deep caries 36" }] };
const appts = [
  { patientId: "P1", date: "2026-11-14", time: "10:30", procedure: "RCT", doctor: "Dr S", status: "Scheduled" },
  { patientId: "P1", date: "2026-11-01", time: "10:30", procedure: "Past", status: "Completed" },
  { patientId: "P1", date: "2026-11-15", time: "10:30", procedure: "Cancelled", status: "Cancelled" },
  { patientId: "P2", date: "2026-11-14", time: "11:00", procedure: "Someone else", status: "Scheduled" },
];
const invs = [{ id: "INV-1", patientId: "P1", date: "10/11/2026", totalP: 100000, payments: [{ amountP: 40000 }] }, { id: "INV-2", patientId: "P2", totalP: 5, payments: [] }];

describe("patient portal", () => {
  const doc = buildPortalDoc({ clinicId: "C1", profile: { name: "Smile", phone: "9000000000", upiId: "smile@upi" }, patient, appointments: appts, invoices: invs }, now);
  it("includes only this patient's upcoming, live visits", () => {
    expect(doc.upcoming).toHaveLength(1);
    expect(doc.upcoming[0].procedure).toBe("RCT");
  });
  it("shows bills with what is still owed", () => {
    expect(doc.bills).toHaveLength(1);
    expect(doc.bills[0].balanceP).toBe(60000);
    expect(doc.outstandingP).toBe(60000);
  });
  it("hides declined plans and keeps the first name only", () => {
    expect(doc.plans.map((p) => p.title)).toEqual(["Root canal"]);
    expect(doc.plans[0].totalP).toBeGreaterThan(0);
    expect(doc.patientFirstName).toBe("Asha");
  });
  it("carries advice and next visit but no phone, address or findings", () => {
    expect(doc.advice).toBe("Avoid hard food");
    expect(doc.nextVisitOn).toBe("2026-11-17");
    const json = JSON.stringify(doc);
    expect(json).not.toContain("9876543210");
    expect(json).not.toContain("12 Main Rd");
    expect(json).not.toContain("caries");
  });
  it("expires after the set days and builds a link and message", () => {
    expect(isPortalExpired(doc, now)).toBe(false);
    expect(isPortalExpired(doc, new Date(now.getTime() + (PORTAL_DAYS + 1) * 86400000))).toBe(true);
    expect(isPortalExpired(null)).toBe(true);
    expect(portalUrl("https://x.com/", "tok")).toBe("https://x.com/?portal=tok");
    expect(buildPortalMessage({ clinicName: "Smile", patient, url: "https://x.com/?portal=tok" })).toContain("https://x.com/?portal=tok");
  });
});
