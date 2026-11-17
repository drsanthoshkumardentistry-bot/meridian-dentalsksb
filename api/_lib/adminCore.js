// Founder dashboard numbers. Counts sign-ups and activity from the sign-in list only (dates and emails of clinic owners).
// It never reads clinics/{id}/... so no patient data is touched.
import { getAccessToken } from "./blockCore.js";

const DAY = 24 * 60 * 60 * 1000;
const SCOPE = "https://www.googleapis.com/auth/identitytoolkit";

export const founderEmails = (raw = process.env.FOUNDER_EMAILS || "") =>
  String(raw).split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

export const isFounder = (email, raw) => !!email && founderEmails(raw).includes(String(email).toLowerCase());

/** Pure: turn a list of sign-in accounts into the numbers the founder screen shows. */
export const summarise = (users, now = Date.now()) => {
  const list = (Array.isArray(users) ? users : []).filter((u) => u && typeof u === "object");
  const t = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : 0; };
  const within = (ms, days) => ms > 0 && now - ms <= days * DAY;
  const rows = list.map((u) => ({
    email: typeof u.email === "string" ? u.email.slice(0, 120) : "(no email)",
    created: t(u.createdAt),
    lastLogin: t(u.lastLoginAt),
  }));
  const weeks = [];
  for (let w = 7; w >= 0; w--) {
    const from = now - (w + 1) * 7 * DAY, to = now - w * 7 * DAY;
    weeks.push({ from, signUps: rows.filter((r) => r.created > from && r.created <= to).length });
  }
  return {
    total: rows.length,
    newLast7: rows.filter((r) => within(r.created, 7)).length,
    newLast30: rows.filter((r) => within(r.created, 30)).length,
    activeLast7: rows.filter((r) => within(r.lastLogin, 7)).length,
    activeLast30: rows.filter((r) => within(r.lastLogin, 30)).length,
    quiet30: rows.filter((r) => r.created > 0 && !within(r.lastLogin, 30) && !within(r.created, 30)).length,
    weeks,
    recent: rows.sort((a, b) => b.created - a.created).slice(0, 15),
  };
};

/** Lists every sign-in account (up to 20,000) with the service account. */
export const listAllUsers = async ({ sa, fetchFn = fetch, now = Date.now() }) => {
  const token = await getAccessToken(sa, fetchFn, now, SCOPE);
  const out = [];
  let pageToken = "";
  for (let i = 0; i < 20; i++) {
    const url = `https://identitytoolkit.googleapis.com/v1/projects/${encodeURIComponent(sa.project_id)}/accounts:batchGet?maxResults=1000${pageToken ? `&nextPageToken=${encodeURIComponent(pageToken)}` : ""}`;
    const r = await fetchFn(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) throw new Error("identity " + r.status);
    const d = await r.json();
    for (const u of d.users || []) out.push({ uid: u.localId, email: u.email, createdAt: u.createdAt, lastLoginAt: u.lastLoginAt });
    if (!d.nextPageToken) break;
    pageToken = d.nextPageToken;
  }
  return out;
};
