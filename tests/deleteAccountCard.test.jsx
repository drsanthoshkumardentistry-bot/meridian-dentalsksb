import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import DeleteAccountCard from "../src/components/DeleteAccountCard.jsx";
import { deleteMyAccount } from "../src/deleteAccount.js";

afterEach(cleanup);
const open = () => fireEvent.click(screen.getByRole("button", { name: /Delete account/ }));

describe("delete account card", () => {
  it("stays closed until asked, then needs the checkbox and the typed word", () => {
    render(<DeleteAccountCard deleteFn={vi.fn()} />);
    expect(screen.queryByText("Delete everything")).toBeNull();
    open();
    const btn = screen.getByRole("button", { name: "Delete everything" });
    expect(btn.disabled).toBe(true);
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.change(screen.getByLabelText(/Type DELETE/), { target: { value: "delete" } });
    expect(btn.disabled).toBe(true); // wrong case
    fireEvent.change(screen.getByLabelText(/Type DELETE/), { target: { value: "DELETE" } });
    expect(btn.disabled).toBe(false);
  });
  it("deletes once confirmed and tells the app", async () => {
    const del = vi.fn(async () => true), done = vi.fn();
    render(<DeleteAccountCard deleteFn={del} onDeleted={done} />);
    open(); fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.change(screen.getByLabelText(/Type DELETE/), { target: { value: "DELETE" } });
    fireEvent.click(screen.getByRole("button", { name: "Delete everything" }));
    await waitFor(() => expect(done).toHaveBeenCalled());
    expect(del).toHaveBeenCalledTimes(1);
  });
  it("explains when a fresh sign-in is needed and offers to sign out", async () => {
    const del = vi.fn(async () => { const e = new Error("For safety, sign out and sign in again"); e.code = "recent-login"; throw e; });
    const out = vi.fn();
    render(<DeleteAccountCard deleteFn={del} onSignOut={out} />);
    open(); fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.change(screen.getByLabelText(/Type DELETE/), { target: { value: "DELETE" } });
    fireEvent.click(screen.getByRole("button", { name: "Delete everything" }));
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
