// Sends e-mail through Resend. RESEND_API_KEY is required. Mail goes out from MAIL_FROM, or by default from an address on
// meridiandentalos.com (verified in Resend). If Resend refuses that sender, it retries once from Resend's shared test
// address, which only delivers to the Resend account owner, so owner alerts never go missing.
export const mailReady = () => !!process.env.RESEND_API_KEY;

export const DEFAULT_FROM = "MeriDent <alerts@meridiandentalos.com>";
export const FALLBACK_FROM = "MeriDent <onboarding@resend.dev>";

/** Posts one message to Resend and returns the fetch response (or { ok: false } if it could not be reached). */
export const postResend = async ({ to, subject, text, html, fetchFn = fetch }) => {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return { ok: false };
  const attempt = async (from) => {
    try {
      const body = { from, to: [to], subject, text };
      if (html) body.html = html;
      return await fetchFn("https://api.resend.com/emails", {
        method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
    } catch { return { ok: false }; }
  };
  const primary = process.env.MAIL_FROM || DEFAULT_FROM;
  const r = await attempt(primary);
  if (r.ok || primary === FALLBACK_FROM) return r;
  return attempt(FALLBACK_FROM);
};

/** Plain-text mail. Returns true when the mail was accepted. */
export const sendMail = async ({ to, subject, text, fetchFn = fetch }) => !!(await postResend({ to, subject, text, fetchFn })).ok;
