import { describe, it, expect } from "vitest";
import { draftVisitNote } from "../src/clinicalNote.js";
import { scoreCaries, scoreBpe, buildAssessment, addAssessment, removeAssessment } from "../src/assessments.js";
import { addWalkIn, nextToken, setQueueStatus, queueView, queueSummary, waitMinutes, pruneQueue } from "../src/queue.js";
import { validateBookingRequest, buildBookingDoc, requestToAppointment, bookingUrl, buildBookingPage } from "../src/booking.js";

const palette = [{ id: "CAR", label: "Caries" }, { id: "RCT", label: "RCT Done" }, { id: "HLT", label: "Healthy" }, { id: "SCL", label: "Calculus" }];
const noon = new Date(2026, 10, 11, 12, 0);

describe("auto-drafted clinical note", () => {
  it("lists findings, leaves treatment blank, adds advice and the next planned item", () => {
    const n = draftVisitNote({
      toothConditions: { 16: ["CAR", "RCT"], 26: "CAR", 11: "HLT" },
      plans: [{ status: "Approved", items: [{ description: "Crown", tooth: "16" }] }, { status: "Proposed", items: [{ description: "Scaling", tooth: "" }] }],
    }, palette, noon);
    expect(n.findings).toBe("Caries: 16, 26. RCT Done: 16.");
    expect(n.treatment).toBe("");
    expect(n.advice).toContain("Restore carious teeth");
    expect(n.nextVisit).toBe("Crown, tooth 16");
    expect(n.date).toBe("2026-11-11");
  });
  it("is empty for a blank chart", () => {
    const n = draftVisitNote({}, palette, noon);
    expect(n.findings).toBe(""); expect(n.advice).toBe(""); expect(n.nextVisit).toBe("");
  });
});

describe("assessments", () => {
  it("grades caries risk and sets the recall", () => {
    expect(scoreCaries({})).toMatchObject({ level: "Low", recallMonths: 6 });
    expect(scoreCaries({ sugar: true, plaque: true })).toMatchObject({ level: "Moderate", recallMonths: 4 });
    expect(scoreCaries({ newLesions: true, sugar: true, dryMouth: true })).toMatchObject({ score: 4, level: "High", recallMonths: 3 });
  });
  it("needs all six BPE sextants and reports the highest", () => {
    expect(scoreBpe({ UR: "1" }).ok).toBe(false);
    const r = scoreBpe({ UR: "1", UA: "2", UL: "0", LL: "3", LA: "1", LR: "2" });
    expect(r).toMatchObject({ ok: true, highest: 3, needsFullChart: true, furcation: false });
    const f = scoreBpe({ UR: "0", UA: "0", UL: "0", LL: "0", LA: "0", LR: "*" });
    expect(f).toMatchObject({ highest: 4, furcation: true });
  });
  it("stores and removes assessments on the patient", () => {
    const b = buildAssessment("caries", { sugar: true }, "A1", noon);
    expect(b.assessment.date).toBe("2026-11-11");
    let p = addAssessment({ id: "P" }, b.assessment);
    expect(p.assessments).toHaveLength(1);
    expect(removeAssessment(p, "A1").assessments).toEqual([]);
    expect(buildAssessment("bpe", { UR: "1" }, "A2", noon).ok).toBe(false);
  });
});

describe("walk-in queue", () => {
  it("issues tokens per day and rejects bad input", () => {
    expect(addWalkIn([], { name: "" }, "1", noon).ok).toBe(false);
    expect(addWalkIn([], { name: "A", phone: "123" }, "1", noon).ok).toBe(false);
    const a = addWalkIn([], { name: "Asha", phone: "+91 98765 43210" }, "1", noon).entry;
    expect(a).toMatchObject({ token: 1, phone: "9876543210", status: "Waiting" });
    const b = addWalkIn([a], { name: "Ravi" }, "2", noon).entry;
    expect(b.token).toBe(2);
    expect(nextToken([a, b], "2026-11-12")).toBe(1);
  });
  it("orders in-chair, urgent, then arrival", () => {
    const mk = (id, token, priority, status = "Waiting") => ({ id, token, date: "2026-11-11", priority, status, arrivedAt: noon.toISOString() });
    const q = [mk("a", 1, "Normal"), mk("b", 2, "Urgent"), mk("c", 3, "Normal", "In chair"), mk("d", 4, "Normal", "Done")];
    expect(queueView(q, "2026-11-11").map((e) => e.id)).toEqual(["c", "b", "a", "d"]);
  });
  it("tracks wait time and summary", () => {
    const e = addWalkIn([], { name: "A", priority: "Urgent" }, "1", noon).entry;
    const later = new Date(noon.getTime() + 20 * 60000);
    expect(waitMinutes(e, later)).toBe(20);
    const called = setQueueStatus(e, "In chair", later);
    expect(waitMinutes(called, new Date(later.getTime() + 60 * 60000))).toBe(20);
    expect(queueSummary([called], "2026-11-11", later)).toMatchObject({ total: 1, inChair: 1, waiting: 0, avgWaitMin: 20 });
    expect(setQueueStatus(e, "bogus")).toBe(e);
  });
  it("prunes old finished entries only", () => {
    const old = { id: "o", date: "2026-08-01", status: "Done" };
    const oldOpen = { id: "p", date: "2026-08-01", status: "Waiting" };
    const fresh = { id: "f", date: "2026-11-10", status: "Done" };
    expect(pruneQueue([old, oldOpen, fresh], noon).map((e) => e.id)).toEqual(["p", "f"]);
  });
});

describe("online booking", () => {
  const ok = { name: "Asha", phone: "98765 43210", date: "2026-11-12", slot: "Morning", service: "Tooth pain", note: "x".repeat(500) };
  it("validates the public form", () => {
    expect(validateBookingRequest({ ...ok, name: "" }, noon).ok).toBe(false);
    expect(validateBookingRequest({ ...ok, phone: "12345" }, noon).ok).toBe(false);
    expect(validateBookingRequest({ ...ok, date: "2026-11-10" }, noon).ok).toBe(false);
    expect(validateBookingRequest({ ...ok, slot: "Night" }, noon).ok).toBe(false);
    const r = validateBookingRequest(ok, noon);
    expect(r.ok).toBe(true);
    expect(r.request.phone).toBe("9876543210");
    expect(r.request.note).toHaveLength(300);
    expect(validateBookingRequest({ ...ok, service: "Hack" }, noon).request.service).toBe("Other");
  });
  it("builds the stored doc and the public page without private data", () => {
    const d = buildBookingDoc(validateBookingRequest(ok, noon).request, "uid1", noon);
    expect(d).toMatchObject({ clinicId: "uid1", status: "new" });
    const page = buildBookingPage({ name: "Smile", address: "A", phone: "1", drName: "Dr X", upiId: "secret@upi" }, "uid1", { enabled: true });
    expect(page.upiId).toBeUndefined();
    expect(page.enabled).toBe(true);
    expect(bookingUrl("https://x.com/", "uid1")).toBe("https://x.com/?book=uid1");
  });
  it("matches an existing patient by phone when confirming", () => {
    const req = validateBookingRequest(ok, noon).request;
    const r = requestToAppointment(req, { newId: (p) => p + "1", doctor: "Dr X", chair: "Chair 1", patients: [{ id: "P-9", phone: "9876543210" }] });
    expect(r.appointment).toMatchObject({ patientId: "P-9", time: "10:00", status: "Confirmed", source: "online" });
    expect(requestToAppointment(req, { newId: (p) => p + "1", doctor: "D", chair: "C", patients: [] }).patient).toBeNull();
  });
});
