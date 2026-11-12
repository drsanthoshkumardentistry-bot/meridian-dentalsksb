// "Specialist mode": a dentist who only wants MeriDent Connect (no clinic software).
// The choice is picked on the sign-in page, kept on this device, and saved on the Connect profile
// so it follows the account to other devices.
const PENDING = "merident.connectOnly.pending";
const mineKey = (uid) => `merident.connectOnly.${uid}`;

const read = (k) => { try { return window.localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { if (v === null) window.localStorage.removeItem(k); else window.localStorage.setItem(k, v); } catch { /* storage may be blocked */ } };

export const setPendingConnectOnly = (on) => write(PENDING, on ? "1" : null);
export const hasPendingConnectOnly = () => read(PENDING) === "1";
export const isConnectOnly = (uid) => Boolean(uid) && read(mineKey(uid)) === "1";
export const setConnectOnly = (uid, on) => { if (uid) write(mineKey(uid), on ? "1" : "0"); };

/** After sign-in: turn the choice made on the sign-in page into this account's setting. */
export const claimPendingConnectOnly = (uid) => {
  if (!uid || !hasPendingConnectOnly()) return false;
  setConnectOnly(uid, true);
  setPendingConnectOnly(false);
  return true;
};

/** 1 = on, 0 = switched off by the person, null = never decided on this device. */
export const connectOnlyChoice = (uid) => { const v = uid ? read(mineKey(uid)) : null; return v === "1" ? 1 : v === "0" ? 0 : null; };

/** Count shown in the browser tab, e.g. "(3) MeriDent". */
export const tabTitle = (count, base = "MeriDent") => (count > 0 ? `(${count}) ${base}` : base);
