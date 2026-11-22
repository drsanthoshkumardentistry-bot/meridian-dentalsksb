// POST /api/client-error. The app reports crashes here. Each report goes to the server log, and (when RESEND_API_KEY and
// LOGIN_ALERT_TO are set, the same ones the sign-in alert uses) one email goes to the owner. Always answers 204 so the app is never slowed.
import { makeLimiter } from "./_lib/aiCore.js";
import { sanitizeReport, buildErrorEmail } from "./_lib/clientErrorCore.js";
import { istTime } from "./_lib/loginAlertCore.js";
import { postResend } from "./_lib/mailCore.js";
import { visitorIp } from "./_lib/clientIp.js";

const perVisitor = makeLimiter(10, 60 * 60 * 1000); // 10 reports an hour per visitor
const emails = makeLimiter(12, 60 * 60 * 1000);     // at most 12 emails an hour in total
const seenSubjects = new Map();                      // the same error is emailed once an hour

const done = (res, status = 204) => { res.statusCode = status; res.setHeader("Cache-Control", "no-store"); res.end(); };

export default async function handler(req, res) {
  if (req.method !== "POST") return done(res, 405);
  const ip = visitorIp(req.headers);
  if (!perVisitor(ip)) return done(res, 429); // checked first: a sender repeating big junk bodies is cut off before any work is done on them
  const report = sanitizeReport(req.body);
  if (!report) return done(res, 400);

  console.error("client-error", JSON.stringify(report));

  const key = process.env.RESEND_API_KEY;
  const to = process.env.LOGIN_ALERT_TO;
  if (!key || !to) return done(res);
  const sig = report.name + "|" + report.message;
  const now = Date.now();
  if (now - (seenSubjects.get(sig) || 0) < 60 * 60 * 1000 || !emails("all")) return done(res);
  seenSubjects.set(sig, now);
  if (seenSubjects.size > 200) seenSubjects.clear();

  const msg = buildErrorEmail(report, istTime(new Date()));
  try {
    await postResend({ to, subject: msg.subject, text: msg.text, html: msg.html });
  } catch { /* the log line above is enough */ }
  return done(res);
}
