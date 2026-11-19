# MeriDent runbook

What to do when something breaks, and what to check every month. No secrets live in this file.

## Where things live

| Thing | Where |
|---|---|
| Website and API | Cloudflare Pages (project from this repo, `main` deploys to www.meridiandentalos.com) |
| Database and sign-in | Firebase project `meridian-dental` (Firestore, Auth) |
| Secrets | Cloudflare Pages, Settings, Variables and secrets. Public Firebase web config is in `.env.production` |
| Email | Resend (sender set by `MAIL_FROM`); company email on Titan (root DNS records, do not touch) |
| Monitoring | Better Stack, plus `.github/workflows/uptime.yml` (hourly) |
| Backups | `.github/workflows/backup.yml` (daily, encrypted), see `docs/cloudflare-pages.md` |
| DNS and domain | Cloudflare DNS; registrar BigRock; renew before 18 Oct 2027 |

## Admin dashboard (founder)

Signing in with an address listed in the `FOUNDER_EMAILS` secret opens the admin dashboard: who is online, hours online, plans and billing, and subscription requests. "Open my clinic" goes to the normal app; "Admin profile" at the bottom of the sidebar (under Settings) comes back. Sections: Overview (online now, hours, new clinics per week), Billing and approvals (renewals list, requests), Clinics (search, filter, sort, details and messages), Admin profile (follow-ups, CSV exports, goal, message templates, launch checklist, to-dos, notes).
- Clinics ask for a plan from Settings, Your plan. Approve only after the payment (UPI) has arrived; approving switches the plan on for 30 days (365 yearly).
- Online time comes from a small message every 5 minutes while a tab is open (collection `presence`). Each active clinic user costs about 12 reads and 12 writes per hour, so the free Firebase daily limits (50,000 reads, 20,000 writes) allow roughly 150 to 200 users online for 8 hours. Watch Firebase usage as the user count grows.
- Announcement banner: Admin profile, "Message to all clinics". Up to 240 characters of plain text, stored in `announcements/current` (server-only). Clinics check every 10 minutes and can dismiss it; a new message shows again. Needs `FIREBASE_SERVICE_ACCOUNT`. To remove it fast, press "Remove banner".
- To-dos, notes, goal, details and checklist ticks on the Admin profile are saved in the browser only (they do not follow you to another device).
- The collections `presence`, `planRequests`, `plans` and `announcements` are server-only. Browsers cannot read or write them (rules test: "plans, planRequests and presence are closed to every browser").

## When the site is down

1. Open Cloudflare, Workers & Pages, the project, Deployments. If the newest deployment failed, open the previous good one and choose Rollback.
2. If the deployment is fine, check Cloudflare status and Firebase status pages.
3. Check Better Stack for which URL failed (/, /login, /api/ai, /logo.png) and when it started.
4. Find the last change on `main` (`git log -5`). If it is the cause, revert it with a pull request. CI must pass before merging.

## When sign-in fails

- "Sign-in is only available on the official MeriDent website": the host is not in `src/allowedHosts.js`. Preview links do not sign in unless added through `VITE_EXTRA_AUTH_HOSTS`.
- "Sign-in is not set up": the `VITE_FIREBASE_*` values did not reach the build. Check `.env.production`.
- Firebase console, Authentication, Settings, Authorized domains must list the live domain.

## When email is not arriving

Check Resend, Emails, for the failure reason. If the domain shows "Not verified", recheck the DNS records in Cloudflare (set to DNS only).

## Restoring from backup

Backups are encrypted. Only the offline private key opens them.
1. Download the latest `merident-backup` artifact from the GitHub Actions run.
2. `node scripts/restore-backup.mjs <file> <private-key.pem>` prints counts per collection.
3. To restore, point `FIREBASE_SERVICE_ACCOUNT` at a TEST project and add `--restore --yes`. Restore into live only if live data is really lost.

## If a secret leaks

Rotate it in the provider first (Resend, Google AI, Firebase service account), then update the Cloudflare secret, then redeploy. Never paste secrets into chat, issues or pull requests.

## Monthly checklist

- [ ] Daily backup ran for a week and the artifact opens (`restore-backup.mjs` with no `--restore`).
- [ ] Better Stack: no unexplained incidents; uptime workflow green.
- [ ] Cloudflare Pages: last deployment healthy.
- [ ] Firebase: usage and billing still inside the free plan; budget alert set.
- [ ] Resend: monthly sends well under 3,000.
- [ ] Open Dependabot pull requests reviewed (test major upgrades on a preview first).
- [ ] Full test run green; stress run (`scripts/stress.mjs`) shows 0 failures.
- [ ] Domain and certificate expiry dates still comfortably away.
