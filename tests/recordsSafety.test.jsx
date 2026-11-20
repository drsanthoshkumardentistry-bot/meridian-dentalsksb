import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { recordsSafety } from "../src/recordsSafety.js";
import RecordsSafetyCard from "../src/components/RecordsSafetyCard.jsx";

afterEach(() => cleanup());
const NOW = new Date("2026-11-21T10:00:00Z");
const hoursAgo = (h) => new Date(NOW.getTime() - h * 3600000).toISOString();
const pt = (h, patients) => ({ id: `rp${h}`, at: hoursAgo(h), counts: { patients } });
const by = (r, id) => r.checks.find((c) => c.id === id);

describe("recordsSafety", () => {
  it("is good with a fresh cloud copy and a recent download", () => {
    const r = recordsSafety({ points: [pt(5, 40)], lastBackupIso: hoursAgo(30), live: { patients: 40 }, now: NOW });
    expect(r.level).toBe("good");
    expect(by(r, "cloud").detail).toMatch(/today.*40 patients/);
    expect(by(r, "match").detail).toMatch(/40 patients; you have 40/);
  });
  it("asks for action when there is data but no copy anywhere", () => {
    const r = recordsSafety({ points: [], lastBackupIso: "", live: { patients: 12 }, now: NOW });
    expect(r.level).toBe("act");
    expect(by(r, "cloud").tone).toBe("red");
    expect(by(r, "download").detail).toMatch(/No backup downloaded/);
  });
  it("watches when the download is 4 days old", () => {
    const r = recordsSafety({ points: [pt(5, 10)], lastBackupIso: hoursAgo(96), live: { patients: 10 }, now: NOW });
    expect(r.level).toBe("watch");
    expect(by(r, "download").detail).toMatch(/4 days ago/);
  });
  it("tells a new clinic to add a patient, without alarms", () => {
    const r = recordsSafety({ points: [], lastBackupIso: "", live: { patients: 0 }, now: NOW });
    expect(r.level).toBe("good");
    expect(r.headline).toMatch(/first patient/);
  });
  it("flags a cloud copy that is a week old", () => {
    const r = recordsSafety({ points: [pt(24 * 9, 10)], lastBackupIso: hoursAgo(5), live: { patients: 10 }, now: NOW });
    expect(by(r, "cloud").tone).toBe("red");
    expect(r.level).toBe("act");
  });
  it("explains a few newer patients, and warns when many are missing", () => {
    expect(by(recordsSafety({ points: [pt(5, 38)], lastBackupIso: hoursAgo(2), live: { patients: 40 }, now: NOW }), "match").tone).toBe("green");
    expect(by(recordsSafety({ points: [pt(5, 20)], lastBackupIso: hoursAgo(2), live: { patients: 40 }, now: NOW }), "match").tone).toBe("amber");
  });
  it("says it is checking until restore points have loaded", () => {
    expect(recordsSafety({ points: [], loaded: false, live: { patients: 3 }, now: NOW }).headline).toMatch(/Checking/);
  });
});

describe("RecordsSafetyCard", () => {
  it("shows the evidence and links to the public page", () => {
    render(<RecordsSafetyCard points={[{ id: "x", at: new Date(Date.now() - 3600000).toISOString(), counts: { patients: 7 } }]} loaded lastBackupIso={new Date().toISOString()} patients={7} />);
    expect(screen.getByText("Records safety")).toBeTruthy();
    expect(screen.getByText(/holding 7 patients/)).toBeTruthy();
    expect(screen.getByText(/How this works/).closest("a").getAttribute("href")).toBe("/records-safety");
  });
});
