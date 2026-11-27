import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import PlanCard from "../src/components/PlanCard.jsx";
import { PAY_TO, PRICING_LIVE, PLANS } from "../src/plan.js";
import { isValidUpiId } from "../src/billing.js";

afterEach(cleanup);
const pending = async () => ({ status: "pending", plan: "pro" });
const props = { loadFn: async () => ({ plan: "", paidUntil: 0 }), myRequestFn: pending, clinic: "Smile Dental" };

describe("paying MeriDent by UPI", () => {
  it("has a valid payee and stays hidden while pricing is off", async () => {
    expect(isValidUpiId(PAY_TO.vpa)).toBe(true);
    expect(PRICING_LIVE).toBe(false);
    render(<PlanCard {...props} />);
    await screen.findByTestId("plan-request-status");
    expect(screen.queryByTestId("pay-meridient")).toBeNull();
  });
  it("shows the amount, the payee name and a pay link once pricing is live and a plan is requested", async () => {
    render(<PlanCard {...props} live />);
    const box = await screen.findByTestId("pay-meridient");
    const pro = PLANS.find((p) => p.id === "pro");
    expect(box.textContent).toContain(`₹${pro.monthly}`);
    expect(box.textContent).toContain(PAY_TO.name);
    const href = screen.getByRole("link", { name: "Pay with a UPI app" }).getAttribute("href");
    const q = new URL(href.replace("upi://", "https://x/")).searchParams;
    expect(q.get("pa")).toBe(PAY_TO.vpa);
    expect(q.get("pn")).toBe(PAY_TO.name);
    expect(q.get("am")).toBe(`${pro.monthly}.00`);
    expect(q.get("cu")).toBe("INR");
    expect(q.get("tn")).toContain("Smile Dental");
  });
  it("does not show the pay box before a request, or for a request already decided", async () => {
    render(<PlanCard {...props} live myRequestFn={async () => ({ status: "" })} />);
    await screen.findByText("Your plan");
    expect(screen.queryByTestId("pay-meridient")).toBeNull();
    cleanup();
    render(<PlanCard {...props} live myRequestFn={async () => ({ status: "approved", plan: "pro" })} />);
    await screen.findByTestId("plan-request-status");
    expect(screen.queryByTestId("pay-meridient")).toBeNull();
  });
  it("hides the box if the payee ID is not valid", async () => {
    render(<PlanCard {...props} live payTo={{ vpa: "nonsense", name: "x" }} />);
    await screen.findByTestId("plan-request-status");
    expect(screen.queryByTestId("pay-meridient")).toBeNull();
  });
});
