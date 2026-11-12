import { describe, it, expect } from "vitest";
import { cleanReferral, addReferral, setReferralStatus, removeReferral, openReferrals, statusOf, referralSlipHtml, MAX_REFERRALS } from "../src/referrals.js";

const ok = (form) => cleanReferral(form, { id: "R1", today: "12/11/2026" });
describe("referrals", () => {
  it("needs a treatment and a destination", () => {
    expect(ok({ treatment: "", department: "OMFS" }).ok).toBe(false);
    expect(ok({ treatment: "Extraction", department: "" }).ok).toBe(false);
  });
  it("builds a pending referral to a department or an outside specialist", () => {
    const d = ok({ treatment: " Extraction ", toothRegion: "", department: "OMFS", urgency: "Urgent", note: "Impacted 38" }).referral;
    expect(d).toMatchObject({ treatment: "Extraction", toothRegion: "U/L", department: "Oral & Maxillofacial Surgery", roomNo: "Room 2", urgency: "Urgent", status: "Pending" });
    const o = ok({ treatment: "Implant", department: "", outside: "Dr Rao" }).referral;
    expect(o).toMatchObject({ department: "Dr Rao", roomNo: "Outside", urgency: "Routine" });
  });
  it("moves through statuses and stamps the closing date", () => {
    let list = [ok({ treatment: "Scaling", department: "PERIO" }).referral];
    list = setReferralStatus(list, "R1", "Seen", "13/11/2026");
    expect(list[0].status).toBe("Seen");
    list = setReferralStatus(list, "R1", "Completed", "14/11/2026");
    expect(list[0].closedDate).toBe("14/11/2026");
    list = setReferralStatus(list, "R1", "Bogus", "15/11/2026");
    expect(list[0].status).toBe("Completed");
    expect(removeReferral(list, "R1")).toEqual([]);
  });
  it("shows old Approved entries as Pending and caps the list", () => {
    expect(statusOf({ status: "Approved" })).toBe("Pending");
    expect(addReferral(Array(MAX_REFERRALS).fill({}), {}).error).toMatch(/Up to/);
  });
  it("lists open referrals with emergencies first", () => {
    const patients = [
      { id: "1", name: "A", referrals: [{ id: "a", urgency: "Routine", status: "Approved" }, { id: "b", status: "Completed" }] },
      { id: "2", name: "B", referrals: [{ id: "c", urgency: "Emergency", status: "Pending" }] },
    ];
    expect(openReferrals(patients).map((x) => x.referral.id)).toEqual(["c", "a"]);
  });
  it("prints a white slip with the patient's medical details, escaped", () => {
    const html = referralSlipHtml(ok({ treatment: "Extraction", department: "OMFS", note: "<b>x</b>" }).referral, { name: "Asha", allergies: "Penicillin", currentMedicines: "Midodrine" }, { name: "Smile" });
    expect(html).toContain("light only");
    expect(html).toContain("Penicillin");
    expect(html).toContain("Midodrine");
    expect(html).not.toContain("<b>x</b>");
  });
});
