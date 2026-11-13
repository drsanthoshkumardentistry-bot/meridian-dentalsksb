import React from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import ConnectionBar from "../src/components/ConnectionBar.jsx";
import { backupAgeDays, backupNotification, markBackupDone, readLastBackup, BACKUP_REMIND_DAYS } from "../src/reliability.js";
import { buildNotifications } from "../src/notifications.js";

afterEach(() => { cleanup(); vi.useRealTimers(); });
const now = new Date("2026-11-13T10:00:00Z");
const daysAgo = (n) => new Date(now.getTime() - n * 86400000).toISOString();

describe("backup reminder", () => {
  it("counts whole days and tolerates bad values", () => {
    expect(backupAgeDays(daysAgo(3), now)).toBe(3);
    expect(backupAgeDays("", now)).toBeNull();
    expect(backupAgeDays("not a date", now)).toBeNull();
    expect(backupAgeDays(daysAgo(-2), now)).toBe(0);
  });
  it("stays quiet after a recent backup and when there is nothing to protect", () => {
    expect(backupNotification(daysAgo(BACKUP_REMIND_DAYS - 1), now)).toBeNull();
    expect(backupNotification("", now, { hasData: false })).toBeNull();
  });
  it("asks after a week, and more urgently after a month or when never saved", () => {
    expect(backupNotification(daysAgo(8), now).tone).toBe("amber");
    expect(backupNotification(daysAgo(8), now).text).toMatch(/8 days ago/);
    expect(backupNotification(daysAgo(40), now).tone).toBe("red");
    const never = backupNotification("", now);
    expect(never.tone).toBe("red");
    expect(never.to).toBe("Settings");
  });
  it("remembers the last backup per clinic and survives broken storage", () => {
    const mem = {}; const storage = { getItem: (k) => mem[k] ?? null, setItem: (k, v) => { mem[k] = v; } };
    expect(readLastBackup("c1", storage)).toBe("");
    expect(markBackupDone("c1", now, storage)).toBe(true);
    expect(readLastBackup("c1", storage)).toBe(now.toISOString());
    expect(readLastBackup("c2", storage)).toBe("");
    const broken = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
    expect(readLastBackup("c1", broken)).toBe("");
    expect(markBackupDone("c1", now, broken)).toBe(false);
  });
  it("appears last in the bell list", () => {
    const items = buildNotifications({ now, backup: backupNotification("", now) });
    expect(items[items.length - 1].kind).toBe("backup");
  });
});

describe("connection bar", () => {
  it("shows nothing while online", () => {
    render(<ConnectionBar onlineNow={() => true} />);
    expect(screen.queryByTestId("connection-bar")).toBeNull();
  });
  it("warns when offline, confirms when back, then goes away", () => {
    vi.useFakeTimers();
    render(<ConnectionBar onlineNow={() => true} backMs={1000} />);
    act(() => { window.dispatchEvent(new Event("offline")); });
    expect(screen.getByTestId("connection-bar").textContent).toMatch(/offline/i);
    act(() => { window.dispatchEvent(new Event("online")); });
    expect(screen.getByTestId("connection-bar").textContent).toMatch(/Back online/);
    act(() => { vi.advanceTimersByTime(1100); });
    expect(screen.queryByTestId("connection-bar")).toBeNull();
  });
  it("starts with the warning when the page opens offline", () => {
    render(<ConnectionBar onlineNow={() => false} />);
    expect(screen.getByTestId("connection-bar").textContent).toMatch(/saved on this device/);
  });
});
