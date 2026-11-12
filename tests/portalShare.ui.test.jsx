import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import PortalShare from "../src/components/PortalShare.jsx";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("PortalShare", () => {
  it("publishes, then points the opened tab at WhatsApp with the private link", async () => {
    const tab = { location: {}, close: vi.fn() };
    vi.spyOn(window, "open").mockReturnValue(tab);
    const onPublish = vi.fn(async () => "tok123");
    render(<PortalShare patient={{ id: "P1", name: "Asha", phone: "9876543210" }} clinicName="Smile" onPublish={onPublish} onRevoke={() => {}} showToast={() => {}} />);
    fireEvent.click(screen.getByText(/Create link and send on WhatsApp/));
    await waitFor(() => expect(tab.location.href).toContain("wa.me/919876543210"));
    expect(decodeURIComponent(tab.location.href)).toContain("?portal=tok123");
  });
  it("does not send to a patient who opted out of WhatsApp", () => {
    const open = vi.spyOn(window, "open");
    const toast = vi.fn();
    render(<PortalShare patient={{ id: "P1", name: "Asha", phone: "9876543210", consent: { whatsapp: false } }} clinicName="Smile" onPublish={vi.fn()} onRevoke={() => {}} showToast={toast} />);
    fireEvent.click(screen.getByText(/Create link and send on WhatsApp/));
    expect(open).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(expect.stringMatching(/not agreed/));
  });
  it("offers to switch off an existing link", () => {
    render(<PortalShare patient={{ id: "P1", name: "Asha", phone: "9876543210", portalToken: "t" }} clinicName="S" onPublish={vi.fn()} onRevoke={() => {}} showToast={() => {}} />);
    expect(screen.getByText("Switch off")).toBeTruthy();
  });
});
