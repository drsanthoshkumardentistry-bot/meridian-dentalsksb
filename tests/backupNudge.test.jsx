import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import BackupNudge from "../src/components/BackupNudge.jsx";

afterEach(cleanup);
const now = new Date("2026-11-19T10:00:00Z");
const pt = (days) => ({ id: "p", at: new Date(now.getTime() - days * 86400000).toISOString(), counts: {} });

describe("BackupNudge", () => {
  it("stays quiet when a recent copy exists, before loading, or with no data", () => {
    const { container, rerender } = render(<BackupNudge points={[pt(1)]} loaded hasData now={now} />);
    expect(container.firstChild).toBeNull();
    rerender(<BackupNudge points={[]} loaded={false} hasData now={now} />);
    expect(container.firstChild).toBeNull();
    rerender(<BackupNudge points={[]} loaded hasData={false} now={now} />);
    expect(container.firstChild).toBeNull();
  });
  it("warns when the newest copy is old or missing, and saves on request", () => {
    const save = vi.fn();
    const { rerender } = render(<BackupNudge points={[pt(5)]} loaded hasData now={now} onSave={save} />);
    expect(screen.getByTestId("backup-nudge").textContent).toMatch(/5 days ago/);
    fireEvent.click(screen.getByRole("button", { name: "Save a copy now" }));
    expect(save).toHaveBeenCalled();
    rerender(<BackupNudge points={[]} loaded hasData now={now} onSave={save} />);
    expect(screen.getByTestId("backup-nudge").textContent).toMatch(/No safety copy/);
  });
});
