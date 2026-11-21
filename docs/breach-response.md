# If patient data may have been exposed

Written for the founders (Santhoshkumar S, Sivasabari G). Keep calm, act in this order. Do not delete anything until step 4.

## 1. Contain (first hour)
1. Change the password on the account that may be affected (Google, GitHub, Cloudflare, Firebase, Resend). Turn on 2-step sign-in if it was off.
2. Firebase console, Authentication: disable any user that should not be there. Sign out all sessions if available.
3. If a key or token leaked, rotate it (Resend API key, backup private key, GitHub tokens, Cloudflare tokens) and update the environment variables in Cloudflare Pages. Never paste secrets in chat or code.
4. If the site itself is being abused, Cloudflare dashboard: turn on "Under Attack" mode for the domain.

## 2. Find out what happened (same day)
- Sentry and the Firestore audit log for odd activity. GitHub Actions run history for unexpected runs.
- Write down: what was exposed, which clinics, how many patients, when it began, how it was found.
- Keep screenshots and times. Do not edit or delete evidence.

## 3. Tell the clinics (without delay)
- The clinic owns its patient records, so tell each affected clinic owner first, by phone or WhatsApp, then in writing. Our privacy policy promises this.
- Say plainly: what happened, what data, what we have done, what they should do (for example inform patients), and who to call.
- Do not guess or play it down. Say what is not yet known.

## 4. Fix and restore
- Restore damaged or lost records from the newest restore point or the encrypted daily backup (`node scripts/restore-backup.mjs <backup.enc> <private-key.pem>` first without `--restore` to inspect).
- Close the hole, add a test that would have caught it, and ship it.

## 5. Report and learn
- Get legal advice on reporting duties under India's Digital Personal Data Protection Act, 2023 and any rules in force. Ask the lawyer or CA before the first paying clinic.
- Write a short note: cause, fix, what changes. Share it with affected clinics.

## Contacts to fill in
- Lawyer or CA: ____________
- Co-founder: Sivasabari G
- Cloudflare / Firebase / Resend support links: ____________
