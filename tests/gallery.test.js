import { describe, it, expect } from "vitest";
import { buildImageDoc, sortImages, suggestPair, canAddMore, countByKind, MAX_IMAGES_PER_PATIENT, MAX_DATA_CHARS } from "../src/gallery.js";

const now = new Date(2026, 10, 12, 12);
const data = "data:image/jpeg;base64,AAAA";
const ok = (o = {}) => buildImageDoc({ patientId: "P1", kind: "Before", data, ...o }, "I1", now, "Dr S");

describe("patient pictures", () => {
  it("builds a picture record and tidies the text", () => {
    const r = ok({ caption: "  Upper   left  ", tooth: "26" });
    expect(r.ok).toBe(true);
    expect(r.image).toMatchObject({ id: "I1", patientId: "P1", kind: "Before", caption: "Upper left", takenOn: "2026-11-12", by: "Dr S" });
  });
  it("rejects a missing patient, bad kind, non-JPEG, oversize picture and bad dates", () => {
    expect(buildImageDoc({ kind: "Before", data }, "I", now).ok).toBe(false);
    expect(ok({ kind: "Selfie" }).ok).toBe(false);
    expect(ok({ data: "data:image/png;base64,AAA" }).ok).toBe(false);
    expect(ok({ data: "data:image/jpeg;base64," + "A".repeat(MAX_DATA_CHARS) }).ok).toBe(false);
    expect(ok({ takenOn: "2026-11-13" }).ok).toBe(false);
    expect(ok({ takenOn: "12/11/2026" }).ok).toBe(false);
  });
  it("sorts newest first and suggests the latest before and after", () => {
    const imgs = [
      { id: "a", kind: "Before", takenOn: "2026-10-01", createdAt: "1" },
      { id: "b", kind: "Before", takenOn: "2026-11-01", createdAt: "1" },
      { id: "c", kind: "After", takenOn: "2026-11-10", createdAt: "1" },
      { id: "d", kind: "X-ray", takenOn: "2026-11-11", createdAt: "1" },
    ];
    expect(sortImages(imgs).map((i) => i.id)).toEqual(["d", "c", "b", "a"]);
    expect(suggestPair(imgs)).toMatchObject({ before: { id: "b" }, after: { id: "c" } });
    expect(suggestPair([])).toEqual({ before: null, after: null });
    expect(countByKind(imgs)).toEqual({ Before: 2, After: 1, "X-ray": 1 });
  });
  it("limits how many pictures one patient can have", () => {
    expect(canAddMore(MAX_IMAGES_PER_PATIENT - 1)).toBe(true);
    expect(canAddMore(MAX_IMAGES_PER_PATIENT)).toBe(false);
  });
});

import { nocImages, IMAGE_KINDS as KINDS, NOC_KIND } from "../src/gallery.js";
describe("physician NOC", () => {
  it("is a picture kind and nocImages returns only NOCs, newest first", () => {
    expect(KINDS).toContain(NOC_KIND);
    const list = [{ id: "1", kind: "OPG", takenOn: "2026-01-01", createdAt: "1" }, { id: "2", kind: NOC_KIND, takenOn: "2026-02-01", createdAt: "1" }, { id: "3", kind: NOC_KIND, takenOn: "2026-03-01", createdAt: "1" }];
    expect(nocImages(list).map((i) => i.id)).toEqual(["3", "2"]);
    expect(nocImages([])).toEqual([]);
    expect(nocImages(null)).toEqual([]);
  });
});
