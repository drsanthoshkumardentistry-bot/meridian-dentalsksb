/* Friendly sign-in messages and small auth helpers (no Firebase imports, easy to test) */

const MESSAGES = {
  "auth/invalid-email": "Enter a valid email address.",
  "auth/user-not-found": "Email or password is incorrect.",
  "auth/wrong-password": "Email or password is incorrect.",
  "auth/invalid-credential": "Email or password is incorrect.",
  "auth/invalid-login-credentials": "Email or password is incorrect.",
  "auth/email-already-in-use": "An account with this email already exists. Try signing in instead.",
  "auth/weak-password": "Choose a stronger password (at least 8 characters).",
  "auth/too-many-requests": "Too many attempts. Please wait a few minutes and try again.",
  "auth/network-request-failed": "No internet connection. Check your network and try again.",
  "auth/popup-closed-by-user": "The sign-in window was closed before finishing. Please try again.",
  "auth/cancelled-popup-request": "Another sign-in window is already open. Close it and try again.",
  "auth/popup-blocked": "Your browser blocked the sign-in window. Allow pop-ups for this site, or open MeriDent in Chrome or Safari.",
  "auth/operation-not-supported-in-this-environment": "This browser cannot sign in here. Open MeriDent in Chrome or Safari.",
  "auth/unauthorized-domain": "This website address is not authorised for sign-in yet. Add it under Firebase Authentication, Settings, Authorized domains.",
  "auth/operation-not-allowed": "This sign-in method is not turned on yet. Enable it in Firebase Authentication.",
  "auth/account-exists-with-different-credential": "This email is already registered with a different sign-in method. Try Google sign-in.",
  "auth/user-disabled": "This account has been disabled. Please contact support.",
  "auth/requires-recent-login": "Please sign in again to continue.",
};

export function friendlyAuthError(error, fallback = "Something went wrong. Please try again.") {
  const code = error && error.code ? String(error.code) : "";
  if (code && MESSAGES[code]) return MESSAGES[code];
  if (!code && error && typeof error.message === "string" && error.message) return error.message;
  return fallback;
}

export const isValidEmailAddress = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || "").trim());

export const usesPasswordLogin = (user) =>
  Boolean(user && Array.isArray(user.providerData) && user.providerData.some((p) => p && p.providerId === "password"));
