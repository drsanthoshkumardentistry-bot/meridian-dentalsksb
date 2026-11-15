// Sends one plain e-mail through Resend. RESEND_API_KEY is required; MAIL_FROM must be an address on a domain verified in
// Resend (without it, Resend only delivers to the account owner's own address). Returns true when the mail was accepted.
export const mailReady = () => !!process.env.RESEND_API_KEY;

export const sendMail = async ({ to, subject, text, fetchFn = fetch }) => {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return false;
  try {
    const r = await fetchFn("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.MAIL_FROM || "MeriDent <onboarding@resend.dev>", to: [to], subject, text }),
    });
    return !!r.ok;
  } catch (e) { return false; }
};
