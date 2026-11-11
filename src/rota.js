import { onLeaveOn } from "./staff.js";

export const ROTA_DAYS = [
  { id: "mon", label: "Mon" }, { id: "tue", label: "Tue" }, { id: "wed", label: "Wed" },
  { id: "thu", label: "Thu" }, { id: "fri", label: "Fri" }, { id: "sat", label: "Sat" }, { id: "sun", label: "Sun" },
];
export const OFF = "";
export const ANY = "Any chair";

export const dayIdOf = (date = new Date()) => ROTA_DAYS[(date.getDay() + 6) % 7].id;

export const rotaFor = (emp, day) => (emp?.rota && typeof emp.rota[day] === "string" ? emp.rota[day] : OFF);

/** Value must be Off, "Any chair", or one of the clinic's chairs. */
export const setRota = (emp, day, value, chairs = []) => {
  if (!ROTA_DAYS.some((d) => d.id === day)) return emp;
  const v = value === ANY || chairs.includes(value) ? value : OFF;
  return { ...emp, rota: { ...(emp.rota || {}), [day]: v } };
};

/** Copy one person's Monday plan to Tue-Fri. */
export const copyMonToWeekdays = (emp) => {
  const mon = rotaFor(emp, "mon");
  return { ...emp, rota: { ...(emp.rota || {}), tue: mon, wed: mon, thu: mon, fri: mon } };
};

/** Who is on which chair today. Staff on approved leave or marked inactive are left out. */
export const todaysCover = (employees = [], chairs = [], now = new Date()) => {
  const day = dayIdOf(now);
  const away = new Set(onLeaveOn(employees, now).map((e) => e.id));
  const working = employees.filter((e) => e.active !== false && !away.has(e.id) && rotaFor(e, day) !== OFF);
  const byChair = chairs.map((chair) => ({
    chair,
    staff: working.filter((e) => rotaFor(e, day) === chair).map((e) => e.name),
  }));
  const anyChair = working.filter((e) => rotaFor(e, day) === ANY).map((e) => e.name);
  const awayNames = employees.filter((e) => away.has(e.id) && rotaFor(e, day) !== OFF).map((e) => e.name);
  return { day, byChair, anyChair, awayNames, uncovered: byChair.filter((c) => !c.staff.length && !anyChair.length).map((c) => c.chair) };
};
