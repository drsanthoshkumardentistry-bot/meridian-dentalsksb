import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import QuickSearch, { searchAdmin } from "../src/components/QuickSearch.jsx";
import { weeklySignups } from "../src/components/Insights.jsx";

afterEach(cleanup);
const clinics = [{ uid: "u1", email: "Smile@clinic.in", state: "paid" }, { uid: "u2", email: "other@x.com", state: "unpaid" }];

describe("quick search", () => {
  it("matches clinics by email and pages by name", () => {
    expect(searchAdmin("smile", clinics).clinics.map((c) => c.uid)).toEqual(["u1"]);
    expect(searchAdmin("bill", clinics).pages.map((p) => p[0])).toEqual(["billing"]);
    expect(searchAdmin("", clinics).clinics).toEqual([]);
    expect(searchAdmin("", clinics).pages).toHaveLength(4);
  });
  it("opens from the button or Ctrl+K, jumps to a clinic, and closes with Escape", () => {
    const onClinic = vi.fn(); const onPage = vi.fn();
    render(<QuickSearch clinics={clinics} onClinic={onClinic} onPage={onPage} />);
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    fireEvent.change(screen.getByLabelText("Search by clinic email or page"), { target: { value: "SMILE" } });
    fireEvent.click(screen.getByText("Smile@clinic.in"));
    expect(onClinic).toHaveBeenCalledWith(clinics[0]);
    expect(screen.queryByTestId("quick-search")).toBeNull();
    fireEvent.click(screen.getByLabelText("Search clinics and pages"));
    fireEvent.click(screen.getByText("Go to Billing & approvals"));
    expect(onPage).toHaveBeenCalledWith("billing");
    fireEvent.click(screen.getByLabelText("Search clinics and pages"));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByTestId("quick-search")).toBeNull();
  });
  it("says when nothing matches and ignores the slash key while typing in a field", () => {
    render(<div><input aria-label="other" /><QuickSearch clinics={clinics} onClinic={() => {}} onPage={() => {}} /></div>);
    fireEvent.keyDown(screen.getByLabelText("other"), { key: "/" });
    expect(screen.queryByTestId("quick-search")).toBeNull();
    fireEvent.keyDown(window, { key: "/" });
    fireEvent.change(screen.getByLabelText("Search by clinic email or page"), { target: { value: "zzzz" } });
    expect(screen.getByText(/No clinic or page matches/)).toBeTruthy();
  });
});

describe("weekly signups", () => {
  it("counts new clinics per week, newest last", () => {
    const now = 1e12; const D = 86400000;
    const w = weeklySignups([{ created: now - D }, { created: now - 2 * D }, { created: now - 9 * D }, { created: now - 100 * D }, {}], now);
    expect(w).toHaveLength(8);
    expect(w[7].count).toBe(2);
    expect(w[6].count).toBe(1);
    expect(w.reduce((n, x) => n + x.count, 0)).toBe(3);
  });
});
