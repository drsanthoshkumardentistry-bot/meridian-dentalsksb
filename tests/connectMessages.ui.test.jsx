import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import ConnectMessages from "../src/components/ConnectMessages.jsx";

afterEach(cleanup);

const me = { fullName: "Dr Me" };
const makeApi = (over = {}) => ({
  uid: "me",
  listChats: vi.fn(async () => [{ id: "me_zed", members: ["me", "zed"], names: { zed: "Dr Zed" }, lastText: "Hi there", lastSenderId: "zed", updatedAt: null }]),
  blockedSet: vi.fn(async () => new Set()),
  listMessages: vi.fn(async () => [{ id: "m1", senderId: "zed", text: "Hi there", createdAt: null }]),
  sendMessage: vi.fn(async () => "me_zed"),
  setBlocked: vi.fn(async () => {}),
  ...over,
});

describe("Connect messages", () => {
  it("lists conversations, opens one, and sends a message", async () => {
    const api = makeApi();
    const toast = vi.fn();
    render(<ConnectMessages api={api} me={me} showToast={toast} />);
    fireEvent.click(await screen.findByText("Dr Zed"));
    expect(await screen.findByText("Hi there", { selector: "div.whitespace-pre-wrap" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "Thanks, will refer" } });
    fireEvent.click(screen.getByText("Send"));
    await waitFor(() => expect(api.sendMessage).toHaveBeenCalledWith(me, "zed", "Thanks, will refer"));
  });
  it("refuses messages with phone numbers or links", async () => {
    const api = makeApi();
    const toast = vi.fn();
    render(<ConnectMessages api={api} me={me} start={{ id: "zed", name: "Dr Zed" }} showToast={toast} />);
    fireEvent.change(await screen.findByLabelText("Message"), { target: { value: "call 9876543210" } });
    fireEvent.click(screen.getByText("Send"));
    expect(toast).toHaveBeenCalledWith(expect.stringMatching(/Remove a phone/));
    expect(api.sendMessage).not.toHaveBeenCalled();
  });
  it("blocks a dentist and hides the message box", async () => {
    const api = makeApi();
    render(<ConnectMessages api={api} me={me} start={{ id: "zed", name: "Dr Zed" }} showToast={vi.fn()} />);
    fireEvent.click(await screen.findByText("Block"));
    await waitFor(() => expect(api.setBlocked).toHaveBeenCalledWith("zed", true));
    expect(await screen.findByText(/You blocked this dentist/)).toBeTruthy();
    expect(screen.queryByLabelText("Message")).toBeNull();
  });
});
