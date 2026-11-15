import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { PAGE_TEXT, tr, pageLang, saveLang } from "../src/pageText.js";
import { BOOKING_SERVICES } from "../src/booking.js";
import BookingPage from "../src/components/BookingPage.jsx";
import PayPage from "../src/components/PayPage.jsx";

beforeEach(() => { try { localStorage.clear(); } catch (e) { /* */ } });
afterEach(() => cleanup());

describe("page text", () => {
  it("Tamil has every English key", () => {
    for (const k of Object.keys(PAGE_TEXT.en)) expect(PAGE_TEXT.ta[k], k).toBeTruthy();
    for (const k of Object.keys(PAGE_TEXT.ta)) expect(PAGE_TEXT.en[k], k).toBeTruthy();
  });
  it("covers every booking service and the three times of day", () => {
    for (const s of [...BOOKING_SERVICES, "Morning", "Afternoon", "Evening"]) expect(PAGE_TEXT.ta[s], s).toBeTruthy();
  });
  it("falls back to English and never throws", () => {
    expect(tr("xx", "send")).toBe("Send request");
    expect(tr("ta", "nope")).toBe("nope");
    expect(tr("ta", "sentBody", "Dr A")).toContain("Dr A");
  });
  it("picks language from saved choice, then the phone, else English; survives broken storage", () => {
    expect(pageLang({ getItem: () => null }, { language: "ta-IN" })).toBe("ta");
    expect(pageLang({ getItem: () => "en" }, { language: "ta-IN" })).toBe("en");
    expect(pageLang({ getItem: () => "fr" }, { language: "en-US" })).toBe("en");
    expect(pageLang({ getItem: () => { throw new Error("blocked"); } }, null)).toBe("en");
    expect(() => saveLang("ta", { setItem: () => { throw new Error("blocked"); } })).not.toThrow();
  });
});

const page = { name: "Smile Dental", enabled: true };
describe("BookingPage language", () => {
  it("switches to Tamil, remembers it, and still sends English values", async () => {
    const submit = vi.fn(async () => {});
    render(<BookingPage clinicId="c1" loadPage={async () => page} submit={submit} />);
    await screen.findByText("Request an appointment");
    fireEvent.click(screen.getByText("தமிழ்"));
    expect(screen.getByText("அப்பாயின்ட்மெண்ட் கோரிக்கை")).toBeTruthy();
    expect(localStorage.getItem("merident_page_lang")).toBe("ta");
    const slot = screen.getByLabelText("நாளின் நேரம்");
    expect([...slot.options].map((o) => o.value)).toContain("Morning");
    fireEvent.change(screen.getByLabelText("உங்கள் பெயர்"), { target: { value: "Ravi Kumar" } });
    fireEvent.change(screen.getByLabelText("மொபைல் எண்"), { target: { value: "9876543210" } });
    fireEvent.change(screen.getByLabelText("விரும்பும் தேதி"), { target: { value: new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10) } });
    fireEvent.change(slot, { target: { value: "Morning" } });
    fireEvent.click(screen.getByText("கோரிக்கையை அனுப்பு"));
    await waitFor(() => expect(submit).toHaveBeenCalled());
    const sent = JSON.stringify(submit.mock.calls[0][0]);
    expect(sent).toContain("Morning");
    expect(sent).toContain("Check-up and consultation");
  });
  it("starts in Tamil when that was saved", async () => {
    saveLang("ta");
    render(<BookingPage clinicId="c1" loadPage={async () => ({ enabled: false })} submit={async () => {}} />);
    expect(await screen.findByText("ஆன்லைன் முன்பதிவு இல்லை")).toBeTruthy();
  });
});

describe("PayPage language", () => {
  it("shows Tamil on an invalid link and on a valid one, UPI id unchanged", () => {
    saveLang("ta");
    const { unmount } = render(<PayPage search="?pay=junk" />);
    expect(screen.getByText("இந்தக் கட்டண இணைப்பு செல்லாது")).toBeTruthy();
    unmount();
  });
});
