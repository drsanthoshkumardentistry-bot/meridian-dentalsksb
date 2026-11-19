import { describe, it, expect } from "vitest";
import { packText, unpackText, canCompress } from "../src/restoreCompress.js";

describe("restore point compression", () => {
  it("round-trips text and makes repetitive records much smaller", async () => {
    const text = JSON.stringify({ patients: Array.from({ length: 400 }, (_, i) => ({ id: i, name: `Patient ${i}`, notes: "scaling and polishing, review in six months" })) });
    const packed = await packText(text);
    if (!canCompress()) { expect(packed.enc).toBe(""); return; }
    expect(packed.enc).toBe("gz");
    expect(packed.text.length).toBeLessThan(text.length / 3);
    expect(await unpackText(packed.text, packed.enc)).toBe(text);
  });
  it("opens older plain copies that have no enc field", async () => {
    expect(await unpackText('{"a":1}', undefined)).toBe('{"a":1}');
  });
  it("handles accented and Tamil text", async () => {
    const text = JSON.stringify({ n: "கோயம்புத்தூர் José" });
    const p = await packText(text);
    expect(await unpackText(p.text, p.enc)).toBe(text);
  });
});
