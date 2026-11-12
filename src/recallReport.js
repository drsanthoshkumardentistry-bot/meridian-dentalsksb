// Did the recall messages bring patients back? Pure functions, no React.
import { parseAnyDate } from "./reminders.js";

const pad = (n) => String(n).padStart(2, "0");
const ymOf = (d) => (d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}` : "");
const dayStart = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/**
 * Of the patients sent a recall message in the month (lastRecallAt), how many have a visit
 * booked or done on or after that day. Only each patient's latest message is stored, so a patient
 * messaged again later is counted for the later month.
 */
export const recallConversion = (patients = [], appointments = [], ym) => {
  const appts = (Array.isArray(appointments) ? appointments : []).filter((a) => a && typeof a === "object");
  let sent = 0;
  let returned = 0;
  let completed = 0;
  for (const p of Array.isArray(patients) ? patients : []) {
    if (!p || !p.lastRecallAt) continue;
    const at = new Date(p.lastRecallAt);
    if (Number.isNaN(at.getTime()) || ymOf(at) !== ym) continue;
    sent += 1;
    const after = appts.filter((a) => {
      const d = parseAnyDate(a.date);
      const status = String(a.status || "").trim().toLowerCase();
      return d && !status.startsWith("cancel") && status !== "no show" && dayStart(d) >= dayStart(at) && (a.patientId === p.id || (!a.patientId && a.patientName === p.name));
    });
    if (after.length) returned += 1;
    if (after.some((a) => String(a.status || "").trim().toLowerCase() === "completed")) completed += 1;
  }
  return { sent, returned, completed, ratePct: sent ? Math.round((returned / sent) * 100) : 0 };
};
