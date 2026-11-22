// Reads a DICOM (.dcm) picture exported by a digital X-ray sensor, a panoramic unit or a scanner and turns it into a normal
// picture. It reads uncompressed pictures only (the common case for dental sensors). Compressed files get a clear message.
// Everything happens in the browser: the file never leaves the device until it is saved in the patient's record.

const IMPLICIT = "1.2.840.10008.1.2";
const EXPLICIT = "1.2.840.10008.1.2.1";
const LONG_VR = new Set(["OB", "OD", "OF", "OL", "OV", "OW", "SQ", "UC", "UN", "UR", "UT", "SV", "UV"]);
const MAX_PIXELS = 40_000_000;
const MAX_ELEMENTS = 20000;

const TAG = {
  transferSyntax: 0x00020010, samples: 0x00280002, photometric: 0x00280004, planar: 0x00280006, frames: 0x00280008,
  rows: 0x00280010, cols: 0x00280011, bitsAllocated: 0x00280100, bitsStored: 0x00280101, pixelRep: 0x00280103,
  windowCenter: 0x00281050, windowWidth: 0x00281051, intercept: 0x00281052, slope: 0x00281053, pixelData: 0x7fe00010,
};
const SEQ_ITEM = 0xfffee000, ITEM_END = 0xfffee00d, SEQ_END = 0xfffee0dd;

const damaged = () => new Error("That DICOM file looks damaged. Export it again from your imaging software as JPEG or PNG.");
const ascii = (u8) => { let s = ""; for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return s.replace(/\0/g, "").trim(); };

/** True when the first bytes say "DICM" (a standard DICOM file) or the name ends in .dcm / .dicom. */
export const looksLikeDicomName = (name = "") => /\.(dcm|dicom)$/i.test(String(name));
export const hasDicomMarker = (buf) => {
  if (!buf || buf.byteLength < 132) return false;
  const u = new Uint8Array(buf, 128, 4);
  return u[0] === 0x44 && u[1] === 0x49 && u[2] === 0x43 && u[3] === 0x4d;
};

export const parseDicom = (buffer) => {
  if (!buffer || buffer.byteLength < 16) throw damaged();
  const dv = new DataView(buffer);
  const u8 = new Uint8Array(buffer);
  const end = buffer.byteLength;
  let pos = hasDicomMarker(buffer) ? 132 : 0;
  const seen = {};
  let pixel = null;
  let elements = 0;
  let explicit = true;

  const tagAt = (p) => ((dv.getUint16(p, true) << 16) | dv.getUint16(p + 2, true)) >>> 0;

  // Reads one element header at p. Returns { tag, vr, len, start } where start is where the value begins.
  const header = (p, useExplicit) => {
    if (p + 8 > end) throw damaged();
    const tag = tagAt(p);
    const group = tag >>> 16;
    if (group === 0xfffe) return { tag, vr: "", len: dv.getUint32(p + 4, true), start: p + 8 };
    if (!useExplicit) return { tag, vr: "", len: dv.getUint32(p + 4, true), start: p + 8 };
    const vr = String.fromCharCode(u8[p + 4], u8[p + 5]);
    if (LONG_VR.has(vr)) {
      if (p + 12 > end) throw damaged();
      return { tag, vr, len: dv.getUint32(p + 8, true), start: p + 12 };
    }
    return { tag, vr, len: dv.getUint16(p + 6, true), start: p + 8 };
  };

  const numberTags = new Set([TAG.samples, TAG.planar, TAG.rows, TAG.cols, TAG.bitsAllocated, TAG.bitsStored, TAG.pixelRep]);
  const textTags = new Set([TAG.transferSyntax, TAG.photometric, TAG.frames, TAG.windowCenter, TAG.windowWidth, TAG.intercept, TAG.slope]);
  const keep = (h) => {
    if (h.len === 0xffffffff || h.start + h.len > end) return;
    if (numberTags.has(h.tag) && h.len >= 2) seen[h.tag] = dv.getUint16(h.start, true);
    else if (textTags.has(h.tag)) seen[h.tag] = ascii(u8.subarray(h.start, h.start + h.len));
  };

  // Skips a value of unknown length that holds items (a sequence). Items may also have unknown length.
  const skipUndefined = (p, useExplicit, depth) => {
    if (depth > 8) throw damaged();
    for (let guard = 0; guard < MAX_ELEMENTS; guard++) {
      const h = header(p, false); // item and delimiter headers are always 8 bytes
      if (h.tag === SEQ_END) return h.start;
      if (h.tag !== SEQ_ITEM) throw damaged();
      if (h.len !== 0xffffffff) { p = h.start + h.len; if (p > end) throw damaged(); continue; }
      p = h.start;
      for (let inner = 0; inner < MAX_ELEMENTS; inner++) {
        const e = header(p, useExplicit);
        if (e.tag === ITEM_END) { p = e.start; break; }
        if (e.len === 0xffffffff) p = skipUndefined(e.start, useExplicit, depth + 1);
        else { p = e.start + e.len; if (p > end) throw damaged(); }
      }
    }
    throw damaged();
  };

  // Group 0002 is always explicit little endian; it names how the rest is written.
  while (pos < end && elements++ < MAX_ELEMENTS) {
    if (tagAt(pos) >>> 16 !== 0x0002) break;
    const h = header(pos, true);
    keep(h);
    pos = h.start + h.len;
    if (pos > end) throw damaged();
  }
  const syntax = seen[TAG.transferSyntax] || IMPLICIT;
  if (syntax === EXPLICIT) explicit = true;
  else if (syntax === IMPLICIT) explicit = false;
  else if (syntax.startsWith("1.2.840.10008.1.2.4") || syntax === "1.2.840.10008.1.2.5" || syntax === "1.2.840.10008.1.2.1.99") {
    throw new Error("This DICOM file is compressed. In your imaging software choose Export as JPEG or PNG, then add that file.");
  } else if (syntax === "1.2.840.10008.1.2.2") throw new Error("This DICOM file uses an old format MeriDent cannot read. Export it as JPEG or PNG.");
  else throw new Error("MeriDent cannot read this kind of DICOM file. Export it as JPEG or PNG from your imaging software.");

  while (pos < end && elements++ < MAX_ELEMENTS) {
    const h = header(pos, explicit);
    if (h.tag === TAG.pixelData) {
      if (h.len === 0xffffffff) throw new Error("This DICOM file is compressed. In your imaging software choose Export as JPEG or PNG, then add that file.");
      if (h.start + h.len > end) throw damaged();
      pixel = { start: h.start, len: h.len };
      break;
    }
    keep(h);
    if (h.len === 0xffffffff) pos = skipUndefined(h.start, explicit, 0);
    else { pos = h.start + h.len; if (pos > end) throw damaged(); }
  }
  if (!pixel) throw new Error("No picture was found inside this DICOM file.");

  const rows = seen[TAG.rows], cols = seen[TAG.cols];
  const bits = seen[TAG.bitsAllocated];
  const samples = seen[TAG.samples] || 1;
  const rep = seen[TAG.pixelRep] || 0;
  if (!rows || !cols || !bits) throw damaged();
  if (rows * cols > MAX_PIXELS) throw new Error("That picture is too large to open here. Export a smaller JPEG or PNG.");
  if (bits !== 8 && bits !== 16) throw new Error("MeriDent reads 8-bit and 16-bit DICOM pictures. Export this one as JPEG or PNG.");
  if (samples !== 1 && !(samples === 3 && bits === 8)) throw new Error("MeriDent reads grey and plain colour DICOM pictures. Export this one as JPEG or PNG.");
  const bytesPerSample = bits / 8;
  if (pixel.len < rows * cols * samples * bytesPerSample) throw damaged();

  const count = rows * cols;
  const rgba = new Uint8ClampedArray(count * 4);
  const photometric = String(seen[TAG.photometric] || "MONOCHROME2").toUpperCase();

  if (samples === 3) {
    const planar = seen[TAG.planar] === 1;
    for (let i = 0; i < count; i++) {
      const o = pixel.start;
      rgba[i * 4] = u8[planar ? o + i : o + i * 3];
      rgba[i * 4 + 1] = u8[planar ? o + count + i : o + i * 3 + 1];
      rgba[i * 4 + 2] = u8[planar ? o + 2 * count + i : o + i * 3 + 2];
      rgba[i * 4 + 3] = 255;
    }
    return { width: cols, height: rows, rgba };
  }

  const slope = parseFloat(seen[TAG.slope]) || 1;
  const intercept = parseFloat(seen[TAG.intercept]) || 0;
  const read = bits === 8
    ? (i) => (rep ? (u8[pixel.start + i] << 24) >> 24 : u8[pixel.start + i])
    : (i) => (rep ? dv.getInt16(pixel.start + i * 2, true) : dv.getUint16(pixel.start + i * 2, true));
  const values = new Float32Array(count);
  let min = Infinity, max = -Infinity;
  for (let i = 0; i < count; i++) {
    const v = read(i) * slope + intercept;
    values[i] = v;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  let lo = min, hi = max;
  const centre = parseFloat(String(seen[TAG.windowCenter] || "").split("\\")[0]);
  const width = parseFloat(String(seen[TAG.windowWidth] || "").split("\\")[0]);
  if (Number.isFinite(centre) && Number.isFinite(width) && width > 1) { lo = centre - width / 2; hi = centre + width / 2; }
  const span = hi - lo || 1;
  const invert = photometric === "MONOCHROME1";
  for (let i = 0; i < count; i++) {
    let g = ((values[i] - lo) / span) * 255;
    g = g < 0 ? 0 : g > 255 ? 255 : g;
    if (invert) g = 255 - g;
    rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = g;
    rgba[i * 4 + 3] = 255;
  }
  return { width: cols, height: rows, rgba };
};

/** True when this file is a DICOM picture (by its name or its first bytes). */
export const isDicomFile = async (file) => {
  if (!file) return false;
  if (looksLikeDicomName(file.name)) return true;
  if (file.type && file.type !== "application/dicom" && file.type !== "application/octet-stream") return false;
  try { return hasDicomMarker(await file.slice(0, 132).arrayBuffer()); } catch { return false; }
};

/** Turns a DICOM file into a PNG file the rest of the app already understands. */
export const dicomToImageFile = async (file) => {
  const { width, height, rgba } = parseDicom(await file.arrayBuffer());
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").putImageData(new ImageData(rgba, width, height), 0, 0);
  const blob = await new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not convert that DICOM file"))), "image/png"));
  return new File([blob], String(file.name || "dicom").replace(/\.(dcm|dicom)$/i, "") + ".png", { type: "image/png", lastModified: file.lastModified });
};
