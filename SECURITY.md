# Security policy

MeriDent handles patient records, so security reports are taken seriously and answered quickly.

## Reporting a problem

Please do not open a public issue for a security problem. Use GitHub's private route instead:
**Security tab → "Report a vulnerability"** on this repository. Include what you found, the steps to repeat it,
and (if you can) which clinic or account it touched. Do not access real patient data to prove a point.

What to expect: a first reply within 3 days, a fix or a plan within 14 days for serious problems, and credit
if you want it.

## What is protected

- Each clinic's data is separated by database rules that are tested in CI (`rules-tests/`).
- Patient links (estimates, portal) use 192-bit random tokens, expire on the server, and cannot be listed.
- Every printable page and every API handler is covered by tests against injected code and missing sign-in.
- Secrets live only in environment variables, never in the code.
- If data is ever exposed, follow `docs/breach-response.md`.

## Out of scope

Social engineering, attacks that need physical access to a phone, and denial-of-service by volume alone.
