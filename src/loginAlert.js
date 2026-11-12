import { auth } from "./firebase.js";

// Tells the site's own /api/login-alert function that this person just signed in, once per browser session.
// It never blocks or breaks sign-in: any failure is ignored.
export const sendLoginAlert = async (uid) => {
  try {
    const flag = `merident.loginAlert.${uid}`;
    if (sessionStorage.getItem(flag)) return;
    sessionStorage.setItem(flag, "1");
    const user = auth && auth.currentUser;
    if (!user) return;
    const token = await user.getIdToken();
    await fetch("/api/login-alert", { method: "POST", headers: { Authorization: `Bearer ${token}` }, keepalive: true });
  } catch { /* ignore */ }
};
