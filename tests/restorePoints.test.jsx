import React from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import DataPortability from "../src/components/DataPortability.jsx";
import { buildBackup } from "../src/portability.js";
import { dueForRestorePoint, looksComplete, chunkText, joinChunks, toDelete, pointId, describePoint, CHUNK_CHARS, MIN_GAP_HOURS } from "../src/restorePoints.js";

afterEach(() => cleanup());
const now = new Date("2026-11-13T10:00:00Z");
const hoursAgo = (h) => new Date(now.getTime() - h * 3600000).toISOString();
const pt = (id, h, patients = 10) => ({ id, at: hoursAgo(h), counts: { patients, appointments: 5, invoices: 5 } });

describe("restore point rules", () => {
  it("saves one when there is none, or the newest is a day old", () => {
    expect(dueForRestorePoint([], now)).toBe(true);
    expect(dueForRestorePoint([pt("a", MIN_GAP_HOURS - 1)], now)).toBe(false);
    expect(dueForRestorePoint([pt("a", 5), pt("b", 30)], now)).toBe(false);
    expect(dueForRestorePoint([pt("b", 30)], now)).toBe(true);
    expect(dueForRestorePoint(null, now)).toBe(true);
  });
  it("does not save a half-loaded clinic", () => {
    expect(looksComplete({ patients: 0, appointments: 0, invoices: 0 }, [])).toBe(false);
    expect(looksComplete({ patients: 3 }, [])).toBe(true);
    expect(looksComplete({ patients: 5 }, [pt("a", 30, 100)])).toBe(false);
    expect(looksComplete({ patients: 95 }, [pt("a", 30, 100)])).toBe(true);
  });
  it("splits and rejoins large text without losing a character", () => {
    const text = "é".repeat(CHUNK_CHARS * 2 + 17);
    const parts = chunkText(text);
    expect(parts.length).toBe(3);
    expect(parts.every((p) => p.length <= CHUNK_CHARS)).toBe(true);
    expect(joinChunks(parts)).toBe(text);
    expect(chunkText("")).toEqual([""]);
  });
  it("keeps only the newest three", () => {
    const list = [pt("old", 100), pt("c", 10), pt("a", 1), pt("b", 5)];
    expect(toDelete(list)).toEqual(["old"]);
    expect(toDelete([pt("a", 1)])).toEqual([]);
  });
  it("names points by time and describes them in plain words", () => {
    expect(pointId(now)).toBe("rp-20261113100000");
    expect(describePoint(pt("a", 1, 42))).toMatch(/42 patients, 5 appointments, 5 invoices/);
    expect(describePoint({ id: "x", at: "bad" })).toMatch(/Unknown time/);
  });
});

describe("restore points in Settings", () => {
  const data = { patients: [], appointments: [], invoices: [], inventory: [], employees: [], profile: {} };
  const base = { data, newId: (p) => `${p}-1`, onDownloadFile: () => {}, onImported: () => {}, onAudit: () => {} };

  it("is hidden when there is no restore feature (managers)", () => {
    render(<DataPortability {...base} />);
    expect(screen.queryByTestId("restore-points")).toBeNull();
  });
  it("shows the empty state and saves one on request", () => {
    const saveNow = vi.fn();
    render(<DataPortability {...base} restore={{ points: [], busy: false, error: "", saveNow, load: vi.fn() }} />);
    expect(screen.getByText(/No restore point yet/)).toBeTruthy();
    fireEvent.click(screen.getByText("Save a restore point now"));
    expect(saveNow).toHaveBeenCalledWith({ force: true });
  });
  it("opens a restore point as an import preview that adds only what is missing", async () => {
    const backup = buildBackup({ ...data, patients: [{ id: "P-9", name: "Asha Rao", phone: "9876543210" }] }, now);
    const load = vi.fn().mockResolvedValue(backup);
    render(<DataPortability {...base} restore={{ points: [pt("rp-1", 3, 1)], busy: false, error: "", saveNow: vi.fn(), load }} />);
    fireEvent.click(screen.getByText("Restore"));
    await waitFor(() => expect(screen.getByTestId("import-preview")).toBeTruthy());
    expect(load).toHaveBeenCalled();
    expect(screen.getByTestId("import-preview").textContent).toMatch(/1 patient/i);
  });
  it("shows an error from the store", () => {
    render(<DataPortability {...base} restore={{ points: [], busy: false, error: "Could not open this restore point.", saveNow: vi.fn(), load: vi.fn() }} />);
    expect(screen.getByText("Could not open this restore point.")).toBeTruthy();
  });
});
