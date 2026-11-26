import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { planStatus, subscribeText, PRICING_LIVE, DAY_MS } from "../src/plan.js";
import PlanCard from "../src/components/PlanCard.jsx";

afterEach(cleanup);
const now = 1.8e12;
describe("planStatus", () => {
  it("pricing is switched off for the trial run, so nobody is ever blocked", () => {
    expect(PRICING_LIVE).toBe(false);
    for (const c of [undefined, null, 0, "junk", now - 999 * DAY_MS]) expect(planStatus({ createdAt: c, now }).allowed).toBe(true);
    expect(planStatus({ now }).state).toBe("free");
  });
  it("when live: trial counts down, ends after 30 days, paid wins", () => {
    const live = (o) => planStatus({ live: true, now, ...o });
    expect(live({ createdAt: now - 2 * DAY_MS })).toMatchObject({ state: "trial", daysLeft: 28, allowed: true });
    expect(live({ createdAt: now - 29.5 * DAY_MS }).daysLeft).toBe(1);
    expect(live({ createdAt: now - 31 * DAY_MS })).toMatchObject({ state: "ended", allowed: false });
    expect(live({ createdAt: now - 99 * DAY_MS, paidUntil: now + 10 * DAY_MS, plan: "pro" })).toMatchObject({ state: "paid", plan: "pro", daysLeft: 10 });
    expect(live({ createdAt: now - 99 * DAY_MS, paidUntil: now - DAY_MS }).state).toBe("ended");
  });
  it("when live: unknown or broken dates never lock a clinic out; ISO text works", () => {
    for (const c of [undefined, null, "", "nonsense", NaN, -5]) expect(planStatus({ live: true, now, createdAt: c }).allowed).toBe(true);
    expect(planStatus({ live: true, now, createdAt: new Date(now - 40 * DAY_MS).toUTCString() }).state).toBe("ended");
  });
});
describe("subscribeText", () => {
  it("names the plan and clinic only", () => {
    expect(subscribeText({ planId: "pro", clinic: "Smile" })).toBe("MeriDent: I am interested in the Growth plan (₹999/month).\nClinic: Smile");
    expect(subscribeText({ yearly: true })).toContain("₹4,999 per year");
    expect(() => subscribeText({ planId: "zzz", clinic: null })).not.toThrow();
  });
});
describe("PlanCard", () => {
  it("says it is free during the trial run and links to WhatsApp with the chosen plan", () => {
    render(<PlanCard clinic="Smile Dental" />);
    expect(screen.getByTestId("plan-card").textContent).toMatch(/trial run/);
    expect(screen.getByTestId("plan-card").textContent).toMatch(/nobody is being charged/);
    fireEvent.click(screen.getByLabelText("Growth plan"));
    const href = screen.getByText(/Message us on WhatsApp/).getAttribute("href");
    expect(decodeURIComponent(href)).toContain("Growth plan");
    expect(decodeURIComponent(href)).toContain("Smile Dental");
  });
});
