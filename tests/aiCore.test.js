import { describe, it, expect } from "vitest";
import { buildRequest, parseVisitNote, makeLimiter, cleanText, languageName } from "../api/_lib/aiCore.js";

describe("AI request building", () => {
  it("needs some notes for a visit note", () => {
    expect(buildRequest({ task: "visit_note", notes: "hi" }).ok).toBe(false);
    const r = buildRequest({ task: "visit_note", notes: "pain lower left, caries 36, started RCT" });
    expect(r.ok).toBe(true);
    expect(r.kind).toBe("json");
    expect(r.system).toMatch(/never add findings/i);
  });
  it("builds a plan explanation without patient identifiers", () => {
    const r = buildRequest({ task: "plan_explain", language: "Tamil", patientName: "Secret Name", phone: "9999999999",
      items: [{ description: "Root canal", tooth: "36", amount: 4500 }, { description: "", amount: 1 }] });
    expect(r.ok).toBe(true);
    expect(r.system).toContain("Tamil");
    expect(r.user).toContain("Root canal (tooth 36), Rs 4500");
    expect(r.user + r.system).not.toMatch(/Secret Name|9999999999/);
  });
  it("rejects empty plans and unknown tasks", () => {
    expect(buildRequest({ task: "plan_explain", items: [] }).ok).toBe(false);
    expect(buildRequest({ task: "hack" }).ok).toBe(false);
    expect(buildRequest().ok).toBe(false);
  });
  it("caps long text and falls back to English", () => {
    expect(cleanText("x".repeat(9000)).length).toBe(4000);
    expect(languageName("Klingon")).toBe("English");
    expect(languageName("Hindi")).toBe("Hindi");
  });
});

describe("help chat requests", () => {
  it("keeps the last turns and needs a final user question", () => {
    const msgs = Array.from({ length: 12 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: "m" + i }));
    msgs.push({ role: "user", content: "last question" });
    const r = buildRequest({ task: "help", messages: msgs });
    expect(r.ok).toBe(true);
    expect(r.messages.length).toBeLessThanOrEqual(8);
    expect(r.messages[0].role).toBe("user");
    expect(r.messages[r.messages.length - 1].content).toBe("last question");
    expect(r.system).toMatch(/Patients & Odontogram/);
    expect(r.system).toMatch(/Never give medical/);
  });
  it("rejects empty or assistant-last chats", () => {
    expect(buildRequest({ task: "help", messages: [] }).ok).toBe(false);
    expect(buildRequest({ task: "help", messages: [{ role: "user", content: "hi" }, { role: "assistant", content: "yo" }] }).ok).toBe(false);
  });
});

describe("parsing the model reply", () => {
  it("reads JSON even with extra words around it", () => {
    const n = parseVisitNote('Here: {"complaint":"Pain","findings":"Caries 36","treatment":"","advice":"Soft diet","nextVisit":"1 week"} done');
    expect(n).toEqual({ complaint: "Pain", findings: "Caries 36", treatment: "", advice: "Soft diet", nextVisit: "1 week" });
  });
  it("returns null for junk", () => {
    expect(parseVisitNote("no json")).toBeNull();
    expect(parseVisitNote("{bad json}")).toBeNull();
  });
});

describe("rate limit", () => {
  it("blocks after the limit and frees up later", () => {
    const allow = makeLimiter(2, 1000);
    expect(allow("a", 0)).toBe(true);
    expect(allow("a", 10)).toBe(true);
    expect(allow("a", 20)).toBe(false);
    expect(allow("b", 20)).toBe(true);
    expect(allow("a", 2000)).toBe(true);
  });
});
