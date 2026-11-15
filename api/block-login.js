// Vercel function: /api/block-login. The "Block this login" link from the sign-in alert e-mail.
// GET shows a confirmation page, POST (the button) blocks or un-blocks the account. Needs FIREBASE_SERVICE_ACCOUNT.
import { readServiceAccount, verifyLink, buildLink, setBlocked } from "./_lib/blockCore.js";

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const page = (res, status, title, body) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex");
  res.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>body{font:16px/1.5 system-ui,sans-serif;max-width:30rem;margin:12vh auto;padding:0 1rem;color:#0f172a}button{font:inherit;padding:.7rem 1.2rem;border:0;border-radius:.6rem;background:#dc2626;color:#fff;cursor:pointer}button.ok{background:#0f766e}a{color:#1d4ed8}</style></head><body><h1>${esc(title)}</h1>${body}</body></html>`);
};

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") return page(res, 405, "Not allowed", "<p>Open the link from your e-mail.</p>");
  const sa = readServiceAccount();
  if (!sa) return page(res, 503, "Not set up yet", "<p>Blocking from e-mail is not switched on for this site yet. The site owner needs to add the Firebase service account.</p>");

  let params;
  try { params = Object.fromEntries(new URL(req.url || "", "https://x.invalid").searchParams); } catch (e) { params = {}; }
  if (!verifyLink(sa, params)) return page(res, 400, "Link not valid", "<p>This link is wrong or has expired (links last 7 days). Open a newer sign-in alert e-mail.</p>");

  const blocking = params.a === "block";
  const who = esc(params.n || "this account");
  if (req.method === "GET") {
    return page(res, 200, blocking ? "Block this login?" : "Allow this login again?",
      `<p><b>${who}</b> ${blocking ? "will not be able to sign in to MeriDent, and any open session will end." : "will be able to sign in to MeriDent again."}</p>
       <form method="post" action="/api/block-login?${esc(new URLSearchParams(params).toString())}"><button class="${blocking ? "" : "ok"}" type="submit">${blocking ? "Yes, block" : "Yes, allow again"}</button></form>`);
  }
  try {
    await setBlocked(sa, params.u, blocking);
  } catch (e) {
    return page(res, 502, "Could not finish", "<p>Firebase did not accept the change. Try again in a minute.</p>");
  }
  const undo = buildLink(process.env.SITE_URL || "https://www.meridiandentalos.com", sa, params.u, blocking ? "unblock" : "block", params.n);
  return page(res, 200, blocking ? "Login blocked" : "Login allowed again",
    `<p><b>${who}</b> ${blocking ? "can no longer sign in." : "can sign in again."}</p><p><a href="${esc(undo)}">${blocking ? "Undo (allow again)" : "Block again"}</a></p>`);
}
