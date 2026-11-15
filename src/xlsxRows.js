// Reads the first sheet of an .xlsx workbook into rows of text, in the browser, with no server and no big library.
// An .xlsx file is a zip of XML files. Only what a patient list needs is read: shared strings, inline strings, numbers.
import { unzipSync, strFromU8 } from "fflate";

const MAX_BYTES = 20 * 1024 * 1024;
const MAX_ROWS = 6000;
const MAX_COLS = 60;

const parse = (xml) => {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) throw new Error("bad xml");
  return doc;
};
const textOf = (el) => Array.from(el.getElementsByTagName("t")).map((t) => t.textContent || "").join("");
const colIndex = (ref) => {
  const m = /^([A-Z]+)/.exec(ref || "");
  if (!m) return -1;
  let n = 0;
  for (const c of m[1]) n = n * 26 + (c.charCodeAt(0) - 64);
  return n - 1;
};
// A phone typed as a number can be stored like 9.87654321E9; write it out in full.
const numberText = (raw) => {
  const s = String(raw).trim();
  if (/e/i.test(s)) { const n = Number(s); if (Number.isFinite(n)) return n.toFixed(0); }
  return s;
};

/** Returns { ok, rows } or { ok:false, error }. `bytes` is a Uint8Array of the file. */
export const xlsxToRows = (bytes) => {
  try {
    if (!bytes || bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
      return { ok: false, error: "This does not look like an .xlsx file. In Excel choose Save As, then .xlsx or .csv. Older .xls files must be re-saved." };
    }
    if (bytes.length > MAX_BYTES) return { ok: false, error: "This workbook is too large (20 MB limit). Save only the patient list in a new file." };
    const files = unzipSync(bytes, { filter: (f) => /^xl\/(workbook\.xml|_rels\/workbook\.xml\.rels|sharedStrings\.xml|worksheets\/[^/]+\.xml)$/.test(f.name) && f.originalSize < 60 * 1024 * 1024 });
    const read = (name) => (files[name] ? strFromU8(files[name]) : "");
    // which file is the first sheet
    let sheetPath = "xl/worksheets/sheet1.xml";
    try {
      const wb = parse(read("xl/workbook.xml"));
      const first = wb.getElementsByTagName("sheet")[0];
      const rid = first && (first.getAttribute("r:id") || first.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id"));
      if (rid) {
        const rels = parse(read("xl/_rels/workbook.xml.rels"));
        const rel = Array.from(rels.getElementsByTagName("Relationship")).find((r) => r.getAttribute("Id") === rid);
        const target = rel && rel.getAttribute("Target");
        if (target) sheetPath = target.startsWith("/") ? target.slice(1) : `xl/${target.replace(/^\.\//, "")}`;
      }
    } catch (e) { /* keep sheet1 */ }
    if (!files[sheetPath]) return { ok: false, error: "Could not find a sheet in this workbook." };
    const shared = read("xl/sharedStrings.xml") ? Array.from(parse(read("xl/sharedStrings.xml")).getElementsByTagName("si")).map(textOf) : [];
    const sheet = parse(read(sheetPath));
    const rows = [];
    for (const rowEl of Array.from(sheet.getElementsByTagName("row"))) {
      if (rows.length >= MAX_ROWS + 1) break;
      const out = [];
      let next = 0;
      for (const c of Array.from(rowEl.getElementsByTagName("c"))) {
        let idx = colIndex(c.getAttribute("r"));
        if (idx < 0) idx = next;
        if (idx >= MAX_COLS) continue;
        const t = c.getAttribute("t");
        const v = c.getElementsByTagName("v")[0];
        let val = "";
        if (t === "s") val = shared[Number(v && v.textContent)] ?? "";
        else if (t === "inlineStr") val = textOf(c);
        else if (t === "b") val = v && v.textContent === "1" ? "TRUE" : "FALSE";
        else if (v) val = t === "str" || t === "e" ? v.textContent || "" : numberText(v.textContent || "");
        while (out.length < idx) out.push("");
        out[idx] = val;
        next = idx + 1;
      }
      if (out.some((x) => String(x).trim() !== "")) rows.push(out);
    }
    if (!rows.length) return { ok: false, error: "The first sheet is empty." };
    return { ok: true, rows };
  } catch (e) {
    return { ok: false, error: "Could not read this workbook. Save it again as .xlsx or .csv and retry." };
  }
};
