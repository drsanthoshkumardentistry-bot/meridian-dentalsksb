// "Specialist mode": a dentist who only wants MeriDent Connect (no clinic software).
// The tick box on the sign-in page decides, every time: ticked = Connect only, unticked = the full app.
// The box remembers its last state on this device, so a returning specialist sees it already ticked.
const CHOICE = "merident.connectOnly.choice";
const mineKey = (uid) => `merident.connectOnly.v2.${uid}`;

const read = (k) => { try { return window.localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { if (v === null) window.localStorage.removeItem(k); else window.localStorage.setItem(k, v); } catch { /* storage may be blocked */ } };

/** The sign-in box: true, false, or null when the person has never touched it on this device. */
export const signInChoice = () => { const v = read(CHOICE); return v === "1" ? true : v === "0" ? false : null; };
export const setSignInChoice = (on) => write(CHOICE, on ? "1" : "0");

export const isConnectOnly = (uid) => Boolean(uid) && read(mineKey(uid)) === "1";
export const setConnectOnly = (uid, on) => { if (uid) write(mineKey(uid), on ? "1" : "0"); };

/**
 * Called once an account is signed in. A choice made on the sign-in page always wins and is saved for the account;
 * with no choice on this device the last saved setting for the account is used (off if none).
 */
export const resolveConnectOnly = (uid) => {
  if (!uid) return false;
  const choice = signInChoice();
  if (choice !== null) setConnectOnly(uid, choice);
  return isConnectOnly(uid);
};

/** Count shown in the browser tab, e.g. "(3) MeriDent". */
export const tabTitle = (count, base = "MeriDent") => (count > 0 ? `(${count}) ${base}` : base);
