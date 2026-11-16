import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import RecycleBinCard from "../src/components/RecycleBinCard.jsx";
import { makeBinEntry, recordOf, daysLeft, expiredIds, describeEntry, sortedEntries, binId, BIN_DAYS } from "../src/recycleBin.js";

afterEach(cleanup);
const NOW = new Date("2026-11-16T05:00:00Z");
const patient = JSON.stringify({ id: "P1", name: "Asha", phone: "9876543210", age: "34" });

describe("recently deleted helpers", () => {
  it("keeps a copy of a deleted patient or invoice, and nothing else", () => {
    const e = makeBinEntry("patients", "P1", patient, NOW);
    expect(e).toMatchObject({ id: "patients__P1", coll: "patients", recordId: "P1", json: patient });
    expect(makeBinEntry("invoices", "INV/2026/1", "{}", NOW).id).toBe("invoices__INV_2026_1");
    expect(makeBinEntry("inventory", "S1", "{}", NOW)).toBeNull();
    expect(makeBinEntry("patients", "P1", "__sync_failed__", NOW)).toBeNull();
    expect(makeBinEntry("patients", "P1", "x".repeat(900001), NOW)).toBeNull();
    expect(makeBinEntry("patients", "", "{}", NOW)).toBeNull();
    expect(binId("patients", "a b/c")).toBe("patients__a_b_c");
  });
  it("reads the record back, and says so when the copy is broken", () => {
    expect(recordOf({ json: patient }).name).toBe("Asha");
    expect(recordOf({ json: "{oops" })).toBeNull();
    expect(recordOf({ json: "[1]" })).toBeNull();
    expect(recordOf(null)).toBeNull();
  });
  it("counts the 30 days and lists what has run out", () => {
    const day = (n) => new Date(NOW.getTime() - n * 86400000).toISOString();
    expect(daysLeft({ deletedAt: day(0) }, NOW)).toBe(BIN_DAYS);
    expect(daysLeft({ deletedAt: day(29) }, NOW)).toBe(1);
    expect(daysLeft({ deletedAt: day(45) }, NOW)).toBe(0);
    expect(daysLeft({ deletedAt: "bad" }, NOW)).toBe(0);
    expect(expiredIds([{ id: "a", deletedAt: day(31) }, { id: "b", deletedAt: day(2) }, { id: "c", deletedAt: "bad" }], NOW)).toEqual(["a", "c"]);
    expect(expiredIds(null, NOW)).toEqual([]);
  });
  it("describes and sorts entries", () => {
    expect(describeEntry({ coll: "patients", json: patient })).toEqual({ title: "Asha", detail: "9876543210 · 34 yrs" });
    expect(describeEntry({ coll: "invoices", recordId: "I1", json: JSON.stringify({ id: "I1", patientName: "Ravi", date: "2026-11-01" }) }).title).toBe("Invoice I1");
    expect(describeEntry({ coll: "patients", json: "{bad" }).title).toBe("Unnamed patient");
    expect(sortedEntries([{ id: "a", coll: "patients", json: "{}", deletedAt: "2026-11-01" }, { id: "b", coll: "patients", json: "{}", deletedAt: "2026-11-10" }, null, { id: "c" }]).map((e) => e.id)).toEqual(["b", "a"]);
  });
});

describe("recently deleted card", () => {
  const entry = (over = {}) => ({ id: "patients__P1", coll: "patients", recordId: "P1", deletedAt: new Date().toISOString(), json: patient, ...over });
  it("stays closed until opened, then lists deleted records", async () => {
    const load = vi.fn(async () => [entry()]);
    render(<RecycleBinCard loadFn={load} restoreFn={vi.fn()} removeFn={vi.fn()} />);
    expect(load).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Show" }));
    expect(await screen.findByText("Asha")).toBeTruthy();
    expect(screen.getByText(/30 days left/)).toBeTruthy();
  });
  it("restores a record and tells the app", async () => {
    const restore = vi.fn(async () => true), done = vi.fn();
    render(<RecycleBinCard loadFn={async () => [entry()]} restoreFn={restore} removeFn={vi.fn()} onRestored={done} />);
    fireEvent.click(screen.getByRole("button", { name: "Show" }));
    fireEvent.click(await screen.findByRole("button", { name: "Restore Asha" }));
    await waitFor(() => expect(done).toHaveBeenCalled());
    expect(restore).toHaveBeenCalledWith(expect.objectContaining({ id: "patients__P1" }));
    expect(await screen.findByText(/Asha was restored/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Restore Asha" })).toBeNull();
  });
  it("says so when nothing is deleted, when a copy is unreadable, and when loading fails", async () => {
    const { unmount } = render(<RecycleBinCard loadFn={async () => []} restoreFn={vi.fn()} removeFn={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Show" }));
    expect(await screen.findByText(/Nothing deleted/)).toBeTruthy();
    unmount();
    render(<RecycleBinCard loadFn={async () => [entry()]} restoreFn={async () => false} removeFn={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Show" }));
    fireEvent.click(await screen.findByRole("button", { name: "Restore Asha" }));
    expect(await screen.findByText(/cannot be read/)).toBeTruthy();
    cleanup();
    render(<RecycleBinCard loadFn={async () => { throw new Error("offline"); }} restoreFn={vi.fn()} removeFn={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Show" }));
    expect(await screen.findByText(/Could not load/)).toBeTruthy();
  });
  it("can delete a copy for good", async () => {
    const rm = vi.fn(async () => {});
    render(<RecycleBinCard loadFn={async () => [entry()]} restoreFn={vi.fn()} removeFn={rm} />);
    fireEvent.click(screen.getByRole("button", { name: "Show" }));
    fireEvent.click(await screen.findByRole("button", { name: "Delete Asha for good" }));
    await waitFor(() => expect(rm).toHaveBeenCalled());
    expect(await screen.findByText(/Nothing deleted/)).toBeTruthy();
  });
});
