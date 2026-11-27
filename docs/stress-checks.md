# Random stress checks

`npm run fuzz -- 100000000` runs random checks on money, plans, visit notes and records and prints a JSON summary.
Each check is a rule that must hold for random input (for example: bill totals add up to the paisa, a payment can never
exceed the bill, a paid-up clinic is never locked, typed allergies survive loading). A failing input is printed with its
seed and index so it can be replayed with `npm run fuzz -- <count> <seed>`.

Last full run (28 Nov 2026): 100,000,000 checks, 0 failures, 248 seconds on 2 cores, seed 20261128.
The runner was also tried against deliberately broken logic and caught it (14,857 failures), so a clean run means something.
Not part of CI: it is long. The quick tests in `tests/` run on every change.
