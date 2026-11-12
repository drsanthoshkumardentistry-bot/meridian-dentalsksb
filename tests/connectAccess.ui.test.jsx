import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import ConnectAccess from "../src/components/ConnectAccess.jsx";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const makeApi = (over = {}) => ({
  listAllowed: vi.fn(async () => [{ email: "me@gmail.com" }, { email: "dr@gmail.com" }]),
  getRestrict: vi.fn(async () => false),
  addAllowed: vi.fn(async () => {}), removeAllowed: vi.fn(async () => {}), setRestrict: vi.fn(async () => {}),
  ...over,
});

describe("approved email list screen", () => {
  it("adds a lower-cased address and rejects a bad one", async () => {
    const api = makeApi(); const toast = vi.fn();
    render(<ConnectAccess api={api} myEmail="Me@Gmail.com" showToast={toast} />);
    await screen.findByText("dr@gmail.com");
    fireEvent.change(screen.getByLabelText("Email address to approve"), { target: { value: "nope" } });
    fireEvent.click(screen.getByText("Approve"));
    expect(toast).toHaveBeenCalledWith(expect.stringMatching(/full email/));
    fireEvent.change(screen.getByLabelText("Email address to approve"), { target: { value: " New@Gmail.com " } });
    fireEvent.click(screen.getByText("Approve"));
    await waitFor(() => expect(api.addAllowed).toHaveBeenCalledWith("new@gmail.com"));
  });
  it("will not switch the restriction on unless your own address is listed", async () => {
    const api = makeApi({ listAllowed: vi.fn(async () => [{ email: "dr@gmail.com" }]) }); const toast = vi.fn();
    render(<ConnectAccess api={api} myEmail="me@gmail.com" showToast={toast} />);
    await screen.findByText("dr@gmail.com");
    fireEvent.click(screen.getByRole("switch"));
    expect(toast).toHaveBeenCalledWith(expect.stringMatching(/your own address/));
    expect(api.setRestrict).not.toHaveBeenCalled();
  });
  it("switches on after confirmation, and protects your own entry while on", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const api = makeApi(); const toast = vi.fn();
    render(<ConnectAccess api={api} myEmail="me@gmail.com" showToast={toast} />);
    await screen.findByText("dr@gmail.com");
    fireEvent.click(screen.getByRole("switch"));
    await waitFor(() => expect(api.setRestrict).toHaveBeenCalledWith(true));
    fireEvent.click(await screen.findByLabelText("Remove me@gmail.com"));
    expect(toast).toHaveBeenCalledWith(expect.stringMatching(/cannot remove your own/));
    expect(api.removeAllowed).not.toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText("Remove dr@gmail.com"));
    await waitFor(() => expect(api.removeAllowed).toHaveBeenCalledWith("dr@gmail.com"));
  });
});
