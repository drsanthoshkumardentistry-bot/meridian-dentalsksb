import { describe, it, expect } from "vitest";
import { languageOf, localized, LANGUAGES } from "../src/messageLanguage.js";
import { buildAppointmentReminder, buildPaymentReminder, buildRecallMessage } from "../src/reminders.js";

const appt = { patientName: "Asha", date: "2026-11-12", time: "10:30", doctor: "Dr T" };
const inv = { id: "INV-1", patient: "Asha", totalP: 500000, payments: [{ date: "01/11/2026", mode: "Cash", amountP: 200000 }], items: [] };

describe("message language", () => {
  it("defaults to English for anything unknown", () => {
    expect([languageOf({}), languageOf(undefined), languageOf({ language: "French" }), languageOf({ language: "ta" }), languageOf({ language: "Hindi" }), languageOf({ language: " tamil " }), languageOf({ language: "Telugu" })]).toEqual(["en", "en", "en", "ta", "hi", "ta", "en"]);
    expect(LANGUAGES.map((l) => l.id)).toEqual(["en", "ta", "hi"]);
    expect(localized("recall", "en", {})).toBeNull();
    expect(localized("nonsense", "ta", {})).toBeNull();
  });
  it("keeps English messages exactly as they were", () => {
    expect(buildAppointmentReminder({ clinicName: "Smile", appt, kind: "dayBefore" })).toContain("This is a reminder from Smile");
    expect(buildAppointmentReminder({ clinicName: "Smile", appt, kind: "dayBefore", language: "en" })).toContain("tomorrow");
    expect(buildPaymentReminder({ clinicName: "Smile", inv })).toContain("₹3,000.00 is pending on invoice INV-1");
    expect(buildRecallMessage({ clinicName: "Smile", patient: { name: "Asha" }, months: 6 })).toContain("It has been 6 months");
  });
  it("writes the appointment reminder in Hindi and Tamil with the real details", () => {
    const hi = buildAppointmentReminder({ clinicName: "Smile", appt, kind: "dayBefore", language: "hi" });
    expect(hi).toContain("नमस्ते Asha");
    expect(hi).toContain("कल");
    expect(hi).toContain("10:30 AM");
    expect(hi).toContain("Dr T");
    const ta = buildAppointmentReminder({ clinicName: "Smile", appt, kind: "sameDay", language: "ta" });
    expect(ta).toContain("வணக்கம் Asha");
    expect(ta).toContain("இன்று");
    expect(ta).toContain("Smile");
  });
  it("includes the unpaid amount and UPI id in both languages, and leaves UPI out when none", () => {
    const hi = buildPaymentReminder({ clinicName: "Smile", inv, upiId: "smile@upi", language: "hi" });
    expect(hi).toContain("₹3,000.00");
    expect(hi).toContain("smile@upi");
    expect(buildPaymentReminder({ clinicName: "Smile", inv, language: "ta" })).not.toContain("UPI மூலம்");
    expect(buildPaymentReminder({ clinicName: "Smile", inv, upiId: "a@b", language: "ta" })).toContain("a@b");
  });
  it("writes recall with months and the clinic phone when there is one", () => {
    const ta = buildRecallMessage({ clinicName: "Smile", clinicPhone: "9876543210", patient: { name: "Asha" }, months: 6, language: "ta" });
    expect(ta).toContain("6 மாதங்கள்");
    expect(ta).toContain("9876543210");
    expect(buildRecallMessage({ clinicName: "Smile", patient: { name: "Asha" }, months: 12, language: "hi" })).not.toContain("कॉल करें");
  });
  it("greets in each language by first name", () => {
    expect(localized("birthday", "hi", { clinicName: "Smile", firstName: "Asha" })).toContain("जन्मदिन मुबारक, Asha");
    expect(localized("birthday", "ta", { clinicName: "Smile", firstName: "Asha" })).toContain("பிறந்தநாள் வாழ்த்துகள், Asha");
  });
});
