import { describe, it, expect } from "vitest";
import { chunkText, joinChunks } from "../src/restorePoints.js";
import { friendlyAuthError } from "../src/authErrors.js";
import { globalSearch } from "../src/search.js";

describe("bugs found by the stress tests", () => {
  it("chunkText stops on a size of 0 or less and ignores non-text", () => {
    for (const size of [0, -3, NaN, Infinity, 0.4]) expect(joinChunks(chunkText("hello world", size))).toBe("hello world");
    expect(chunkText(null)).toEqual([""]);
    expect(chunkText("abcdef", 2)).toEqual(["ab", "cd", "ef"]);
  });
  it("sign-in errors with built-in names give a message, not an object", () => {
    for (const code of ["constructor", "__proto__", "toString", "hasOwnProperty"]) expect(typeof friendlyAuthError({ code })).toBe("string");
    expect(friendlyAuthError({ code: "auth/wrong-password" })).toMatch(/incorrect/);
  });
  it("search survives empty or damaged records", () => {
    const r = globalSearch({ patients: [null, 5, { id: "P1", name: "Asha" }], appointments: [undefined], invoices: "x" }, "asha");
    expect(r.patients).toHaveLength(1);
  });
});
