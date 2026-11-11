import { describe, it, expect } from "vitest";
import { isoToDmy, maskDmy, dmyToIso } from "../src/dateInput.js";

describe("dd/mm/yyyy helpers", () => {
  it("shows ISO dates in the Indian order", () => {
    expect(isoToDmy("2006-01-29")).toBe("29/01/2006");
    expect(isoToDmy("")).toBe("");
    expect(isoToDmy("29/01/2006")).toBe("");
  });
  it("adds slashes while typing and ignores letters", () => {
    expect(maskDmy("2")).toBe("2");
    expect(maskDmy("2901")).toBe("29/01");
    expect(maskDmy("29012006")).toBe("29/01/2006");
    expect(maskDmy("29-01-2006xyz")).toBe("29/01/2006");
  });
  it("accepts only real dates", () => {
    expect(dmyToIso("29/01/2006")).toBe("2006-01-29");
    expect(dmyToIso("29/02/2024")).toBe("2024-02-29");
    expect(dmyToIso("29/02/2023")).toBe("");
    expect(dmyToIso("31/04/2020")).toBe("");
    expect(dmyToIso("01/01/1850")).toBe("");
    expect(dmyToIso("1/1/2020")).toBe("");
  });
});
