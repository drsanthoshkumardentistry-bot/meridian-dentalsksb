import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AdminAccessProblem, { adminProblemText } from "../src/components/AdminAccessProblem.jsx";
import { loadOverview } from "../src/adminApi.js";

const res = (status, body) => ({ status, ok: status >= 200 && status < 300, json: async () => body });

describe("admin access diagnosis", () => {
  it("explains each server answer in plain words", () => {
    expect(adminProblemText({ status: 403 })).toMatch(/FOUNDER_EMAILS/);
    expect(adminProblemText({ status: 503 })).toMatch(/FIREBASE_SERVICE_ACCOUNT/);
    expect(adminProblemText({ status: 401 })).toMatch(/sign in again/i);
    expect(adminProblemText({ status: 502, message: "boom" })).toMatch(/boom/);
    expect(adminProblemText({ status: 0, message: "offline" })).toMatch(/offline/);
  });
  it("shows who is signed in and the reason", () => {
    render(<AdminAccessProblem email="a@x.com" problem={{ status: 403 }} onRetry={() => {}} onHome={() => {}} />);
    expect(screen.getByText("a@x.com")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toMatch(/founder list/);
  });
  it("loadOverview reports the status and still returns null for 403", async () => {
    let seen;
    expect(await loadOverview({ getToken: async () => "t", fetchFn: async () => res(403, { error: "Not available." }), onStatus: (s, m) => { seen = [s, m]; } })).toBeNull();
    expect(seen).toEqual([403, "Not available."]);
    await expect(loadOverview({ getToken: async () => "t", fetchFn: async () => res(503, { error: "Add it." }) })).rejects.toThrow("Add it.");
  });
});
