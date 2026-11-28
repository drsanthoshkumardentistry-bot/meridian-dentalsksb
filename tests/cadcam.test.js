import { describe, it, expect } from "vitest";
import { validateCase, createCase, advanceCase, nextStage, attachScan, openCases, parseStl, STAGES } from "../src/cadcam.js";

const draft = { restoration: "Crown", material: "Zirconia", teeth: "36", scannedOn: "2026-11-28", shade: "A2" };
const now = new Date(2026, 10, 29);

describe("CAD/CAM case rules", () => {
  it("validates", () => {
    expect(validateCase(draft)).toBe("");
    expect(validateCase({ ...draft, restoration: "x" })).toMatch(/restoration/);
    expect(validateCase({ ...draft, material: "" })).toMatch(/material/);
    expect(validateCase({ ...draft, teeth: "" })).toMatch(/tooth/i);
    expect(validateCase({ ...draft, teeth: "99" })).toMatch(/FDI/);
    expect(validateCase({ ...draft, scannedOn: "" })).toMatch(/scan date/);
    expect(validateCase({ ...draft, note: "x".repeat(301) })).toMatch(/300/);
  });
  it("moves one step at a time, never skips, never reopens", () => {
    let c = createCase(draft, "C1", now);
    expect(c.stage).toBe("scanned");
    expect(advanceCase(c, "milled", now).stage).toBe("scanned");
    for (const s of STAGES.slice(1)) { expect(nextStage(c)).toBe(s); c = advanceCase(c, s, now); expect(c.dates[s]).toBe("2026-11-29"); }
    expect(c.stage).toBe("fitted");
    expect(nextStage(c)).toBe("");
    expect(advanceCase(c, "cancelled", now).stage).toBe("fitted");
  });
  it("cancels an open case and then stops", () => {
    const c = advanceCase(createCase(draft, "C1", now), "cancelled", now);
    expect(c.stage).toBe("cancelled");
    expect(advanceCase(c, "designed", now).stage).toBe("cancelled");
  });
  it("remembers scan details and lists open cases across patients", () => {
    const c = attachScan(createCase(draft, "C1", now), { name: "36.stl", bytes: 2048, triangles: 12 });
    expect(c.scanFile).toEqual({ name: "36.stl", bytes: 2048, triangles: 12 });
    const done = { ...c, id: "C2", stage: "fitted" };
    expect(openCases([{ id: "P", name: "A", cadCases: [c, done] }, { id: "Q", name: "B" }]).map((x) => x.id)).toEqual(["C1"]);
  });
});

const binaryStl = (tris) => {
  const buf = new ArrayBuffer(84 + tris.length * 50);
  const v = new DataView(buf);
  v.setUint32(80, tris.length, true);
  tris.forEach((t, i) => t.forEach((n, k) => v.setFloat32(84 + i * 50 + 12 + k * 4, n, true)));
  return buf;
};
describe("STL parser", () => {
  it("reads binary STL", () => {
    const r = parseStl(binaryStl([[0, 0, 0, 1, 0, 0, 0, 1, 0], [0, 0, 1, 1, 0, 1, 0, 1, 1]]));
    expect(r.triangles).toBe(2);
    expect(r.positions[3]).toBe(1);
    expect(r.positions).toHaveLength(18);
  });
  it("reads ASCII STL", () => {
    const text = "solid t\nfacet normal 0 0 1\nouter loop\nvertex 0 0 0\nvertex 1 0 0\nvertex 0 1 0\nendloop\nendfacet\nendsolid t\n";
    const r = parseStl(new TextEncoder().encode(text).buffer);
    expect(r.triangles).toBe(1);
  });
  it("rejects wrong, tiny and damaged files without throwing", () => {
    expect(parseStl(new TextEncoder().encode("hello world this is not a scan at all").buffer).error).toMatch(/not an STL/);
    expect(parseStl(new ArrayBuffer(4)).error).toMatch(/too small/);
    expect(parseStl(null).error).toBeTruthy();
    expect(parseStl(binaryStl([[NaN, 0, 0, 1, 0, 0, 0, 1, 0]])).error).toMatch(/damaged/);
    expect(parseStl(new TextEncoder().encode("solid empty\nendsolid\n padding padding").buffer).error).toMatch(/damaged/);
  });
});
