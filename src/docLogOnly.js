// "DocLog only" mode: a visiting doctor who only wants MeriDent DocLog (no clinic software).
// Works like the Connect-only tick box: the sign-in page decides, and the choice is remembered per account.
const CHOICE = "merident.docLogOnly.choice";
const mineKey = (uid) => `merident.docLogOnly.v1.${uid}`;
const read = (k) => { try { return window.localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { window.localStorage.setItem(k, v); } catch { /* storage may be blocked */ } };

export const docSignInChoice = () => { const v = read(CHOICE); return v === "1" ? true : v === "0" ? false : null; };
export const setDocSignInChoice = (on) => write(CHOICE, on ? "1" : "0");
export const isDocLogOnly = (uid) => Boolean(uid) && read(mineKey(uid)) === "1";
export const setDocLogOnly = (uid, on) => { if (uid) write(mineKey(uid), on ? "1" : "0"); };

/** Called once an account is signed in: a choice made on the sign-in page wins and is saved for the account. */
export const resolveDocLogOnly = (uid) => {
  if (!uid) return false;
  const choice = docSignInChoice();
  if (choice !== null) setDocLogOnly(uid, choice);
  return isDocLogOnly(uid);
};
