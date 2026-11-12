import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { buildPayLink, parsePayLink } from "../src/payLink.js";
import { buildPaymentReminder } from "../src/reminders.js";
import PayPage from "../src/components/PayPage.jsx";

const link = buildPayLink("https://www.meridiandentalos.com/", { vpa: "smile@okhdfc", name: "Smile Dental", amountP: 49999, note: "INV-26-27-001" });

describe("UPI payment link", () => {
  it("builds a link with no patient name in it", () => {
    expect(link).toBe("https://www.meridiandentalos.com/?pay=1&pa=smile%40okhdfc&pn=Smile+Dental&am=499.99&tn=INV-26-27-001");
    expect(buildPayLink("https://x.in", { vpa: "not a upi id", amountP: 100 })).toBe("");
  });
  it("reads it back and rejects anything odd", () => {
    expect(parsePayLink(new URL(link).search)).toEqual({ vpa: "smile@okhdfc", name: "Smile Dental", amountP: 49999, note: "INV-26-27-001" });
    expect(parsePayLink("?pay=1&pa=bad")).toBeNull();
    expect(parsePayLink("?pa=a@b")).toBeNull();
    expect(parsePayLink("?pay=1&pa=ab@upi&am=-5")).toBeNull();
    expect(parsePayLink("?pay=1&pa=ab@upi&am=99999999")).toBeNull();
    expect(parsePayLink("?pay=1&pa=ab@upi&am=1e5")).toBeNull();
    expect(parsePayLink("?pay=1&pa=ab@upi")).toMatchObject({ amountP: 0 });
  });
  it("adds the link to the payment reminder", () => {
    const inv = { patient: "A", id: "INV-1", totalP: 100000, payments: [] };
    const t = buildPaymentReminder({ clinicName: "Smile", inv, payLink: link });
    expect(t).toContain(`Pay now: ${link}`);
    expect(buildPaymentReminder({ clinicName: "Smile", inv })).not.toContain("Pay now");
  });
  it("shows the amount, the UPI button and the payee, and explains a bad link", () => {
    const { unmount } = render(<PayPage search={new URL(link).search} />);
    expect(screen.getByText("₹499.99")).toBeTruthy();
    expect(screen.getByText("Pay with a UPI app").getAttribute("href")).toMatch(/^upi:\/\/pay\?pa=smile%40okhdfc/);
    expect(screen.getByText("smile@okhdfc")).toBeTruthy();
    unmount();
    render(<PayPage search="?pay=1&pa=bad" />);
    expect(screen.getByText("This payment link is not valid")).toBeTruthy();
  });
});
