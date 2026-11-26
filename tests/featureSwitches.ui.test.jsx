import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import FeatureSwitches from "../src/components/FeatureSwitches.jsx";

afterEach(cleanup);

describe("feature switches screen", () => {
  it("shows each feature and switches one off", async () => {
    const loadFn = vi.fn().mockResolvedValue({ ai: true, whatsapp: true });
    const saveFn = vi.fn().mockResolvedValue({ ai: false, whatsapp: true });
    const onToast = vi.fn();
    render(<FeatureSwitches loadFn={loadFn} saveFn={saveFn} onToast={onToast} />);
    const sw = await screen.findByRole("switch", { name: /Meridee.*on/ });
    fireEvent.click(sw);
    await waitFor(() => expect(saveFn).toHaveBeenCalledWith({ key: "ai", on: false }));
    await waitFor(() => expect(screen.getByRole("switch", { name: /Meridee.*off/ })).toBeTruthy());
    expect(screen.getByRole("switch", { name: /WhatsApp.*on/ })).toBeTruthy();
    expect(onToast).toHaveBeenCalledWith("Switched off for all clinics.");
  });
  it("shows the server's error and keeps the old state", async () => {
    const saveFn = vi.fn().mockRejectedValue(new Error("Sign out and in."));
    const onToast = vi.fn();
    render(<FeatureSwitches loadFn={async () => ({ ai: true, whatsapp: true })} saveFn={saveFn} onToast={onToast} />);
    fireEvent.click(await screen.findByRole("switch", { name: /WhatsApp.*on/ }));
    await waitFor(() => expect(onToast).toHaveBeenCalledWith("Sign out and in."));
    expect(screen.getByRole("switch", { name: /WhatsApp.*on/ })).toBeTruthy();
  });
});
