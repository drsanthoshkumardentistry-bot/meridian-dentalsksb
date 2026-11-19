import React, { useState } from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DEFAULT_RX_SETS, rxSetsOf, saveRxSet, removeRxSet, resetRxSets, newLinesFromSet, MAX_SETS } from "../src/rxSets.js";
import RxSets from "../src/components/RxSets.jsx";

afterEach(cleanup);
let n = 0;
const id = () => `S${++n}`;
const slip = [{ id: 1, drug: "Zerodol-SP", generic: "g", dosage: "1 Tab", frequency: "1-0-1", duration: "3 Days", instruction: "After Food" }];

describe("prescription sets", () => {
  it("starts with starter sets built from real medicines", () => {
    expect(rxSetsOf({})).toBe(DEFAULT_RX_SETS);
    for (const s of DEFAULT_RX_SETS) { expect(s.items.length).toBeGreaterThan(0); expect(s.items.every((m) => m.name && m.frequency && m.duration)).toBe(true); }
  });
  it("saves the slip as a set, replaces a same-named set, and refuses empty input", () => {
    expect(saveRxSet({}, "", slip, id).error).toMatch(/name/);
    expect(saveRxSet({}, "X", [], id).error).toMatch(/medicine/);
    const a = saveRxSet({}, "My set", slip, id);
    expect(a.set.items[0].name).toBe("Zerodol-SP");
    const b = saveRxSet(a.profile, "my SET", [{ ...slip[0], drug: "Metrogyl 400" }], id);
    expect(b.profile.rxSets.filter((s) => s.name.toLowerCase() === "my set")).toHaveLength(1);
    expect(b.profile.rxSets.find((s) => s.name === "my SET").items[0].name).toBe("Metrogyl 400");
  });
  it("caps the number of sets and can remove and restore", () => {
    let p = { rxSets: Array.from({ length: MAX_SETS }, (_, i) => ({ id: `a${i}`, name: `s${i}`, items: slip.map((l) => ({ ...l, name: l.drug })) })) };
    expect(saveRxSet(p, "one more", slip, id).error).toMatch(/Up to/);
    p = removeRxSet(p, "a0");
    expect(p.rxSets).toHaveLength(MAX_SETS - 1);
    expect(resetRxSets(p).rxSets).toBeUndefined();
  });
  it("adds only medicines that are not already on the slip", () => {
    const lines = newLinesFromSet(DEFAULT_RX_SETS[0], slip);
    expect(lines.map((m) => m.name)).not.toContain("Zerodol-SP");
    expect(lines.length).toBe(DEFAULT_RX_SETS[0].items.length - 1);
  });
});

describe("RxSets panel", () => {
  const Host = ({ onApply }) => { const [p, setP] = useState({}); return <RxSets profile={p} onProfile={setP} slip={slip} onApply={onApply} newId={id} showToast={() => {}} />; };
  it("applies a set in one tap, saves a new one and deletes it", () => {
    const apply = vi.fn();
    render(<Host onApply={apply} />);
    fireEvent.click(screen.getByRole("button", { name: /^After extraction/ }));
    expect(apply).toHaveBeenCalledTimes(1);
    expect(apply.mock.calls[0][1].length).toBe(2);
    fireEvent.click(screen.getByRole("button", { name: "Save this slip as a set" }));
    fireEvent.change(screen.getByLabelText("Set name"), { target: { value: "Mine" } });
    fireEvent.click(screen.getByRole("button", { name: "Save set" }));
    expect(screen.getByRole("button", { name: /^Mine/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Delete set Mine" }));
    expect(screen.queryByRole("button", { name: /^Mine/ })).toBeNull();
  });
});
