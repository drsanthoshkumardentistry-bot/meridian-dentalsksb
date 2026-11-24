import { describe, it, expect } from "vitest";
import { recordSheetHtml } from "../src/recordSheet.js";

describe("record sheet odontogram", () => {
  const palette = [{ id: "CAR", label: "Caries" }];
  it("draws a coloured chart with a legend", () => {
    const html = recordSheetHtml({ name: "A", toothConditions: { 16: ["CAR"], 46: "MIS", 21: ["X:Odd <b>"] } }, { palette }, {});
    expect(html).toContain("class=\"tooth");
    expect(html).toContain("#e11d48");
    expect(html).toContain("Caries");
    expect(html).not.toContain("<b>");
    expect(html).not.toContain("Primary teeth");
  });
  it("shows primary teeth only when charted", () => {
    expect(recordSheetHtml({ name: "A", toothConditions: { 54: ["CAR"] } }, {}, {})).toContain("Primary teeth");
  });
  it("omits the section when nothing is charted", () => {
    expect(recordSheetHtml({ name: "A" }, {}, {})).not.toContain("Odontogram");
  });
});
