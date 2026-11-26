// Builds the "someone signed in" email. Only the sign-in address, display name and time: no patient or clinic data.
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const istTime = (d = new Date()) =>
  new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }).format(d) + " IST";

export const buildAlert = ({ email, name, firstTime = false, blockUrl = "" }, now = new Date()) => {
  const who = String(email || "unknown").slice(0, 120);
  const when = istTime(now);
  return {
    subject: `${who} logged in to MeriDent`,
    text: `${who} logged in to MeriDent.\n${name ? `Name: ${name}\n` : ""}Time: ${when}\n${firstTime ? "This looks like a first sign-in.\n" : ""}${blockUrl ? `\nNot someone you expect? Block this login (asks you to confirm first):\n${blockUrl}\n` : ""}`,
    html: `<p><b>${esc(who)}</b> logged in to MeriDent.</p>${name ? `<p>Name: ${esc(name)}</p>` : ""}<p>Time: ${esc(when)}</p>${firstTime ? "<p>This looks like a first sign-in.</p>" : ""}${blockUrl ? `<p>Not someone you expect? <a href="${esc(blockUrl)}">Block this login</a> (you will be asked to confirm).</p>` : ""}`,
  };
};

// Looks up the caller from their Firebase ID token. Returns { uid, email, name, createdAt, lastLoginAt } or null.
export const lookupUser = async (idToken, fetchFn = fetch, diag = null) => {
  const why = (t) => { if (diag) diag.why = t; return null; };
  const apiKey = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
  if (!apiKey) return why("The server has no FIREBASE_API_KEY.");
  if (!idToken) return why("No sign-in token was sent.");
  // A key limited to website visits rejects server calls that carry no referrer, so say which site this is.
  const headers = { "Content-Type": "application/json" };
  if (process.env.SITE_URL) headers.Referer = String(process.env.SITE_URL).replace(/\/+$/, "") + "/";
  const r = await fetchFn(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
    method: "POST", headers, body: JSON.stringify({ idToken }),
  });
  if (!r.ok) {
    let m = "";
    try { const e = await r.json(); m = e && e.error && e.error.message ? String(e.error.message).slice(0, 160) : ""; } catch { /* no body */ }
    return why(`Google answered ${r.status}${m ? `: ${m}` : ""}`);
  }
  const data = await r.json();
  const u = data && data.users && data.users[0];
  if (!u) return why("Google found no account for this sign-in.");
  if (!u.email) return why("This account has no email address.");
  if (u.emailVerified === false) return why("This email address is not verified yet.");
  return { uid: u.localId, email: String(u.email).toLowerCase(), name: u.displayName || "", createdAt: Number(u.createdAt) || 0, lastLoginAt: Number(u.lastLoginAt) || 0 };
};
