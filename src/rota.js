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

const parseYmd = (ymd) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd || ""));
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12) : null;
};

/** A gentle warning for the booking form. Empty when all is fine or the clinic has not set up a rota. Never blocks. */
export const rotaWarning = ({ employees = [], doctor = "", chair = "", date = "" }) => {
  const when = parseYmd(date);
  if (!when || !employees.some((e) => e.rota && Object.values(e.rota).some(Boolean))) return "";
  const day = dayIdOf(when);
  const label = ROTA_DAYS.find((d) => d.id === day).label;
  const doc = employees.find((e) => e.active !== false && e.name && e.name === String(doctor).trim());
  if (doc) {
    if (onLeaveOn([doc], when).length) return `${doc.name} is on approved leave on ${label}.`;
    const plan = rotaFor(doc, day);
    if (plan === OFF) return `${doc.name} is marked off on ${label} in the rota.`;
    if (plan !== ANY && chair && plan !== chair) return `${doc.name} is planned for ${plan.split(" (")[0]} on ${label}, not ${chair.split(" (")[0]}.`;
    return "";
  }
  const present = employees.filter((e) => e.active !== false && !onLeaveOn([e], when).length && [chair, ANY].includes(rotaFor(e, day)));
  return present.length || !chair ? "" : `No one is rostered on ${chair.split(" (")[0]} on ${label}.`;
};
