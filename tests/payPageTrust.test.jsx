import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import PayPage from "../src/components/PayPage.jsx";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const ks = "a".repeat(64);
const sealed = `?pay=1&pa=smile%40okhdfc&pn=Smile+Dental&am=500.00&u=uid1&ks=${ks}`;
const answer = (body, ok = true) => { global.fetch = vi.fn(async () => ({ ok, json: async () => body })); };

describe("pay page trust", () => {
  it("genuine sealed link: shows Verified and the Pay button", async () => {
    answer({ ok: true, configured: true });
    render(<PayPage search={sealed} />);
    expect(screen.queryByText("Pay with a UPI app")).toBeNull(); // not before the check finishes
    await screen.findByText(/Verified: this link was issued/);
    expect(screen.getByText("Pay with a UPI app")).toBeTruthy();
  });
  it("changed or forged link: blocks payment and says do not pay", async () => {
    answer({ ok: false, configured: true });
    render(<PayPage search={sealed} />);
    await screen.findByText(/changed or is not genuine/);
    expect(screen.queryByText("Pay with a UPI app")).toBeNull();
    expect(screen.queryByText(/UPI ID:/)).toBeNull();
  });
  it("older link without a seal: still works, with a caution", () => {
    render(<PayPage search="?pay=1&pa=smile%40okhdfc&pn=Smile+Dental&am=500.00" />);
    expect(screen.getByText(/could not be verified/)).toBeTruthy();
    expect(screen.getByText("Pay with a UPI app")).toBeTruthy();
  });
  it("cannot reach the check: caution, not a blocked payment", async () => {
    global.fetch = vi.fn(async () => { throw new Error("offline"); });
    render(<PayPage search={sealed} />);
    await waitFor(() => expect(screen.getByText(/could not be verified/)).toBeTruthy());
    expect(screen.getByText("Pay with a UPI app")).toBeTruthy();
  });
});
