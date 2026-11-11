import { describe, it, expect } from "vitest";
import { dayIdOf, rotaFor, setRota, copyMonToWeekdays, todaysCover, ANY } from "../src/rota.js";

const chairs = ["Chair 1 (Main)", "Chair 2"];
const wed = new Date(2026, 10, 11, 10); // Wed 11 Nov 2026

describe("staff rota", () => {
  it("maps dates to day ids", () => {
    expect(dayIdOf(wed)).toBe("wed");
    expect(dayIdOf(new Date(2026, 10, 15))).toBe("sun");
    expect(dayIdOf(new Date(2026, 10, 9))).toBe("mon");
  });
  it("accepts only off, any chair or a real chair", () => {
    let e = setRota({ id: 1 }, "mon", "Chair 2", chairs);
    expect(rotaFor(e, "mon")).toBe("Chair 2");
    e = setRota(e, "mon", "Imaginary", chairs);
    expect(rotaFor(e, "mon")).toBe("");
    expect(rotaFor(setRota(e, "tue", ANY, chairs), "tue")).toBe(ANY);
    expect(setRota(e, "xyz", "Chair 2", chairs)).toBe(e);
  });
  it("copies Monday to the weekdays", () => {
    const e = copyMonToWeekdays(setRota({ id: 1 }, "mon", "Chair 2", chairs));
    expect(["tue", "wed", "thu", "fri"].every((d) => rotaFor(e, d) === "Chair 2")).toBe(true);
    expect(rotaFor(e, "sat")).toBe("");
  });
  it("works out today's cover, skipping leave and inactive staff", () => {
    const emps = [
      { id: 1, name: "Dr A", rota: { wed: "Chair 1 (Main)" } },
      { id: 2, name: "Dr B", rota: { wed: "Chair 2" }, leaves: [{ status: "Approved", startDate: "2026-11-11", endDate: "2026-11-11" }] },
      { id: 3, name: "Asha", rota: { wed: ANY }, active: false },
      { id: 4, name: "Ravi", rota: { thu: "Chair 2" } },
    ];
    const c = todaysCover(emps, chairs, wed);
    expect(c.byChair[0].staff).toEqual(["Dr A"]);
    expect(c.byChair[1].staff).toEqual([]);
    expect(c.awayNames).toEqual(["Dr B"]);
    expect(c.uncovered).toEqual(["Chair 2"]);
  });
  it("any-chair staff cover every chair", () => {
    const c = todaysCover([{ id: 1, name: "Z", rota: { wed: ANY } }], chairs, wed);
    expect(c.uncovered).toEqual([]);
  });
});

import { rotaWarning } from "../src/rota.js";
describe("booking rota warning", () => {
  const emps = [
    { id: 1, name: "Dr A", rota: { wed: "Chair 1 (Main)", thu: "" } },
    { id: 2, name: "Dr B", rota: { wed: "Chair 2" }, leaves: [{ status: "Approved", startDate: "2026-11-12", endDate: "2026-11-12" }] },
  ];
  const base = { employees: emps, date: "2026-11-11" };
  it("stays quiet without a rota or when everything matches", () => {
    expect(rotaWarning({ employees: [{ id: 1, name: "X" }], doctor: "X", chair: "C", date: "2026-11-11" })).toBe("");
    expect(rotaWarning({ ...base, doctor: "Dr A", chair: "Chair 1 (Main)" })).toBe("");
    expect(rotaWarning({ ...base, doctor: "Dr Owner", chair: "Chair 1 (Main)" })).toBe("");
  });
  it("warns about off days, wrong chairs, leave and empty chairs", () => {
    expect(rotaWarning({ ...base, date: "2026-11-12", doctor: "Dr A", chair: "Chair 1 (Main)" })).toMatch(/off on Thu/);
    expect(rotaWarning({ ...base, doctor: "Dr A", chair: "Chair 2" })).toMatch(/planned for Chair 1 on Wed, not Chair 2/);
    expect(rotaWarning({ ...base, date: "2026-11-12", doctor: "Dr B", chair: "Chair 2" })).toMatch(/approved leave/);
    expect(rotaWarning({ ...base, doctor: "Dr Owner", chair: "Chair 3" })).toMatch(/No one is rostered on Chair 3 on Wed/);
  });
});
