import { dateKey } from "./reminders.js";

export const Q_STATUS = { WAITING: "Waiting", IN_CHAIR: "In chair", DONE: "Done", LEFT: "Left" };
export const PRIORITIES = ["Normal", "Urgent"];
const open = (e) => e.status === Q_STATUS.WAITING || e.status === Q_STATUS.IN_CHAIR;

export const nextToken = (queue = [], ymd) =>
  queue.filter((e) => e.date === ymd).reduce((m, e) => Math.max(m, e.token || 0), 0) + 1;

export const addWalkIn = (queue, form, id, now = new Date()) => {
  const name = String(form.name || "").trim().slice(0, 80);
  if (!name) return { ok: false, error: "Enter the patient's name" };
  const phone = String(form.phone || "").replace(/\D/g, "").slice(-10);
  if (phone && phone.length !== 10) return { ok: false, error: "Enter a valid 10-digit mobile number or leave it blank" };
  const date = dateKey(now);
  const priority = PRIORITIES.includes(form.priority) ? form.priority : "Normal";
  const entry = {
    id, date, token: nextToken(queue, date), name, phone,
    reason: String(form.reason || "").trim().slice(0, 120),
    priority, status: Q_STATUS.WAITING, arrivedAt: now.toISOString(), calledAt: "", closedAt: "",
  };
  return { ok: true, entry };
};

export const setQueueStatus = (entry, status, now = new Date()) => {
  if (!Object.values(Q_STATUS).includes(status)) return entry;
  const next = { ...entry, status };
  if (status === Q_STATUS.IN_CHAIR) next.calledAt = now.toISOString();
  if (status === Q_STATUS.DONE || status === Q_STATUS.LEFT) next.closedAt = now.toISOString();
  return next;
};

/** Today's list: in chair first, then urgent, then arrival order; finished entries last. */
export const queueView = (queue = [], ymd) => {
  const rank = (e) => (e.status === Q_STATUS.IN_CHAIR ? 0 : e.status === Q_STATUS.WAITING ? (e.priority === "Urgent" ? 1 : 2) : 3);
  return queue.filter((e) => e.date === ymd).sort((a, b) => rank(a) - rank(b) || a.token - b.token);
};

export const waitMinutes = (entry, now = new Date()) => {
  const start = new Date(entry.arrivedAt).getTime();
  const end = entry.calledAt ? new Date(entry.calledAt).getTime() : now.getTime();
  return Number.isFinite(start) ? Math.max(0, Math.round((end - start) / 60000)) : 0;
};

export const queueSummary = (queue = [], ymd, now = new Date()) => {
  const today = queue.filter((e) => e.date === ymd);
  const waiting = today.filter((e) => e.status === Q_STATUS.WAITING);
  const served = today.filter((e) => e.calledAt);
  const avg = served.length ? Math.round(served.reduce((s, e) => s + waitMinutes(e, now), 0) / served.length) : 0;
  return {
    total: today.length, waiting: waiting.length, urgent: waiting.filter((e) => e.priority === "Urgent").length,
    inChair: today.filter((e) => e.status === Q_STATUS.IN_CHAIR).length,
    done: today.filter((e) => e.status === Q_STATUS.DONE).length, avgWaitMin: avg,
  };
};

export const pruneQueue = (queue = [], now = new Date(), keepDays = 30) => {
  const cutoff = dateKey(new Date(now.getTime() - keepDays * 864e5));
  return queue.filter((e) => e.date >= cutoff || open(e));
};
