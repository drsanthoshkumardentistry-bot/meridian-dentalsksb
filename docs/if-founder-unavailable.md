# If Santhoshkumar is unavailable (exams, illness, travel)

For Sivasabari G or a trusted person. Nothing here needs coding. Access, practice tasks and who answers clinics are in docs/second-operator.md.

## What keeps running by itself
- The website, sign-in and clinic data run on Cloudflare Pages and Firebase and need no daily action.
- Daily encrypted backup and daily health check run on GitHub. If something is wrong, an email goes to the owner.
- Clinics also get a restore point daily and a backup reminder every 3 days.

## What to check once a week (5 minutes)
1. Open www.meridiandentalos.com on a phone. Does it load and can you sign in?
2. Open the owner email. Any message from GitHub about a failed "health" or "backup" run?
3. Any WhatsApp from a clinic that cannot sign in or lost something?

## If a clinic reports a problem
- Ask: clinic name, what they did, a screenshot, the time.
- Records "missing": they can bring back a deleted patient from Recently deleted (30 days). Otherwise ask them to open Practice Profile and use a restore point.
- Cannot sign in: ask them to use "forgot password" with the same email.

## If something serious happens
- Follow docs/breach-response.md.
- Do not delete data. Do not change database rules without testing.

## Where things are (fill in; never write passwords here)
- Code: GitHub, drsanthoshkumardentistry-bot/meridian-dentalsksb
- Hosting: Cloudflare Pages. Database and sign-in: Firebase. Email: Resend. Domain: ____________
- Private backup key: kept in two places by Santhoshkumar: ____________ and ____________
- Passwords: in a password manager, shared access with Sivasabari: yes / no
