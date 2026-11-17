// Who is online and for how long. The app sends a small "still here" message every 5 minutes while a clinic's tab is open.
// Stored in presence/{uid}: sign-in email, last seen, and minutes per day. No patient or clinic records. Server-only collection.
import { getDoc, putDoc, listDocs, goodUid } from "./fsLite.js";

export const BEAT_MS = 5 * 60 * 1000;
export const ONLINE_MS = 10 * 60 * 1000; // seen within this long = online now
const MAX_CREDIT_MS = 10 * 60 * 1000;    // longest gap counted as time spent between two messages
const KEEP_DAYS = 14;

/** Calendar day in India (UTC+5:30), as YYYY-MM-DD. */
export const dayKey = (ms) => new Date(ms + 5.5 * 3600000).toISOString().slice(0, 10);

const parseDays = (s) => { try { const o = JSON.parse(s || "{}"); return o && typeof o === "object" && !Array.isArray(o) ? o : {}; } catch { return {}; } };

/** Pure: the next presence record after a "still here" message. Time between two messages of one session is counted. */
export function nextPresence(prev, { sessionId, email, now }) {
  const p = prev || {};
  const sameSession = p.sessionId === sessionId && p.lastSeen > 0 && now >= p.lastSeen && now - p.lastSeen <= MAX_CREDIT_MS;
  const credit = sameSession ? now - p.lastSeen : 0;
  const days = parseDays(p.daysJson);
  const today = dayKey(now);
  if (credit > 0) days[today] = Math.round((Number(days[today]) || 0) + credit);
  const keep = Object.keys(days).sort().slice(-KEEP_DAYS);
  const pruned = {};
  for (const k of keep) pruned[k] = days[k];
  const newSession = !sameSession && p.sessionId !== sessionId;
  return {
    email: String(email || p.email || "").slice(0, 120),
    sessionId: String(sessionId).slice(0, 64),
    startedAt: sameSession || p.sessionId === sessionId ? p.startedAt || now : now,
    lastSeen: now,
    totalMs: Math.round((Number(p.totalMs) || 0) + credit),
    sessions: (Number(p.sessions) || 0) + (newSession || !prev ? 1 : 0),
    daysJson: JSON.stringify(pruned),
  };
}

export const recordBeat = async ({ sa, uid, email, sessionId, fetchFn = fetch, now = Date.now() }) => {
  if (!goodUid(uid)) throw new Error("uid");
  if (typeof sessionId !== "string" || !/^[A-Za-z0-9_-]{6,64}$/.test(sessionId)) throw new Error("session");
  const path = `presence/${encodeURIComponent(uid)}`;
  const prev = await getDoc({ sa, path, fetchFn, now });
  await putDoc({ sa, path, data: nextPresence(prev, { sessionId, email, now }), fetchFn, now });
};

export const listPresence = (args) => listDocs({ ...args, collection: "presence" });

/** Pure: numbers for the dashboard from presence documents. */
export function summarisePresence(rows, now = Date.now()) {
  const list = (Array.isArray(rows) ? rows : []).filter((r) => r && typeof r === "object");
  const today = dayKey(now);
  const last7 = Array.from({ length: 7 }, (_, i) => dayKey(now - (6 - i) * 86400000));
  const per = list.map((r) => {
    const d = parseDays(r.daysJson);
    const mins = (k) => Math.round((Number(d[k]) || 0) / 60000);
    return {
      uid: String(r.id || ""), email: String(r.email || "").slice(0, 120), lastSeen: Number(r.lastSeen) || 0,
      online: Number(r.lastSeen) > 0 && now - Number(r.lastSeen) <= ONLINE_MS,
      todayMin: mins(today), weekMin: last7.reduce((n, k) => n + mins(k), 0), sessions: Number(r.sessions) || 0, totalMin: Math.round((Number(r.totalMs) || 0) / 60000),
    };
  });
  const dayTotals = last7.map((k) => ({ day: k, hours: Math.round((list.reduce((n, r) => n + (Number(parseDays(r.daysJson)[k]) || 0), 0) / 3600000) * 10) / 10 }));
  return {
    onlineNow: per.filter((x) => x.online).length,
    activeToday: per.filter((x) => x.todayMin > 0 || x.online).length,
    hoursToday: Math.round((per.reduce((n, x) => n + x.todayMin, 0) / 60) * 10) / 10,
    hoursWeek: Math.round((per.reduce((n, x) => n + x.weekMin, 0) / 60) * 10) / 10,
    dayTotals,
    rows: per,
  };
}
