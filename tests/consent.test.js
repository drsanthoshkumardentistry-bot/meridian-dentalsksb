import { describe, it, expect } from "vitest";
import {
  TEMPLATES, templateById, fillTemplate, validateConsent, createConsent, isSignatureData, signerLine, consentHtml, MAX_CONSENTS, PNG_PREFIX, MAX_SIGNATURE_CHARS,
} from "../src/consent.js";
import { buildAuditEntry, AUDIT_LABELS } from "../src/audit.js";

const sig = PNG_PREFIX + "A".repeat(400);
const draft = (o = {}) => ({ templateId: "extraction", title: "Tooth extraction", text: "I agree to have tooth 18 removed. ".repeat(3), teeth: "18", signerRole: "patient", signerName: "Asha Devi", relation: "", witness: "Nurse Priya", signature: sig, understood: true, ...o });

describe("templates", () => {
  it("has unique ids and a title for each", () => {
    expect(new Set(TEMPLATES.map((t) => t.id)).size).toBe(TEMPLATES.length);
    expect(TEMPLATES.every((t) => t.title)).toBe(true);
    expect(templateById("rct").title).toBe("Root canal treatment");
    expect(templateById("nope")).toBeUndefined();
  });
  it("fills names, clinic, doctor and teeth, leaving no placeholders", () => {
    for (const t of TEMPLATES) {
      const text = fillTemplate(t.id, { patient: "Asha Devi", teeth: "16, 17", doctor: "Dr Rao", clinic: "Smile Care" });
      expect(text, t.id).not.toMatch(/\{[a-z]+\}/);
      expect(text.length).toBeGreaterThan(100);
    }
    const ex = fillTemplate("extraction", { teeth: "18", doctor: "Dr Rao", clinic: "Smile Care" });
    expect(ex).toContain("tooth 18");
    expect(ex).toContain("Dr Rao");
    expect(fillTemplate("rct", { teeth: "46" })).toContain("tooth 46");
    expect(fillTemplate("extraction", { teeth: "16 17" })).toContain("teeth 16, 17");
  });
  it("falls back to plain words when details are missing and ignores invalid teeth", () => {
    const t = fillTemplate("extraction", { teeth: "99" });
    expect(t).toContain("the tooth discussed with me");
    expect(t).toContain("the dentist");
    expect(fillTemplate("nope")).toBe("");
  });
  it("covers the explaining, alternatives and no-guarantee points", () => {
    const t = fillTemplate("general", { patient: "A" });
    expect(t).toMatch(/other options/);
    expect(t).toMatch(/no dentist can promise/);
    expect(t).toMatch(/language I understand/);
  });
});

describe("validateConsent", () => {
  it("accepts a complete patient consent", () => expect(validateConsent(draft())).toBe(""));
  it("accepts a guardian with a relationship", () => expect(validateConsent(draft({ signerRole: "guardian", relation: "Mother" }))).toBe(""));
  it.each([
    [{ title: " " }, /Choose or name/], [{ text: "short" }, /too short/], [{ text: "x".repeat(4001) }, /under 4,000/], [{ teeth: "99" }, /FDI/],
    [{ signerName: "" }, /patient's name/], [{ signerRole: "guardian", signerName: "", relation: "Mother" }, /guardian's name/],
    [{ signerRole: "guardian", relation: "" }, /relationship/], [{ signature: "" }, /sign in the box/], [{ signature: "data:image/jpeg;base64," + "A".repeat(300) }, /sign in the box/],
    [{ signature: PNG_PREFIX + "A".repeat(MAX_SIGNATURE_CHARS) }, /sign in the box/], [{ understood: false }, /Confirm/],
  ])("rejects %j", (o, msg) => expect(validateConsent(draft(o))).toMatch(msg));
  it("limits how many consents one patient can hold", () => expect(validateConsent(draft(), MAX_CONSENTS)).toMatch(/at most/));
  it("tells a real signature picture from junk", () => {
    expect(isSignatureData(sig)).toBe(true);
    expect(isSignatureData(PNG_PREFIX)).toBe(false);
    expect(isSignatureData(null)).toBe(false);
  });
});

describe("createConsent", () => {
  const now = new Date("2026-11-11T08:00:00Z");
  it("stores the signed wording, who signed, the dentist and the time", () => {
    const c = createConsent(draft({ teeth: "18, 18, 99" }), "C1", { doctor: "Dr Rao", clinic: "Smile Care" }, now);
    expect(c).toMatchObject({ id: "C1", templateId: "extraction", signerRole: "patient", signerName: "Asha Devi", relation: "", witness: "Nurse Priya", teeth: "18", doctor: "Dr Rao", clinic: "Smile Care", signedAt: now.toISOString() });
    expect(c.signature).toBe(sig);
  });
  it("keeps the guardian relationship and marks unknown templates as custom", () => {
    const c = createConsent(draft({ templateId: "mine", signerRole: "guardian", relation: "Father", signerName: "Ramesh" }), "C2", {}, now);
    expect(c).toMatchObject({ templateId: "custom", signerRole: "guardian", relation: "Father" });
    expect(signerLine(c)).toBe("Ramesh (Father, guardian)");
    expect(signerLine({ signerRole: "patient", signerName: "Asha" })).toBe("Asha");
  });
});

describe("printing and audit", () => {
  it("escapes everything that came from a person", () => {
    const c = createConsent(draft({ text: "I agree <script>alert(1)</script> to treatment & more text here to pass the length check.", signerName: "A <b>x</b>" }), "C3", { clinic: "Bad <i>Clinic</i>" });
    const html = consentHtml(c, { name: "P <u>q</u>" }, { address: "<x>" });
    expect(html).not.toContain("<script>alert");
    expect(html).not.toContain("<b>x</b>");
    expect(html).not.toContain("<i>Clinic");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain(`src="${sig}"`);
  });
  it("records a consent in the activity log without clinical text", () => {
    expect(AUDIT_LABELS["consent.sign"]).toBeTruthy();
    const e = buildAuditEntry({ actor: { uid: "u", email: "a@b.c" }, action: "consent.sign", subject: "Asha Devi", detail: "Tooth extraction" }, "E1");
    expect(e.action).toBe("consent.sign");
  });
});
