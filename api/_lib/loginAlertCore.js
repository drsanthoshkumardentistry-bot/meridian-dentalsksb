// Builds the "someone signed in" email. Only the sign-in address, display name and time: no patient or clinic data.
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const istTime = (d = new Date()) =>
  new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }).format(d) + " IST";

export const buildAlert = ({ email, name, firstTime = false }, now = new Date()) => {
  const who = String(email || "unknown").slice(0, 120);
  const when = istTime(now);
  return {
    subject: `${who} logged in to MeriDent`,
    text: `${who} logged in to MeriDent.\n${name ? `Name: ${name}\n` : ""}Time: ${when}\n${firstTime ? "This looks like a first sign-in.\n" : ""}`,
    html: `<p><b>${esc(who)}</b> logged in to MeriDent.</p>${name ? `<p>Name: ${esc(name)}</p>` : ""}<p>Time: ${esc(when)}</p>${firstTime ? "<p>This looks like a first sign-in.</p>" : ""}`,
  };
};

// Looks up the caller from their Firebase ID token. Returns { uid, email, name, createdAt, lastLoginAt } or null.
export const lookupUser = async (idToken, fetchFn = fetch) => {
  const apiKey = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
  if (!apiKey || !idToken) return null;
  const r = await fetchFn(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken }),
  });
  if (!r.ok) return null;
  const data = await r.json();
  const u = data && data.users && data.users[0];
  if (!u || !u.email || u.emailVerified === false) return null;
  return { uid: u.localId, email: String(u.email).toLowerCase(), name: u.displayName || "", createdAt: Number(u.createdAt) || 0, lastLoginAt: Number(u.lastLoginAt) || 0 };
};
