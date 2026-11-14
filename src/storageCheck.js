import { FREE_PLAN_BYTES } from "./storageUsage";

export const CHECK_KEY = "merident-storage-check";
export const REMIND_DAYS = 30;
export const WARN_PERCENT = 70;
const DAY = 24 * 60 * 60 * 1000;

// Reads the last value the admin typed in. Never throws.
export const loadCheck = (store = (typeof localStorage !== "undefined" ? localStorage : null)) => {
  try {
    const v = JSON.parse(store.getItem(CHECK_KEY) || "null");
    if (v && Number.isFinite(v.mib) && v.mib >= 0 && Number.isFinite(v.at)) return { mib: v.mib, at: v.at };
  } catch { /* nothing saved */ }
  return null;
};

export const saveCheck = (mib, now = Date.now(), store = (typeof localStorage !== "undefined" ? localStorage : null)) => {
  const n = Number(mib);
  if (!Number.isFinite(n) || n < 0 || n > 1024 * 1024) return null;
  const v = { mib: n, at: now };
  try { store.setItem(CHECK_KEY, JSON.stringify(v)); } catch { /* storage blocked */ }
  return v;
};

// percent of the free 1 GiB used, and what the admin should do next.
export const checkStatus = (check, now = Date.now()) => {
  if (!check) return { level: "never", percent: 0, daysAgo: null, due: true };
  const percent = (check.mib * 1024 * 1024 / FREE_PLAN_BYTES) * 100;
  const daysAgo = Math.max(0, Math.floor((now - check.at) / DAY));
  const due = daysAgo >= REMIND_DAYS;
  const level = percent >= WARN_PERCENT ? "warn" : due ? "due" : "ok";
  return { level, percent, daysAgo, due };
};
