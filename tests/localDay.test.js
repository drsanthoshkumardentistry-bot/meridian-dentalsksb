// Between midnight and 5:30 am in India the UTC date is still "yesterday". Printed dates and file names must use the clinic's own day.
import { describe, it, expect, afterEach } from "vitest";
import { recordSheetHtml } from "../src/recordSheet.js";
import { backupFileName } from "../src/portability.js";

const OLD_TZ = process.env.TZ;
afterEach(() => { if (OLD_TZ === undefined) delete process.env.TZ; else process.env.TZ = OLD_TZ; });

describe("clinic's own calendar day", () => {
  it("prints today's India date at 1:30 am IST, not yesterday's", () => {
    process.env.TZ = "Asia/Kolkata";
    const now = new Date("2026-11-14T20:00:00Z"); // 15 Nov 2026, 01:30 IST
    expect(recordSheetHtml({ name: "A" }, {}, {}, now)).toContain("Printed 15/11/2026");
  });
  it("names the backup file with the India date at 1:30 am IST", () => {
    process.env.TZ = "Asia/Kolkata";
    const now = new Date("2026-11-14T20:00:00Z");
    expect(backupFileName({ kind: "clinic", data: { patients: [] } }, now)).toContain("2026-11-15");
  });
});
