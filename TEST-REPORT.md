# MeriDent test-hardening report (15 Nov 2026)

Branch `test-hardening`. Tested against the code at `main` (PR #199). No real clinic data was touched; everything ran on test data, in the test runner or against a local build.

## Result in one line
Found and fixed 6 real bugs and added 59 tests (155 → 160 test files, 994 → 1,053 tests, all passing). The build, the 30,000-case stress run and a scan of the built files for secrets are all clean.

## What was tested
| Step | What | Result |
|---|---|---|
| 1 | Full test suite, build, stress script (30,000 cases) | Pass, 0 failures. Build warns only that `App` is 678 kB (large first load). |
| 1 | Firestore rules (emulator, clinic A vs clinic B, every role) | Not run here (the emulator will not download in this sandbox). Runs in GitHub Actions: last runs green. |
| 2 | Every menu screen with hostile saved data (script tags, emoji, Tamil, 10,000-character text, 0/negative/huge/NaN amounts, bad dates) | 1 crash found and fixed. Hostile text is shown as plain text and runs nothing. |
| 2 | Real browser (Chromium), 6 screen sizes from 320 px to 1920 px, 16 public URLs including attack URLs (script in query and hash, bad pay links, 5,000-character names) | No script errors, no sideways scroll, no XSS, no crash screens. |
| 2 | Login form with a hostile email, a 5,000-character password and 5 rapid submits; back, refresh | No crash, no XSS. |
| 3 | All 4 API endpoints: wrong method, no/forged/unverified token, broken and huge bodies, 100 rapid calls | 2 bugs found and fixed (below). Rate limits and error messages work as designed. |
| 3 | Built files scanned for API keys and secret names | None found. |
| 4 | Money: 0, negative, huge, decimal, NaN, overpayment, discount larger than the bill | 1 bug fixed (`NaN` shown). Rounding is correct (2.675 → 268 paise). |
| 4 | Dates: leap day, impossible dates, India vs UTC | 1 bug fixed. Membership date maths is correct. |
| 4 | 5,000 patients | Opens without a crash (about 4 s in the slow test environment; real phones not measured). |
| 4 | Deleting a patient who has visits and invoices | 1 privacy bug fixed. Invoices are kept on purpose (accounting records). |

## Bugs found and fixed
| # | Severity | Bug | Fix |
|---|---|---|---|
| 1 | High | **Public `/api/client-error` could be tied up.** One crafted long crash report took about 12 seconds of server time because the e-mail-hiding pattern is very slow on long text. No sign-in is needed, so anyone could repeat it. | Text is cut to size before the pattern runs (now under 1 ms). Same fix in the app's own error scrubber. |
| 2 | High | **Deleting a patient left their data behind.** The published patient-portal page (appointments, bills, first name) and all gallery photos stayed in the cloud and could no longer be removed from the app. | New `src/patientCleanup.js` removes the OPG, the portal page and every photo when the chart is deleted. |
| 3 | Medium | **One damaged payment line blanked the Dashboard and Reports.** A blank entry inside an invoice's payments crashed the whole app to the error screen. | Damaged payment lines are dropped when the invoice is read. |
| 4 | Medium | **`/api/whatsapp` crashed (500) on malformed JSON** instead of answering 400. | Bad bodies now answer 400. |
| 5 | Low | **Printed record sheet and backup file names showed yesterday's date** between midnight and 5:30 am India time (they used the UTC date). | Use the clinic's own calendar day. |
| 6 | Low | **A missing amount showed as "NaN"** on money screens. | Shows 0.00. |

New tests: `apiAttack` (20), `screenWalk` (14), `moneyEdge` (18), `patientCleanup` (4), `localDay` (2), plus 1 in `errorReport`.

## Not fixed, needs your decision
| Severity | Item |
|---|---|
| High (if WhatsApp is turned on) | **Anyone with a verified e-mail account can call `/api/whatsapp` and `/api/ai`.** The check is "signed in with Firebase", not "member of a clinic". Limits are held in memory per server instance, so they do not hold up under real traffic or many accounts. Before switching WhatsApp on, add a clinic-membership check and a per-clinic daily limit. |
| Medium | No `script-src` Content-Security-Policy in `vercel.json` (only framing and form rules). A full policy needs care because of Firebase, so it was not changed blind. |
| Medium | **Pay links can be forged.** Anyone can build a link that shows any clinic name with their own UPI ID. The page already warns patients to check the name; consider showing the clinic's registered name from the server instead. |
| Low | Public pages are blank when offline (no offline page or service worker). The Android app is not affected. |
| Low | Invoice amounts above ₹1 crore are silently capped. The calculation is safe, but check that the form tells the user. |
| Low | The Vite preview server answers 500 on a malformed address like `/%E0%A4%A`. Not checked on Vercel. |

## Not tested here (could not be, or needs a real device)
- Signed-in flows in a real browser with real Firebase (sign-up, each role, add/edit patient, visit, invoice, payment) and the Android app. These are covered only by the jsdom tests, not by real clicks.
- Two tabs editing the same record, and going offline in the middle of an edit (the app uses "last change wins" on reconnect).
- Real-phone speed with 5,000 patients.
- Firestore rules: only through CI.

## Top 5 risks to know about
1. **Open API access before WhatsApp is switched on** (see above). Do not enable WhatsApp until this is closed.
2. **Real-phone Android test is still outstanding**, including Google sign-in and offline use.
3. **Whole-collection streaming**: every clinic reads all patients, invoices and appointments on every open. This is fine for pilots, but read costs and load time grow with clinic age (the free daily read limit is 50,000).
4. **Offline edits use "last reconnect wins"**, so two staff editing the same record offline can overwrite each other.
5. **Backups exclude OPG images**, so a clinic restoring from backup loses them.
