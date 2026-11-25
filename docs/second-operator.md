# Second operator and support ownership

So MeriDent keeps running when one founder is busy. Names, phone numbers and where things are kept go in the blanks. Never write passwords, keys or key files in this document.

## 1. Access Sivasabari needs (tick when done)

| Tool | Level to give | Done |
|---|---|---|
| GitHub repo drsanthoshkumardentistry-bot/meridian-dentalsksb | Collaborator with Write (Admin if you trust the merge and secrets role) | [ ] |
| Cloudflare (Pages project and DNS) | Member of the account with Pages and DNS edit | [ ] |
| Firebase project meridian-dental | Editor (Owner only if needed to manage members) | [ ] |
| Resend (email) | Team member | [ ] |
| Better Stack (monitoring) | Team member, alerts to both phones | [ ] |
| Password manager | Shared vault with both founders | [ ] |
| Domain registrar (BigRock) | Second contact or delegated access | [ ] |
| Owner email alerts | Forward GitHub failure mails to Sivasabari too | [ ] |

Turn on two-step sign-in for every account above. Keep the backup recovery codes in the shared vault.

## 2. Things the second operator must be able to do

Each one has been tried once by Sivasabari, with the date written next to it.

- [ ] **Check the site and backups (5 minutes).** Open www.meridiandentalos.com and sign in. In GitHub, open the Actions tab and confirm the latest "Daily backup" and "Health" runs are green. Tried on: ________
- [ ] **Roll back a bad deploy.** Cloudflare, Workers and Pages, the project, Deployments, open the last good one, Rollback. Tried on: ________
- [ ] **Merge a fix.** Open a pull request, wait for every check to be green, then merge. Never merge with a failing check. Tried on: ________
- [ ] **Rotate a key.** Follow "If a secret leaks" in docs/runbook.md: change it at the provider first, then in Cloudflare (Variables and secrets), then redeploy. Tried on: ________
- [ ] **Open a backup without restoring.** Follow "Restoring from backup" in docs/runbook.md using only steps 1 and 2. Needs the offline private key. Tried on: ________
- [ ] **Remove the announcement banner** if a wrong message went out (Admin profile, Remove banner). Tried on: ________

## 3. Where the private backup key lives

Two places, both known to both founders. Write the place, not the key.
- Place 1: ____________________
- Place 2: ____________________
- Who can open each: ____________________

If both places are lost, old backups cannot be opened. Replace the key pair by following docs/cloudflare-pages.md and make a new backup the same day.

## 4. Who answers a clinic

| Situation | First person | If no reply in 2 hours | Target |
|---|---|---|---|
| Cannot sign in, data looks wrong, site down | ____________ | ____________ | First reply within 2 hours, 9 AM to 9 PM IST |
| How do I do X, billing question | ____________ | ____________ | Reply within 1 working day |
| Feature request, feedback | ____________ | ____________ | Logged, answered within a week |
| Possible data leak or lost records | Both founders at once | | Follow docs/breach-response.md |

Where clinics reach us: WhatsApp number ____________, email ____________. Tell clinics these hours and targets before they start, so nobody expects an instant reply.

## 5. Exam weeks

Before a busy exam period, the founder who is away writes one line in the shared chat: dates away, who is covering, and what not to touch. Do not change database rules, secrets or billing while the person who understands them is away.

## 6. Review

Read this page together every three months and update the blanks.
