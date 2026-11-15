import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import DeleteAccountCard from "../src/components/DeleteAccountCard.jsx";
import { deleteMyAccount } from "../src/deleteAccount.js";

afterEach(cleanup);
const open = () => fireEvent.click(screen.getByRole("button", { name: /Delete account/ }));

describe("delete account card", () => {
  it("stays closed until asked, then needs the checkbox and the typed word", () => {
    render(<DeleteAccountCard deleteFn={vi.fn()} requestCodeFn={vi.fn()} />);
    expect(screen.queryByText("Email me a code")).toBeNull();
    open();
    const btn = screen.getByRole("button", { name: "Email me a code" });
    expect(btn.disabled).toBe(true);
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.change(screen.getByLabelText(/Type DELETE/), { target: { value: "delete" } });
    expect(btn.disabled).toBe(true); // wrong case
    fireEvent.change(screen.getByLabelText(/Type DELETE/), { target: { value: "DELETE" } });
    expect(btn.disabled).toBe(false);
  });
  it("needs the emailed code before it deletes, then tells the app", async () => {
    const del = vi.fn(async () => true), done = vi.fn(), ask = vi.fn(async () => ({ ticket: "T1", to: "a***@gmail.com" }));
    render(<DeleteAccountCard deleteFn={del} onDeleted={done} requestCodeFn={ask} />);
    open(); fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.change(screen.getByLabelText(/Type DELETE/), { target: { value: "DELETE" } });
    fireEvent.click(screen.getByRole("button", { name: "Email me a code" }));
    await screen.findByText(/a\*\*\*@gmail.com/);
    expect(del).not.toHaveBeenCalled();
    const go = screen.getByRole("button", { name: "Delete everything" });
    expect(go.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/Code from the email/), { target: { value: "1234" } });
    expect(go.disabled).toBe(true); // too short
    fireEvent.change(screen.getByLabelText(/Code from the email/), { target: { value: "1234 5678" } });
    expect(go.disabled).toBe(false);
    fireEvent.click(go);
    await waitFor(() => expect(done).toHaveBeenCalled());
    expect(del).toHaveBeenCalledWith({ code: "12345678", ticket: "T1" });
  });
  it("shows the server's message when email codes are not switched on", async () => {
    const ask = vi.fn(async () => { const e = new Error("Email codes are not switched on yet."); e.code = "no-mail"; throw e; });
    render(<DeleteAccountCard deleteFn={vi.fn()} requestCodeFn={ask} />);
    open(); fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.change(screen.getByLabelText(/Type DELETE/), { target: { value: "DELETE" } });
    fireEvent.click(screen.getByRole("button", { name: "Email me a code" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.queryByTestId("delete-code-step")).toBeNull();
  });
  it("explains when a fresh sign-in is needed and offers to sign out", async () => {
    const ask = vi.fn(async () => { const e = new Error("For safety, sign out and sign in again"); e.code = "recent-login"; throw e; });
    const out = vi.fn();
    render(<DeleteAccountCard deleteFn={vi.fn()} requestCodeFn={ask} onSignOut={out} />);
    open(); fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.change(screen.getByLabelText(/Type DELETE/), { target: { value: "DELETE" } });
    fireEvent.click(screen.getByRole("button", { name: "Email me a code" }));
    await screen.findByText(/sign out and sign in again/);
    fireEvent.click(screen.getByRole("button", { name: "Sign out now" }));
    expect(out).toHaveBeenCalled();
  });
});

describe("deleteMyAccount", () => {
  it("keeps asking until the server says done", async () => {
    const answers = [{ done: false }, { done: false }, { done: true }];
    const f = vi.fn(async () => ({ ok: true, json: async () => answers.shift() }));
    await expect(deleteMyAccount({ fetchFn: f, getToken: async () => "t" })).resolves.toBe(true);
    expect(f).toHaveBeenCalledTimes(3);
  });
  it("stops with the server's message on an error", async () => {
    const f = vi.fn(async () => ({ ok: false, json: async () => ({ error: "nope", code: "recent-login" }) }));
    await expect(deleteMyAccount({ fetchFn: f, getToken: async () => "t" })).rejects.toMatchObject({ message: "nope", code: "recent-login" });
  });
});

import { requestDeleteCode } from "../src/deleteAccount.js";
describe("requestDeleteCode", () => {
  it("returns the ticket and masked address, or the server's message", async () => {
    const ok = vi.fn(async () => ({ ok: true, json: async () => ({ ticket: "T", to: "a***@b.in" }) }));
    await expect(requestDeleteCode({ fetchFn: ok, getToken: async () => "t" })).resolves.toEqual({ ticket: "T", to: "a***@b.in" });
    expect(JSON.parse(ok.mock.calls[0][1].body)).toMatchObject({ step: "request" });
    const no = vi.fn(async () => ({ ok: false, json: async () => ({ error: "nope", code: "no-mail" }) }));
    await expect(requestDeleteCode({ fetchFn: no, getToken: async () => "t" })).rejects.toMatchObject({ message: "nope", code: "no-mail" });
  });
});
