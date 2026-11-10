import { describe, it, expect } from "vitest";
import { isImageData, validateImages, scaleToFit, JPEG_PREFIX, MAX_IMAGE_CHARS } from "../src/connect/images.js";
import { validatePost } from "../src/connect/feed.js";

const ok = JPEG_PREFIX + "A".repeat(100);
const base = { type: "case", title: "Abscess in 46", body: "Recurrent swelling after obturation.", deidentified: true };

describe("case images", () => {
  it("accepts small JPEG data URLs only", () => {
    expect(isImageData(ok)).toBe(true);
    expect(isImageData("data:image/png;base64,AAAA")).toBe(false);
    expect(isImageData(JPEG_PREFIX)).toBe(false);
    expect(isImageData(JPEG_PREFIX + "A".repeat(MAX_IMAGE_CHARS))).toBe(false);
    expect(isImageData(null)).toBe(false);
  });
  it("allows up to two images", () => {
    expect(validateImages([ok, ok]).ok).toBe(true);
    expect(validateImages([ok, ok, ok]).ok).toBe(false);
    expect(validateImages([ok, "x"]).ok).toBe(false);
    expect(validateImages(undefined)).toEqual({ ok: true, images: [] });
  });
  it("scales the longest side and keeps the shape", () => {
    expect(scaleToFit(2000, 1000, 1000)).toEqual([1000, 500]);
    expect(scaleToFit(400, 300, 1000)).toEqual([400, 300]);
  });
  it("validatePost returns images and sets the count, for cases only", () => {
    const v = validatePost({ ...base, images: [ok, ok] });
    expect(v.ok).toBe(true);
    expect(v.images).toHaveLength(2);
    expect(v.post.imageCount).toBe(2);
    expect(validatePost(base).post.imageCount).toBeUndefined();
    expect(validatePost({ ...base, type: "update", images: [ok] }).ok).toBe(false);
    expect(validatePost({ ...base, images: [ok, ok, ok] }).ok).toBe(false);
  });
  it("still needs the de-identification tick when an image is attached", () => {
    expect(validatePost({ ...base, deidentified: false, images: [ok] }).ok).toBe(false);
  });
});
