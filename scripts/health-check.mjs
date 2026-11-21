// Daily health check (GitHub Action). Reads the whole database once and checks four things, printing only counts:
//  1. estimated storage against the free 1 GB, 2. clinics whose records dropped sharply since yesterday,
//  3. an encrypt-and-decrypt self-test of the backup code with a throwaway key, 4. the database is not empty.
// Exit code 1 (so GitHub emails the owner) on a warning-level problem. Usage: node scripts/health-check.mjs [previous.json] [out.json]
import fs from "node:fs";
import crypto from "node:crypto";
import { readServiceAccount } from "../api/_lib/blockCore.js";
import { crawl, encryptBackup, decryptBackup } from "./backupCore.js";
import { newTally, addDoc, storageLevel, readsLevel, findDrops, topClinics, snapshot, checkBackup } from "./healthCore.js";

const sa = readServiceAccount();
if (!sa) { console.error("FIREBASE_SERVICE_ACCOUNT is missing or not valid JSON."); process.exit(1); }
const [prevPath, outPath] = [process.argv[2], process.argv[3]];
const prev = prevPath && fs.existsSync(prevPath) ? JSON.parse(fs.readFileSync(prevPath, "utf8")) : null;

const tally = newTally();
const sample = [];
await crawl({ sa, onDoc: (d) => { addDoc(tally, d); if (sample.length < 300) sample.push(d); } });

const problems = [];
const lines = [];
if (tally.docs === 0) problems.push("The database looks empty.");

const s = storageLevel(tally.bytes);
lines.push(`Documents: ${tally.docs}. Estimated storage: ${s.percent}% of 1 GB (${Math.round(tally.bytes / 1048576)} MB of data before index overhead).`);
if (s.level !== "ok") problems.push(`Storage is about ${s.percent}% of the free 1 GB (${s.level}). Clean up, compress or move to the Blaze plan with a budget alert.`);
const r = readsLevel(tally.docs);
lines.push(`Estimated daily reads if everyone opens the app ${5} times: ${r.reads} (${r.percent}% of the free 50,000).`);
if (r.level !== "ok") problems.push(`Daily reads could reach about ${r.percent}% of the free 50,000 (${r.level}). Move to the Blaze plan with a budget alert before more clinics join.`);
lines.push("Largest clinics: " + JSON.stringify(topClinics(tally)));

if (prev) {
  const drops = findDrops(prev, tally);
  if (drops.length) problems.push("Records dropped sharply since the last check: " + JSON.stringify(drops));
  lines.push(`Compared with ${prev.takenAt}: ${drops.length} sharp drop(s).`);
} else lines.push("No earlier snapshot to compare with yet.");

try {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048, publicKeyEncoding: { type: "spki", format: "pem" }, privateKeyEncoding: { type: "pkcs8", format: "pem" } });
  const back = decryptBackup(encryptBackup(sample, publicKey, { test: true }), privateKey);
  if (back.count !== sample.length || (sample[0] && back.docs[0].path !== sample[0].path)) problems.push("Backup self-test: the decrypted copy does not match.");
  else lines.push(`Backup self-test passed (${sample.length} documents encrypted and opened again). Opening the real daily file still needs your private key.`);
} catch (e) { problems.push("Backup self-test failed: " + e.message); }

// Backup freshness and size, from GitHub's own record of the daily backup job (needs GITHUB_TOKEN and GITHUB_REPOSITORY).
let backupBytes = 0;
const [ghToken, ghRepo] = [process.env.GITHUB_TOKEN, process.env.GITHUB_REPOSITORY];
if (ghToken && ghRepo) {
  try {
    const gh = async (path) => (await fetch(`https://api.github.com/repos/${ghRepo}/${path}`, { headers: { Authorization: `Bearer ${ghToken}`, Accept: "application/vnd.github+json" } })).json();
    const runs = await gh("actions/workflows/backup.yml/runs?status=success&per_page=1");
    const run = runs.workflow_runs && runs.workflow_runs[0];
    const art = run ? ((await gh(`actions/runs/${run.id}/artifacts`)).artifacts || [])[0] : null;
    backupBytes = art ? art.size_in_bytes : 0;
    const bp = checkBackup({ lastSuccessAt: run && run.created_at, bytes: backupBytes, expired: art && art.expired, prevBytes: prev && prev.backupBytes });
    problems.push(...bp);
    lines.push(bp.length ? "Backup check found a problem." : `Backup check passed: last success ${run.created_at}, file ${backupBytes} bytes.`);
  } catch (e) { lines.push("Backup check skipped (could not reach GitHub): " + e.message); }
} else lines.push("Backup check skipped (no GitHub token).");

if (outPath) fs.writeFileSync(outPath, JSON.stringify({ ...snapshot(tally), backupBytes }));
const report = [...lines, ...(problems.length ? ["", "PROBLEMS:", ...problems.map((p) => "- " + p)] : ["", "All checks passed."])].join("\n");
console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, "## MeriDent daily health check\n\n```\n" + report + "\n```\n");
process.exit(problems.length ? 1 : 0);
