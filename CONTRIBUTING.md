# Working on MeriDent

1. Branch from `main`; never push to `main` directly.
2. `npm ci`, then `npm run dev`.
3. Before opening a pull request run `npm run lint` and `npm test` (`npm run test:coverage` for the coverage floor).
   Database rules have their own tests: `npm run test:rules` (needs Java for the Firebase emulator).
4. Every change comes with a test. A security fix comes with a test that fails without it.
5. Secrets (keys, tokens, service accounts) go in environment variables, never in the repository.
6. Keep each pull request to one purpose. CI (quality gate, code scanning, rules tests, smoke test) must be green before merge.

Rules for patient data: see `SECURITY.md`. Ops: see `docs/runbook.md`.
