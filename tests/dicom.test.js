import { describe, it, expect } from "vitest";
import { parseDicom, hasDicomMarker, looksLikeDicomName } from "../src/dicom.js";

const enc = (s) => Array.from(s).map((c) => c.charCodeAt(0));
const u16 = (n) => [n & 255, (n >> 8) & 255];
const u32 = (n) => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255];
const tagBytes = (tag) => [...u16(tag >>> 16), ...u16(tag & 0xffff)];
const padEven = (a) => (a.length % 2 ? [...a, 0x20] : a);

const exp = (tag, vr, value) => {
  const long = ["OB", "OW", "SQ", "UN", "UT"].includes(vr);
  return long ? [...tagBytes(tag), ...enc(vr), 0, 0, ...u32(value.length), ...value] : [...tagBytes(tag), ...enc(vr), ...u16(value.length), ...value];
};
const imp = (tag, value) => [...tagBytes(tag), ...u32(value.length), ...value];

const build = ({ syntax = "1.2.840.10008.1.2.1", rows = 2, cols = 4, bits = 16, rep = 0, photometric = "MONOCHROME2", samples = 1, planar = 0,
  pixels, window, extra = [], undefinedPixel = false } = {}) => {
  const implicit = syntax === "1.2.840.10008.1.2";
  const el = (tag, vr, value) => (implicit ? imp(tag, value) : exp(tag, vr, value));
  const metaSyntax = exp(0x00020010, "UI", padEven(enc(syntax)));
  let body = [
    ...extra,
    ...el(0x00280002, "US", u16(samples)),
    ...el(0x00280004, "CS", padEven(enc(photometric))),
    ...(samples === 3 ? el(0x00280006, "US", u16(planar)) : []),
    ...el(0x00280010, "US", u16(rows)),
    ...el(0x00280011, "US", u16(cols)),
    ...el(0x00280100, "US", u16(bits)),
    ...el(0x00280101, "US", u16(bits)),
    ...el(0x00280103, "US", u16(rep)),
    ...(window ? [...el(0x00281050, "DS", padEven(enc(String(window[0])))), ...el(0x00281051, "DS", padEven(enc(String(window[1]))))] : []),
  ];
  const px = pixels || (bits === 16 ? [].concat(...[0, 100, 200, 300, 400, 500, 600, 1000].map(u16)) : [0, 50, 100, 150, 200, 250, 255, 10]);
  if (undefinedPixel) body = [...body, ...tagBytes(0x7fe00010), ...(implicit ? [] : enc("OB")), ...(implicit ? [] : [0, 0]), ...u32(0xffffffff), 1, 2, 3, 4];
  else body = [...body, ...(implicit ? imp(0x7fe00010, px) : exp(0x7fe00010, "OW", px))];
  return new Uint8Array([...new Array(128).fill(0), ...enc("DICM"), ...metaSyntax, ...body]).buffer;
};
const gray = (r) => Array.from({ length: r.width * r.height }, (_, i) => r.rgba[i * 4]);

describe("DICOM reader", () => {
  it("recognises the DICM marker and .dcm names", () => {
    expect(hasDicomMarker(build())).toBe(true);
    expect(hasDicomMarker(new ArrayBuffer(200))).toBe(false);
    expect(looksLikeDicomName("IOPA_21.DCM")).toBe(true);
    expect(looksLikeDicomName("photo.jpg")).toBe(false);
  });

  it("converts 16-bit greyscale, stretching the full range", () => {
    const r = parseDicom(build());
    expect([r.width, r.height]).toEqual([4, 2]);
    const g = gray(r);
    expect(g[0]).toBe(0);
    expect(g[7]).toBe(255);
    expect(g[1]).toBeLessThan(g[2]);
    expect(r.rgba[3]).toBe(255);
  });

  it("uses the window centre and width when the file gives them", () => {
    const g = gray(parseDicom(build({ window: [300, 200] }))); // shows values 200..400
    expect(g[0]).toBe(0); // 0 is below the window
    expect(g[2]).toBe(0); // 200 is the bottom of the window
    expect(g[4]).toBe(255); // 400 is the top
    expect(g[7]).toBe(255);
  });

  it("flips MONOCHROME1 so bone stays bright", () => {
    const g = gray(parseDicom(build({ photometric: "MONOCHROME1" })));
    expect(g[0]).toBe(255);
    expect(g[7]).toBe(0);
  });

  it("reads implicit little endian files", () => {
    const r = parseDicom(build({ syntax: "1.2.840.10008.1.2", bits: 8 }));
    expect(gray(r)[6]).toBe(255);
  });

  it("reads plain 8-bit colour pictures, interleaved and planar", () => {
    const inter = parseDicom(build({ rows: 1, cols: 2, bits: 8, samples: 3, photometric: "RGB", pixels: [255, 0, 0, 0, 255, 0] }));
    expect(Array.from(inter.rgba)).toEqual([255, 0, 0, 255, 0, 255, 0, 255]);
    const planar = parseDicom(build({ rows: 1, cols: 2, bits: 8, samples: 3, planar: 1, photometric: "RGB", pixels: [255, 0, 0, 255, 0, 0] }));
    expect(Array.from(planar.rgba)).toEqual([255, 0, 0, 255, 0, 255, 0, 255]);
  });

  it("skips a sequence of unknown length that comes before the picture", () => {
    const item = [...tagBytes(0xfffee000), ...u32(0xffffffff), ...exp(0x00080100, "SH", padEven(enc("AB"))), ...tagBytes(0xfffee00d), ...u32(0)];
    const seq = [...tagBytes(0x00082112), ...enc("SQ"), 0, 0, ...u32(0xffffffff), ...item, ...tagBytes(0xfffee0dd), ...u32(0)];
    const r = parseDicom(build({ extra: seq }));
    expect(r.width).toBe(4);
  });

  it("explains how to export when the file is compressed", () => {
    expect(() => parseDicom(build({ syntax: "1.2.840.10008.1.2.4.70" }))).toThrow(/compressed.*JPEG or PNG/);
    expect(() => parseDicom(build({ undefinedPixel: true }))).toThrow(/compressed/);
  });

  it("rejects damaged, empty and truncated files with a clear message, never hanging", () => {
    expect(() => parseDicom(new ArrayBuffer(0))).toThrow(/damaged/);
    const good = build();
    expect(() => parseDicom(good.slice(0, good.byteLength - 6))).toThrow();
    expect(() => parseDicom(build({ pixels: [1, 2] }))).toThrow(/damaged/);
  });

  it("refuses pictures that would use too much memory", () => {
    expect(() => parseDicom(build({ rows: 20000, cols: 20000, pixels: [0, 0] }))).toThrow(/too large/);
  });

  it("survives random garbage without crashing the page (always a plain Error)", () => {
    let seed = 12345;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    for (let n = 0; n < 400; n++) {
      const len = Math.floor(rnd() * 400);
      const arr = new Uint8Array(len).map(() => Math.floor(rnd() * 256));
      if (n % 2 && len > 140) { arr.set(enc("DICM"), 128); }
      try { parseDicom(arr.buffer); } catch (e) { expect(e).toBeInstanceOf(Error); }
    }
    // and a mutated valid file
    const base = new Uint8Array(build());
    for (let n = 0; n < 300; n++) {
      const copy = base.slice();
      for (let k = 0; k < 4; k++) copy[Math.floor(rnd() * copy.length)] = Math.floor(rnd() * 256);
      try { parseDicom(copy.buffer); } catch (e) { expect(e).toBeInstanceOf(Error); }
    }
  });
});
